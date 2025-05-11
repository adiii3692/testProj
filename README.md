# Service Monitor

A comprehensive service monitoring platform that tracks the health of various services (servers, databases, websites) and manages alert escalations.

## Features

- Real-time service health monitoring
- Configurable health checks
- Multi-level alert escalation system
- SMS, Email, and Voice call notifications
- Service verification workflow
- Modern web dashboard
- Role-based access control

## Tech Stack

### Frontend
- TypeScript
- React
- Material-UI
- React Query
- React Router

### Backend
- Go
- Gin Web Framework
- PostgreSQL
- Redis
- Twilio (for SMS and Voice calls)

## Project Structure

```
service-monitor/
├── frontend/           # React TypeScript frontend
├── backend/           # Go backend
│   ├── cmd/          # Application entry points
│   ├── internal/     # Private application code
│   └── pkg/          # Public library code
```

## Getting Started

### Prerequisites
- Node.js 18+
- Go 1.21+
- PostgreSQL 14+
- Redis 6+

### Development Setup

1. Clone the repository
2. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Set up the backend:
   ```bash
   cd backend
   go mod download
   go run cmd/api/main.go
   ```

4. Configure environment variables (see `.env.example` files in both frontend and backend directories)

## License

MIT 