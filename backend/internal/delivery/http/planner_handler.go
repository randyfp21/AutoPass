package http

import (
	"net/http"
	"strings"

	"github.com/autopass/backend/internal/delivery/http/middleware"
	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/usecase"
	"github.com/gin-gonic/gin"
)

// PlannerHandler handles HTTP requests for service planners.
type PlannerHandler struct {
	plannerUC usecase.PlannerUsecase
}

// NewPlannerHandler creates a new PlannerHandler.
func NewPlannerHandler(plannerUC usecase.PlannerUsecase) *PlannerHandler {
	return &PlannerHandler{plannerUC: plannerUC}
}

// GetUserPlanners godoc
// GET /api/v1/planners
func (h *PlannerHandler) GetUserPlanners(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)

	planners, err := h.plannerUC.GetUserPlanners(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch service planners"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": planners})
}

// CreatePlanner godoc
// POST /api/v1/planners
func (h *PlannerHandler) CreatePlanner(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)

	var req domain.CreatePlannerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	planner, err := h.plannerUC.CreatePlanner(c.Request.Context(), userID, req)
	if err != nil {
		msg := err.Error()
		if msg == "vehicle not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": msg})
			return
		}
		if strings.Contains(msg, "forbidden") {
			c.JSON(http.StatusForbidden, gin.H{"error": msg})
			return
		}
		if strings.Contains(msg, "invalid planned_date") {
			c.JSON(http.StatusBadRequest, gin.H{"error": msg})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create service planner"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": planner})
}

// UpdatePlanner godoc
// PUT /api/v1/planners/:id
func (h *PlannerHandler) UpdatePlanner(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)
	id := c.Param("id")

	var req domain.UpdatePlannerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	planner, err := h.plannerUC.UpdatePlanner(c.Request.Context(), id, userID, req)
	if err != nil {
		msg := err.Error()
		if msg == "planner not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": msg})
			return
		}
		if strings.Contains(msg, "forbidden") {
			c.JSON(http.StatusForbidden, gin.H{"error": msg})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update service planner"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": planner})
}

// DeletePlanner godoc
// DELETE /api/v1/planners/:id
func (h *PlannerHandler) DeletePlanner(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)
	id := c.Param("id")

	if err := h.plannerUC.DeletePlanner(c.Request.Context(), id, userID); err != nil {
		msg := err.Error()
		if msg == "planner not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": msg})
			return
		}
		if strings.Contains(msg, "forbidden") {
			c.JSON(http.StatusForbidden, gin.H{"error": msg})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete service planner"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "planner deleted successfully"})
}

// GetWorkshops godoc
// GET /api/v1/workshops
func (h *PlannerHandler) GetWorkshops(c *gin.Context) {
	workshops, err := h.plannerUC.GetWorkshops(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch registered workshops"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": workshops})
}
