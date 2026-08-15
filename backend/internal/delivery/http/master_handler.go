package http

import (
	"net/http"

	"github.com/autopass/backend/internal/usecase"
	"github.com/gin-gonic/gin"
)

// MasterHandler handles HTTP requests for master data (items catalogue).
type MasterHandler struct {
	serviceUC usecase.ServiceUsecase
}

// NewMasterHandler creates a new MasterHandler.
func NewMasterHandler(serviceUC usecase.ServiceUsecase) *MasterHandler {
	return &MasterHandler{serviceUC: serviceUC}
}

// GetMasterItems godoc
// GET /api/v1/master/items?vehicle_category=mobil|motor
func (h *MasterHandler) GetMasterItems(c *gin.Context) {
	vehicleCategory := c.Query("vehicle_category")

	// Validate optional filter value.
	if vehicleCategory != "" && vehicleCategory != "mobil" && vehicleCategory != "motor" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "vehicle_category must be 'mobil' or 'motor'"})
		return
	}

	items, err := h.serviceUC.GetMasterItems(c.Request.Context(), vehicleCategory)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch master items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}
