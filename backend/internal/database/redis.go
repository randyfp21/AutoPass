package database

import (
	"github.com/autopass/backend/internal/config"
	"github.com/redis/go-redis/v9"
)

// NewRedisClient creates and returns a new Redis client.
func NewRedisClient(cfg *config.Config) *redis.Client {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisHost,
		Password: cfg.RedisPassword,
		DB:       0,
	})
	return client
}
