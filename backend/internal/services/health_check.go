package services

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"
	"service-monitor/internal/models"
)

type HealthCheckService struct {
	db *sql.DB
}

func NewHealthCheckService(db *sql.DB) *HealthCheckService {
	return &HealthCheckService{db: db}
}

func (s *HealthCheckService) CheckService(ctx context.Context, service *models.Service) (*models.HealthCheck, error) {
	start := time.Now()

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Make request
	resp, err := client.Get(service.URL)
	if err != nil {
		return s.recordHealthCheck(ctx, service.ID, "down", 0, err.Error())
	}
	defer resp.Body.Close()

	// Calculate response time
	responseTime := time.Since(start).Milliseconds()

	// Check if status code is successful
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return s.recordHealthCheck(ctx, service.ID, "up", responseTime, "")
	}

	return s.recordHealthCheck(ctx, service.ID, "down", responseTime, fmt.Sprintf("HTTP %d", resp.StatusCode))
}

func (s *HealthCheckService) recordHealthCheck(ctx context.Context, serviceID int64, status string, responseTime int64, errorMsg string) (*models.HealthCheck, error) {
	query := `
		INSERT INTO health_checks (service_id, status, response_time, error)
		VALUES ($1, $2, $3, $4)
		RETURNING id, service_id, status, response_time, error, checked_at
	`

	var check models.HealthCheck
	err := s.db.QueryRowContext(ctx, query, serviceID, status, responseTime, errorMsg).Scan(
		&check.ID,
		&check.ServiceID,
		&check.Status,
		&check.ResponseTime,
		&check.Error,
		&check.CheckedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to record health check: %w", err)
	}

	return &check, nil
}

func (s *HealthCheckService) GetLatestHealthCheck(ctx context.Context, serviceID int64) (*models.HealthCheck, error) {
	query := `
		SELECT id, service_id, status, response_time, error, checked_at
		FROM health_checks
		WHERE service_id = $1
		ORDER BY checked_at DESC
		LIMIT 1
	`

	var check models.HealthCheck
	err := s.db.QueryRowContext(ctx, query, serviceID).Scan(
		&check.ID,
		&check.ServiceID,
		&check.Status,
		&check.ResponseTime,
		&check.Error,
		&check.CheckedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest health check: %w", err)
	}

	return &check, nil
} 