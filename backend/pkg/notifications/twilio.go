package notifications

import (
	"fmt"
	"github.com/twilio/twilio-go"
	twilioApi "github.com/twilio/twilio-go/rest/api/v2010"
	"service-monitor/internal/config"
)

type TwilioService struct {
	client     *twilio.RestClient
	fromNumber string
}

func NewTwilioService(cfg *config.TwilioConfig) *TwilioService {
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: cfg.AccountSID,
		Password: cfg.AuthToken,
	})

	return &TwilioService{
		client:     client,
		fromNumber: cfg.FromNumber,
	}
}

func (s *TwilioService) SendSMS(to, message string) error {
	params := &twilioApi.CreateMessageParams{
		To:   &to,
		From: &s.fromNumber,
		Body: &message,
	}

	_, err := s.client.Api.CreateMessage(params)
	if err != nil {
		return fmt.Errorf("failed to send SMS: %w", err)
	}

	return nil
}

func (s *TwilioService) MakeCall(to, message string) error {
	// Create a TwiML response for the call
	twiml := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
		<Response>
			<Say>%s</Say>
		</Response>`, message)

	params := &twilioApi.CreateCallParams{
		To:   &to,
		From: &s.fromNumber,
		Url:  &twiml,
	}

	_, err := s.client.Api.CreateCall(params)
	if err != nil {
		return fmt.Errorf("failed to make call: %w", err)
	}

	return nil
} 