package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/autopass/backend/internal/config"
	"github.com/autopass/backend/internal/database"
	deliveryHTTP "github.com/autopass/backend/internal/delivery/http"
	"github.com/autopass/backend/internal/delivery/http/middleware"
	"github.com/autopass/backend/internal/repository"
	"github.com/autopass/backend/internal/usecase"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file (ignore error in production where real env vars are set).
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	cfg := config.Load()

	// Set Gin mode.
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to PostgreSQL.
	db, err := database.NewPostgresPool(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()
	log.Println("Connected to PostgreSQL")

	// Connect to Redis.
	redisClient := database.NewRedisClient(cfg)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()
	log.Println("Connected to Redis")

	// Initialise repositories.
	userRepo := repository.NewUserRepository(db)
	vehicleRepo := repository.NewVehicleRepository(db)
	serviceRepo := repository.NewServiceRepository(db)
	plannerRepo := repository.NewPlannerRepository(db)
	threadRepo := repository.NewThreadRepository(db)

	// Initialise use cases.
	authUC := usecase.NewAuthUsecase(userRepo, redisClient, cfg)
	vehicleUC := usecase.NewVehicleUsecase(vehicleRepo, redisClient)
	serviceUC := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)
	plannerUC := usecase.NewPlannerUsecase(plannerRepo, vehicleRepo)
	threadUC := usecase.NewThreadUsecase(threadRepo)

	// Initialise HTTP handlers.
	authHandler := deliveryHTTP.NewAuthHandler(authUC)
	vehicleHandler := deliveryHTTP.NewVehicleHandler(vehicleUC)
	serviceHandler := deliveryHTTP.NewServiceHandler(serviceUC)
	masterHandler := deliveryHTTP.NewMasterHandler(serviceUC)
	plannerHandler := deliveryHTTP.NewPlannerHandler(plannerUC)
	threadHandler := deliveryHTTP.NewThreadHandler(threadUC)

	// Set up Gin router.
	router := gin.Default()

	// CORS middleware.
	corsConfig := cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(corsConfig))

	// Health check.
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "timestamp": time.Now().UTC()})
	})

	// API v1 group.
	v1 := router.Group("/api/v1")

	// Auth routes (public & protected).
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/logout", middleware.AuthMiddleware(authUC, redisClient), authHandler.Logout)
		auth.PUT("/profile", middleware.AuthMiddleware(authUC, redisClient), authHandler.UpdateProfile)
	}

	// Vehicle routes (protected).
	vehicles := v1.Group("/vehicles")
	vehicles.Use(middleware.AuthMiddleware(authUC, redisClient))
	{
		vehicles.GET("", vehicleHandler.GetUserVehicles)
		vehicles.POST("", vehicleHandler.CreateVehicle)
		vehicles.GET("/:id", vehicleHandler.GetVehicleByID)
		vehicles.PUT("/:id", vehicleHandler.UpdateVehicle)
		vehicles.DELETE("/:id", vehicleHandler.DeleteVehicle)

		// Service routes nested under vehicle.
		vehicles.GET("/:id/services", serviceHandler.GetServiceHistory)
		vehicles.POST("/:id/services", serviceHandler.CreateServiceRecord)
		vehicles.GET("/:id/services/:serviceId", serviceHandler.GetServiceRecordDetail)
	}

	// Service Planner routes (protected).
	planners := v1.Group("/planners")
	planners.Use(middleware.AuthMiddleware(authUC, redisClient))
	{
		planners.GET("", plannerHandler.GetUserPlanners)
		planners.POST("", plannerHandler.CreatePlanner)
		planners.PUT("/:id", plannerHandler.UpdatePlanner)
		planners.DELETE("/:id", plannerHandler.DeletePlanner)
	}

	// Odo Threads routes (protected).
	threads := v1.Group("/threads")
	threads.Use(middleware.AuthMiddleware(authUC, redisClient))
	{
		threads.GET("", threadHandler.GetThreads)
		threads.POST("", threadHandler.CreateThread)
		threads.GET("/bookmarks", threadHandler.GetBookmarkedThreads)
		threads.DELETE("/:id", threadHandler.DeleteThread)
		threads.POST("/:id/like", threadHandler.ToggleLikeThread)
		threads.POST("/:id/bookmark", threadHandler.ToggleBookmarkThread)
		threads.GET("/:id/comments", threadHandler.GetThreadComments)
		threads.POST("/:id/comments", threadHandler.CreateComment)
	}

	// Comments routes (protected).
	comments := v1.Group("/comments")
	comments.Use(middleware.AuthMiddleware(authUC, redisClient))
	{
		comments.POST("/:id/like", threadHandler.ToggleLikeComment)
	}

	// Activities & Notifications route (protected).
	v1.GET("/activities", middleware.AuthMiddleware(authUC, redisClient), threadHandler.GetActivities)
	v1.GET("/users/:id/threads", middleware.AuthMiddleware(authUC, redisClient), threadHandler.GetUserThreads)

	// Master data & workshop routes (public, cached).
	master := v1.Group("/master")
	{
		master.GET("/items", masterHandler.GetMasterItems)
	}

	v1.GET("/workshops", plannerHandler.GetWorkshops)

	// Start server with graceful shutdown.
	addr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("AutoPass API server starting on %s (env: %s)", addr, cfg.Env)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown on SIGINT/SIGTERM.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
	log.Println("Server exited cleanly")
}
