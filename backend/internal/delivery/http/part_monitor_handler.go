package http

import (
	"net/http"

	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/usecase"
	"github.com/gin-gonic/gin"
)

type PartMonitorHandler struct {
	partUC usecase.PartMonitorUsecase
}

func NewPartMonitorHandler(partUC usecase.PartMonitorUsecase) *PartMonitorHandler {
	return &PartMonitorHandler{partUC: partUC}
}

func (h *PartMonitorHandler) GetVehiclePartMonitors(c *gin.Context) {
	userID := c.GetString("userID")
	vehicleID := c.Param("id")

	monitors, err := h.partUC.GetVehiclePartMonitors(c.Request.Context(), vehicleID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": monitors})
}

func (h *PartMonitorHandler) UpdatePartMonitor(c *gin.Context) {
	userID := c.GetString("userID")
	vehicleID := c.Param("id")
	monitorID := c.Param("monitorId")

	var req domain.UpdatePartMonitorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.partUC.UpdatePartMonitor(c.Request.Context(), monitorID, vehicleID, userID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "part monitor updated successfully"})
}

func (h *PartMonitorHandler) ReplacePart(c *gin.Context) {
	userID := c.GetString("userID")
	vehicleID := c.Param("id")
	monitorID := c.Param("monitorId")

	var req domain.ReplacePartRequest
	_ = c.ShouldBindJSON(&req)

	if err := h.partUC.ReplacePart(c.Request.Context(), monitorID, vehicleID, userID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "part replacement recorded successfully"})
}
