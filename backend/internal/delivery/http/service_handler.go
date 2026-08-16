package http

import (
	"net/http"
	"strings"

	"github.com/autopass/backend/internal/delivery/http/middleware"
	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/usecase"
	"github.com/gin-gonic/gin"
)

// ServiceHandler handles HTTP requests for service records.
type ServiceHandler struct {
	serviceUC usecase.ServiceUsecase
}

// NewServiceHandler creates a new ServiceHandler.
func NewServiceHandler(serviceUC usecase.ServiceUsecase) *ServiceHandler {
	return &ServiceHandler{serviceUC: serviceUC}
}

// GetServiceHistory godoc
// GET /api/v1/vehicles/:vehicleId/services
func (h *ServiceHandler) GetServiceHistory(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)
	vehicleID := c.Param("vehicleId")
	if vehicleID == "" {
		vehicleID = c.Param("id")
	}

	records, err := h.serviceUC.GetServiceHistory(c.Request.Context(), vehicleID, userID)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch service history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": records})
}

// CreateServiceRecord godoc
// POST /api/v1/vehicles/:vehicleId/services
func (h *ServiceHandler) CreateServiceRecord(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)
	vehicleID := c.Param("vehicleId")
	if vehicleID == "" {
		vehicleID = c.Param("id")
	}

	var req domain.CreateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record, err := h.serviceUC.CreateServiceRecord(c.Request.Context(), vehicleID, userID, req)
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
		if strings.Contains(msg, "invalid service_date") {
			c.JSON(http.StatusBadRequest, gin.H{"error": msg})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create service record"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": record})
}

// GetServiceRecordDetail godoc
// GET /api/v1/vehicles/:vehicleId/services/:serviceId
func (h *ServiceHandler) GetServiceRecordDetail(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)
	serviceID := c.Param("serviceId")

	record, err := h.serviceUC.GetServiceRecordDetail(c.Request.Context(), serviceID, userID)
	if err != nil {
		msg := err.Error()
		if msg == "service record not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": msg})
			return
		}
		if strings.Contains(msg, "forbidden") {
			c.JSON(http.StatusForbidden, gin.H{"error": msg})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch service record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": record})
}

// DeleteServiceRecord godoc
// DELETE /api/v1/vehicles/:vehicleId/services/:serviceId
func (h *ServiceHandler) DeleteServiceRecord(c *gin.Context) {
	userID := c.GetString(middleware.ContextUserID)
	serviceID := c.Param("serviceId")

	if err := h.serviceUC.DeleteServiceRecord(c.Request.Context(), serviceID, userID); err != nil {
		msg := err.Error()
		if msg == "service record not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": msg})
			return
		}
		if strings.Contains(msg, "forbidden") {
			c.JSON(http.StatusForbidden, gin.H{"error": msg})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete service record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "service record deleted successfully"})
}
