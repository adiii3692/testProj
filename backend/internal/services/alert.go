package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"
	"service-monitor/internal/models"
	"service-monitor/pkg/notifications"
)

type AlertService struct {
	db            *sql.DB
	notifyService *notifications.TwilioService
}

func NewAlertService(db *sql.DB, notifyService *notifications.TwilioService) *AlertService {
	return &AlertService{
		db:            db,
		notifyService: notifyService,
	}
}

func (s *AlertService) CreateAlert(ctx context.Context, serviceID int64) (*models.Alert, error) {
	query := `
		INSERT INTO alerts (service_id, status, verification_status)
		VALUES ($1, 'active', 'pending')
		RETURNING id, service_id, status, started_at, resolved_at, verification_status, created_at, updated_at
	`

	var alert models.Alert
	err := s.db.QueryRowContext(ctx, query, serviceID).Scan(
		&alert.ID,
		&alert.ServiceID,
		&alert.Status,
		&alert.StartedAt,
		&alert.ResolvedAt,
		&alert.VerificationStatus,
		&alert.CreatedAt,
		&alert.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create alert: %w", err)
	}

	// Start notification process
	go s.startNotificationProcess(context.Background(), &alert)

	return &alert, nil
}

func (s *AlertService) startNotificationProcess(ctx context.Context, alert *models.Alert) {
	// Get escalation chain
	chain, err := s.getEscalationChain(ctx, alert.ServiceID)
	if err != nil {
		// Log error and return
		return
	}

	// Start with first level
	currentLevel := 1
	for currentLevel <= len(chain) {
		user := chain[currentLevel-1]
		
		// Try SMS first
		if err := s.notifyService.SendSMS(user.Phone, fmt.Sprintf("Service alert: Service ID %d is down", alert.ServiceID)); err != nil {
			// Log error and continue
		}

		// Wait for response or timeout
		responded := s.waitForResponse(ctx, alert.ID, user.ID, 5*time.Minute)
		if responded {
			return
		}

		// Try voice call
		if err := s.notifyService.MakeCall(user.Phone, fmt.Sprintf("Service alert: Service ID %d is down", alert.ServiceID)); err != nil {
			// Log error and continue
		}

		// Wait for response or timeout
		responded = s.waitForResponse(ctx, alert.ID, user.ID, 5*time.Minute)
		if responded {
			return
		}

		// Move to next level
		currentLevel++
	}
}

func (s *AlertService) getEscalationChain(ctx context.Context, serviceID int64) ([]models.User, error) {
	query := `
		SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, u.updated_at
		FROM escalation_chains ec
		JOIN users u ON u.id = ec.user_id
		WHERE ec.service_id = $1
		ORDER BY ec.level ASC
	`

	rows, err := s.db.QueryContext(ctx, query, serviceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get escalation chain: %w", err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Phone,
			&user.Role,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}

func (s *AlertService) waitForResponse(ctx context.Context, alertID, userID int64, timeout time.Duration) bool {
	// Create a channel to receive the response
	responseChan := make(chan bool)
	
	// Start a goroutine to check for response
	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				// Check if user has responded
				query := `
					SELECT responded_at IS NOT NULL
					FROM alert_notifications
					WHERE alert_id = $1 AND user_id = $2
					ORDER BY sent_at DESC
					LIMIT 1
				`
				var responded bool
				err := s.db.QueryRowContext(ctx, query, alertID, userID).Scan(&responded)
				if err == nil && responded {
					responseChan <- true
					return
				}
			case <-ctx.Done():
				responseChan <- false
				return
			}
		}
	}()

	// Wait for response or timeout
	select {
	case responded := <-responseChan:
		return responded
	case <-time.After(timeout):
		return false
	}
}

func (s *AlertService) ResolveAlert(ctx context.Context, alertID int64) error {
	query := `
		UPDATE alerts
		SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	_, err := s.db.ExecContext(ctx, query, alertID)
	if err != nil {
		return fmt.Errorf("failed to resolve alert: %w", err)
	}

	return nil
}

func (s *AlertService) VerifyAlert(ctx context.Context, alertID int64) error {
	query := `
		UPDATE alerts
		SET verification_status = 'verified'
		WHERE id = $1
	`

	_, err := s.db.ExecContext(ctx, query, alertID)
	if err != nil {
		return fmt.Errorf("failed to verify alert: %w", err)
	}

	return nil
} 