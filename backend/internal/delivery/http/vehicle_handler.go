package http

import (
	"net/http"
	"strings"

	"github.com/autopass/backend/internal/delivery/http/middleware"
	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/usecase"
	"github.com/gin-gonic/gin"
)

// VehicleHandler handles HTTP requests for vehicle management.
type VehicleHandler struct {
	vehicleUC usecase.VehicleUsecase
}

// NewVehicleHandler creates a new VehicleHandler.
func NewVehicleHandler(vehicleUC usecase.VehicleUsecase) *VehicleHandler {
	return &VehicleHandler{vehicleUC: vehicleUC}
}

// GetUserVehicles godoc
// GET /api/v1/vehicles
func (h *VehicleHandler) GetUserVehicles(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)

	vehicles, err := h.vehicleUC.GetUserVehicles(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch vehicles"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": vehicles})
}

// CreateVehicle godoc
// POST /api/v1/vehicles
func (h *VehicleHandler) CreateVehicle(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)

	var req domain.CreateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	vehicle, err := h.vehicleUC.CreateVehicle(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create vehicle"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": vehicle})
}

// GetVehicleByID godoc
// GET /api/v1/vehicles/:id
func (h *VehicleHandler) GetVehicleByID(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)
	vehicleID := c.Param("id")

	vehicle, err := h.vehicleUC.GetVehicleByID(c.Request.Context(), vehicleID, userID)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch vehicle"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": vehicle})
}

// UpdateVehicle godoc
// PUT /api/v1/vehicles/:id
func (h *VehicleHandler) UpdateVehicle(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)
	vehicleID := c.Param("id")

	var req domain.UpdateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	vehicle, err := h.vehicleUC.UpdateVehicle(c.Request.Context(), vehicleID, userID, req)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update vehicle"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": vehicle})
}

// DeleteVehicle godoc
// DELETE /api/v1/vehicles/:id
func (h *VehicleHandler) DeleteVehicle(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)
	vehicleID := c.Param("id")

	if err := h.vehicleUC.DeleteVehicle(c.Request.Context(), vehicleID, userID); err != nil {
		msg := err.Error()
		if msg == "vehicle not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": msg})
			return
		}
		if strings.Contains(msg, "forbidden") {
			c.JSON(http.StatusForbidden, gin.H{"error": msg})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete vehicle"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "vehicle deleted successfully"})
}
