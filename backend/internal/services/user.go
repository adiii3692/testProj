package services

import (
	"context"
	"database/sql"
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"service-monitor/internal/models"
)

type UserService struct {
	db *sql.DB
}

func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) CreateUser(ctx context.Context, user *models.User) (*models.User, error) {
	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	query := `
		INSERT INTO users (name, email, phone, password, role)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, name, email, phone, role, created_at, updated_at
	`

	var newUser models.User
	err = s.db.QueryRowContext(ctx, query,
		user.Name,
		user.Email,
		user.Phone,
		string(hashedPassword),
		user.Role,
	).Scan(
		&newUser.ID,
		&newUser.Name,
		&newUser.Email,
		&newUser.Phone,
		&newUser.Role,
		&newUser.CreatedAt,
		&newUser.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &newUser, nil
} 