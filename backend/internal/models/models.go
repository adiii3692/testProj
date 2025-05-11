package models

import (
	"time"
)

type Service struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Type        string    `json:"type" db:"type"`
	URL         string    `json:"url" db:"url"`
	Config      string    `json:"config" db:"config"` // JSON string
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type User struct {
	ID        int64     `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Email     string    `json:"email" db:"email"`
	Phone     string    `json:"phone" db:"phone"`
	Password  string    `json:"-" db:"password"`
	Role      string    `json:"role" db:"role"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type EscalationChain struct {
	ID        int64     `json:"id" db:"id"`
	ServiceID int64     `json:"service_id" db:"service_id"`
	Level     int       `json:"level" db:"level"`
	UserID    int64     `json:"user_id" db:"user_id"`
	WaitTime  int       `json:"wait_time" db:"wait_time"` // in minutes
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type HealthCheck struct {
	ID           int64     `json:"id" db:"id"`
	ServiceID    int64     `json:"service_id" db:"service_id"`
	Status       string    `json:"status" db:"status"`
	ResponseTime int64     `json:"response_time" db:"response_time"` // in milliseconds
	Error        string    `json:"error" db:"error"`
	CheckedAt    time.Time `json:"checked_at" db:"checked_at"`
}

type Alert struct {
	ID                int64     `json:"id" db:"id"`
	ServiceID         int64     `json:"service_id" db:"service_id"`
	Status            string    `json:"status" db:"status"`
	StartedAt         time.Time `json:"started_at" db:"started_at"`
	ResolvedAt        time.Time `json:"resolved_at" db:"resolved_at"`
	VerificationStatus string    `json:"verification_status" db:"verification_status"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

type AlertNotification struct {
	ID          int64     `json:"id" db:"id"`
	AlertID     int64     `json:"alert_id" db:"alert_id"`
	UserID      int64     `json:"user_id" db:"user_id"`
	Channel     string    `json:"channel" db:"channel"` // sms, email, voice
	Status      string    `json:"status" db:"status"`
	SentAt      time.Time `json:"sent_at" db:"sent_at"`
	RespondedAt time.Time `json:"responded_at" db:"responded_at"`
} 