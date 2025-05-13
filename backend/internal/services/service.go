package services

import (
	"context"
	"database/sql"
	"fmt"
	"service-monitor/internal/models"
)

type ServiceService struct {
	db *sql.DB
}

func NewServiceService(db *sql.DB) *ServiceService {
	return &ServiceService{db: db}
}

func (s *ServiceService) CreateService(ctx context.Context, service *models.Service) (*models.Service, error) {
	query := `
		INSERT INTO services (name, type, url, config)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, type, url, config, created_at, updated_at
	`

	var newService models.Service
	err := s.db.QueryRowContext(ctx, query,
		service.Name,
		service.Type,
		service.URL,
		service.Config,
	).Scan(
		&newService.ID,
		&newService.Name,
		&newService.Type,
		&newService.URL,
		&newService.Config,
		&newService.CreatedAt,
		&newService.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create service: %w", err)
	}

	return &newService, nil
}

func (s *ServiceService) GetService(ctx context.Context, id int64) (*models.Service, error) {
	query := `
		SELECT id, name, type, url, config, created_at, updated_at
		FROM services
		WHERE id = $1
	`

	var service models.Service
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&service.ID,
		&service.Name,
		&service.Type,
		&service.URL,
		&service.Config,
		&service.CreatedAt,
		&service.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("service not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get service: %w", err)
	}

	return &service, nil
}

func (s *ServiceService) UpdateService(ctx context.Context, service *models.Service) (*models.Service, error) {
	query := `
		UPDATE services
		SET name = $1, type = $2, url = $3, config = $4, updated_at = CURRENT_TIMESTAMP
		WHERE id = $5
		RETURNING id, name, type, url, config, created_at, updated_at
	`

	var updatedService models.Service
	err := s.db.QueryRowContext(ctx, query,
		service.Name,
		service.Type,
		service.URL,
		service.Config,
		service.ID,
	).Scan(
		&updatedService.ID,
		&updatedService.Name,
		&updatedService.Type,
		&updatedService.URL,
		&updatedService.Config,
		&updatedService.CreatedAt,
		&updatedService.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("service not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update service: %w", err)
	}

	return &updatedService, nil
}

func (s *ServiceService) DeleteService(ctx context.Context, id int64) error {
	query := `DELETE FROM services WHERE id = $1`
	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete service: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("service not found")
	}

	return nil
}

func (s *ServiceService) ListServices(ctx context.Context) ([]*models.Service, error) {
	query := `
		SELECT id, name, type, url, config, created_at, updated_at
		FROM services
		ORDER BY created_at DESC
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query services: %w", err)
	}
	defer rows.Close()

	var services []*models.Service
	for rows.Next() {
		var service models.Service
		err := rows.Scan(
			&service.ID,
			&service.Name,
			&service.Type,
			&service.URL,
			&service.Config,
			&service.CreatedAt,
			&service.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan service: %w", err)
		}
		services = append(services, &service)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating services: %w", err)
	}

	return services, nil
} 