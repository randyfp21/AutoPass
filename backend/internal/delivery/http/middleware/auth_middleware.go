package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/autopass/backend/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

const (
	ContextUserID = "userID"
	ContextEmail  = "email"
	ContextRole   = "role"
)

// AuthMiddleware validates the Bearer JWT token and sets user context values.
func AuthMiddleware(authUC usecase.AuthUsecase, redisClient *redis.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			return
		}

		tokenString := parts[1]

		// Check token blacklist in Redis.
		blacklistKey := fmt.Sprintf("blacklist:%s", tokenString)
		val, err := redisClient.Get(c.Request.Context(), blacklistKey).Result()
		if err == nil && val == "1" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token has been invalidated"})
			return
		}

		claims, err := authUC.ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextEmail, claims.Email)
		c.Set(ContextRole, claims.Role)
		c.Next()
	}
}
