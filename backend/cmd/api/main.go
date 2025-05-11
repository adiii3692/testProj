package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"service-monitor/internal/config"
	// "service-monitor/internal/services" // removed unused import
	"service-monitor/pkg/database"
	"service-monitor/pkg/notifications"
	"service-monitor/internal/models"
)

var db *sql.DB

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	db, err = database.NewPostgresDB(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Redis
	redis, err := database.NewRedisClient(&cfg.Redis)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redis.Close()

	// Initialize services
	notifyService := notifications.NewTwilioService(&cfg.Twilio)
	_ = notifyService // keep for future use

	// Initialize router
	router := gin.Default()

	// API routes
	api := router.Group("/api")
	{
		// Service routes
		services := api.Group("/services")
		{
			services.POST("", createService)
			services.GET("", listServices)
			services.GET("/:id", getService)
			services.PUT("/:id", updateService)
			services.DELETE("/:id", deleteService)
		}

		// Health check routes
		health := api.Group("/health")
		{
			health.GET("/:id", checkServiceHealth)
			health.GET("/:id/history", getHealthHistory)
		}

		// Alert routes
		alerts := api.Group("/alerts")
		{
			alerts.GET("", listAlerts)
			alerts.GET("/:id", getAlert)
			alerts.POST("/:id/resolve", resolveAlert)
			alerts.POST("/:id/verify", verifyAlert)
		}

		// User routes
		users := api.Group("/users")
		{
			users.POST("", createUser)
			users.GET("", listUsers)
			users.GET("/:id", getUser)
			users.PUT("/:id", updateUser)
			users.DELETE("/:id", deleteUser)
		}

		// Escalation chain routes
		escalation := api.Group("/escalation")
		{
			escalation.POST("", createEscalationChain)
			escalation.GET("/:service_id", getEscalationChain)
			escalation.PUT("/:id", updateEscalationChain)
			escalation.DELETE("/:id", deleteEscalationChain)
		}

		// Settings routes
		settings := api.Group("/settings")
		{
			settings.GET("", getSettings)
			settings.PUT("", updateSettings)
		}
	}

	// Create server
	srv := &http.Server{
		Addr:    fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")
}

// --- Handler Stubs ---

func createService(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func listServices(c *gin.Context) {
	query := `
		SELECT id, name, type, url, config, created_at, updated_at
		FROM services
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(c.Request.Context(), query)
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to fetch services: %v", err)})
		return
	}
	defer rows.Close()

	var services []models.Service
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
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to scan service: %v", err)})
			return
		}
		services = append(services, service)
	}

	if err = rows.Err(); err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Error iterating services: %v", err)})
		return
	}

	c.JSON(200, services)
}

func getService(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func updateService(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func deleteService(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func checkServiceHealth(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func getHealthHistory(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func listAlerts(c *gin.Context) {
	query := `
		SELECT a.id, a.service_id, s.name as service_name, a.status, 
		       a.started_at, a.resolved_at, a.verification_status,
		       a.created_at, a.updated_at
		FROM alerts a
		JOIN services s ON s.id = a.service_id
		ORDER BY a.created_at DESC
	`

	rows, err := db.QueryContext(c.Request.Context(), query)
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to fetch alerts: %v", err)})
		return
	}
	defer rows.Close()

	var alerts []struct {
		models.Alert
		ServiceName string `json:"service_name"`
	}
	for rows.Next() {
		var alert struct {
			models.Alert
			ServiceName string `json:"service_name"`
		}
		err := rows.Scan(
			&alert.ID,
			&alert.ServiceID,
			&alert.ServiceName,
			&alert.Status,
			&alert.StartedAt,
			&alert.ResolvedAt,
			&alert.VerificationStatus,
			&alert.CreatedAt,
			&alert.UpdatedAt,
		)
		if err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to scan alert: %v", err)})
			return
		}
		alerts = append(alerts, alert)
	}

	if err = rows.Err(); err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Error iterating alerts: %v", err)})
		return
	}

	c.JSON(200, alerts)
}

func getAlert(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func resolveAlert(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func verifyAlert(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func createUser(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func listUsers(c *gin.Context) {
	query := `
		SELECT id, name, email, phone, role, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`

	rows, err := db.QueryContext(c.Request.Context(), query)
	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to fetch users: %v", err)})
		return
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
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to scan user: %v", err)})
			return
		}
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Error iterating users: %v", err)})
		return
	}

	c.JSON(200, users)
}

func getUser(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func updateUser(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func deleteUser(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func createEscalationChain(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func getEscalationChain(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func updateEscalationChain(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

func deleteEscalationChain(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"}) // TODO: implement
}

// Settings handlers
func getSettings(c *gin.Context) {
	query := `
		SELECT check_interval, alert_threshold, enable_notifications, 
		       enable_email_alerts, enable_sms_alerts, smtp_server, 
		       smtp_port, smtp_username, smtp_password
		FROM settings
		LIMIT 1
	`

	var settings struct {
		CheckInterval       int    `json:"checkInterval"`
		AlertThreshold     int    `json:"alertThreshold"`
		EnableNotifications bool   `json:"enableNotifications"`
		EnableEmailAlerts  bool   `json:"enableEmailAlerts"`
		EnableSMSAlerts    bool   `json:"enableSMSAlerts"`
		SMTPServer         string `json:"smtpServer"`
		SMTPPort           int    `json:"smtpPort"`
		SMTPUsername       string `json:"smtpUsername"`
		SMTPPassword       string `json:"smtpPassword"`
	}

	err := db.QueryRowContext(c.Request.Context(), query).Scan(
		&settings.CheckInterval,
		&settings.AlertThreshold,
		&settings.EnableNotifications,
		&settings.EnableEmailAlerts,
		&settings.EnableSMSAlerts,
		&settings.SMTPServer,
		&settings.SMTPPort,
		&settings.SMTPUsername,
		&settings.SMTPPassword,
	)

	if err == sql.ErrNoRows {
		// Return default settings if none exist
		c.JSON(200, gin.H{
			"checkInterval": 300,
			"alertThreshold": 3,
			"enableNotifications": true,
			"enableEmailAlerts": true,
			"enableSMSAlerts": true,
			"smtpServer": "",
			"smtpPort": 587,
			"smtpUsername": "",
			"smtpPassword": "",
		})
		return
	}

	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to fetch settings: %v", err)})
		return
	}

	c.JSON(200, settings)
}

func updateSettings(c *gin.Context) {
	var settings struct {
		CheckInterval       int    `json:"checkInterval"`
		AlertThreshold     int    `json:"alertThreshold"`
		EnableNotifications bool   `json:"enableNotifications"`
		EnableEmailAlerts  bool   `json:"enableEmailAlerts"`
		EnableSMSAlerts    bool   `json:"enableSMSAlerts"`
		SMTPServer         string `json:"smtpServer"`
		SMTPPort           int    `json:"smtpPort"`
		SMTPUsername       string `json:"smtpUsername"`
		SMTPPassword       string `json:"smtpPassword"`
	}

	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(400, gin.H{"error": fmt.Sprintf("Invalid request body: %v", err)})
		return
	}

	query := `
		INSERT INTO settings (
			check_interval, alert_threshold, enable_notifications,
			enable_email_alerts, enable_sms_alerts, smtp_server,
			smtp_port, smtp_username, smtp_password
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			check_interval = EXCLUDED.check_interval,
			alert_threshold = EXCLUDED.alert_threshold,
			enable_notifications = EXCLUDED.enable_notifications,
			enable_email_alerts = EXCLUDED.enable_email_alerts,
			enable_sms_alerts = EXCLUDED.enable_sms_alerts,
			smtp_server = EXCLUDED.smtp_server,
			smtp_port = EXCLUDED.smtp_port,
			smtp_username = EXCLUDED.smtp_username,
			smtp_password = EXCLUDED.smtp_password
	`

	_, err := db.ExecContext(c.Request.Context(), query,
		settings.CheckInterval,
		settings.AlertThreshold,
		settings.EnableNotifications,
		settings.EnableEmailAlerts,
		settings.EnableSMSAlerts,
		settings.SMTPServer,
		settings.SMTPPort,
		settings.SMTPUsername,
		settings.SMTPPassword,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to update settings: %v", err)})
		return
	}

	c.JSON(200, settings)
} 