package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type ServiceType string

const (
	ServiceTypeHTTP    ServiceType = "http"
	ServiceTypeTCP     ServiceType = "tcp"
	ServiceTypeICMP    ServiceType = "icmp"
	ServiceTypeCustom  ServiceType = "custom"
)

type ServiceConfig struct {
	Method            string            `json:"method,omitempty"`
	Headers           map[string]string `json:"headers,omitempty"`
	Body              string            `json:"body,omitempty"`
	ExpectedStatus    int               `json:"expectedStatus,omitempty"`
	Timeout           int               `json:"timeout,omitempty"`
	CheckInterval     int               `json:"checkInterval,omitempty"`
	RetryCount        int               `json:"retryCount,omitempty"`
	SuccessThreshold  int               `json:"successThreshold,omitempty"`
	FailureThreshold  int               `json:"failureThreshold,omitempty"`
	CustomScript      string            `json:"customScript,omitempty"`
}

func (c ServiceConfig) Value() (driver.Value, error) {
	return json.Marshal(c)
}

func (c *ServiceConfig) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, c)
}

type Service struct {
	ID        int64         `json:"id"`
	Name      string        `json:"name"`
	Type      ServiceType   `json:"type"`
	URL       string        `json:"url"`
	Config    ServiceConfig `json:"config"`
	CreatedAt time.Time     `json:"createdAt"`
	UpdatedAt time.Time     `json:"updatedAt"`
} 