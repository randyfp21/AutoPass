package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireRole returns a middleware that enforces one of the given roles.
// It reads the role set by AuthMiddleware from gin.Context.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowedRoles := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowedRoles[r] = struct{}{}
	}

	return func(c *gin.Context) {
		role, exists := c.Get(ContextRole)
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "role not found in context"})
			return
		}

		roleStr, ok := role.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid role type in context"})
			return
		}

		if _, allowed := allowedRoles[roleStr]; !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "you do not have permission to access this resource",
			})
			return
		}

		c.Next()
	}
}
