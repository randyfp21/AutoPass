package http

import (
	"net/http"

	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/usecase"
	"github.com/gin-gonic/gin"
)

type ThreadHandler struct {
	threadUC usecase.ThreadUsecase
}

func NewThreadHandler(threadUC usecase.ThreadUsecase) *ThreadHandler {
	return &ThreadHandler{threadUC: threadUC}
}

func (h *ThreadHandler) GetThreads(c *gin.Context) {
	userID := c.GetString("userID")
	category := c.Query("category")

	threads, err := h.threadUC.GetThreads(c.Request.Context(), userID, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": threads})
}

func (h *ThreadHandler) CreateThread(c *gin.Context) {
	userID := c.GetString("userID")
	var req domain.CreateThreadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	thread, err := h.threadUC.CreateThread(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": thread})
}

func (h *ThreadHandler) DeleteThread(c *gin.Context) {
	userID := c.GetString("userID")
	threadID := c.Param("id")

	if err := h.threadUC.DeleteThread(c.Request.Context(), threadID, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"message": "thread deleted successfully"}})
}

func (h *ThreadHandler) ToggleLikeThread(c *gin.Context) {
	userID := c.GetString("userID")
	threadID := c.Param("id")

	isLiked, err := h.threadUC.ToggleLikeThread(c.Request.Context(), threadID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"is_liked": isLiked}})
}

func (h *ThreadHandler) ToggleBookmarkThread(c *gin.Context) {
	userID := c.GetString("userID")
	threadID := c.Param("id")

	isBookmarked, err := h.threadUC.ToggleBookmarkThread(c.Request.Context(), threadID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"is_bookmarked": isBookmarked}})
}

func (h *ThreadHandler) GetBookmarkedThreads(c *gin.Context) {
	userID := c.GetString("userID")

	threads, err := h.threadUC.GetBookmarkedThreads(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": threads})
}

func (h *ThreadHandler) GetUserThreads(c *gin.Context) {
	currentUserID := c.GetString("userID")
	targetUserID := c.Param("id")

	threads, err := h.threadUC.GetUserThreads(c.Request.Context(), targetUserID, currentUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": threads})
}

func (h *ThreadHandler) GetThreadComments(c *gin.Context) {
	userID := c.GetString("userID")
	threadID := c.Param("id")

	comments, err := h.threadUC.GetThreadComments(c.Request.Context(), threadID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": comments})
}

func (h *ThreadHandler) CreateComment(c *gin.Context) {
	userID := c.GetString("userID")
	threadID := c.Param("id")

	var req domain.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment, err := h.threadUC.CreateComment(c.Request.Context(), threadID, userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": comment})
}

func (h *ThreadHandler) ToggleLikeComment(c *gin.Context) {
	userID := c.GetString("userID")
	commentID := c.Param("id")

	isLiked, err := h.threadUC.ToggleLikeComment(c.Request.Context(), commentID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"is_liked": isLiked}})
}

func (h *ThreadHandler) GetActivities(c *gin.Context) {
	userID := c.GetString("userID")

	activities, err := h.threadUC.GetUserNotifications(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": activities})
}
