# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Brandician AI is a React-based web application that guides users through AI-driven brand identity creation. The app follows a multi-step workflow from initial brand questionnaires to final asset generation.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (includes TypeScript compilation)
npm run build

# Preview production build
npm run preview
```

Note: No test scripts are currently configured in this project.

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with Framer Motion animations
- **State**: Zustand with persistence
- **Routing**: React Router v6 with protected routes
- **HTTP**: Axios with interceptors and token refresh

### State Management
Two main Zustand stores handle application state:
- `src/store/auth.ts` - Authentication, OTP verification, session management
- `src/store/brand.ts` - Brand data, questions, answers, workflow state

### Brand Workflow Progression
The application follows a linear brand development workflow:
1. Brand list → Create brand → Explanation → Questionnaire
2. Jobs-to-be-Done analysis → Survey creation → Feedback collection
3. Feedback review → Name selection → Asset generation
4. Payment collection → Asset download completion

Routes are structured as `/brands/:brandId/[step]` with navigation controlled by brand status progression from the backend.

### API Integration
- Centralized client in `src/lib/api.ts` with automatic token refresh
- Environment-based configuration via `VITE_API_URL`
- Comprehensive error handling with user-friendly messages
- Debug mode available via `VITE_DEBUG` environment variable

### Component Organization
- Feature-based component structure in `src/components/`
- Container/Presentational pattern with TypeScript interfaces
- Shared components in `src/components/common/`
- Custom hooks for business logic separation

## Key Implementation Patterns

### Authentication Flow
Uses email + OTP verification with JWT tokens. The AuthGuard component protects routes and automatically redirects to login when tokens expire.

### Survey System
Supports multiple question types (text, single/multiple choice, rating) with dynamic form generation. Survey links are generated for external feedback collection.

### Voice Input
Questionnaire components support voice input with automatic transcription for improved user experience.

### Payment Flow
The payment screen (`/brands/:brandId/payment`) collects:
- Pay-what-you-want contribution amounts  
- 5-star ratings and public testimonials (stored in localStorage temporarily)
- Internal feedback for service improvement (stored in localStorage temporarily)
- Creates real payment sessions via `/api/v1.0/payments/checkout`
- Redirects to external payment processor (Stripe/PayPal)
- Payment success page (`/brands/:brandId/payment/success`) verifies payment status
- Uses progress endpoint to advance to completion after successful payment

### Domain Registration
Brand name selection supports domain registration via `/api/v1.0/brands/{brand_id}/register-domains/` endpoint that integrates with multiple domain providers.

## Environment Configuration

### Development
For local development, create a `.env` file:
```env
VITE_API_URL=http://localhost:8000  # Backend API URL
VITE_DEBUG=true                     # Enable debug logging
```

### Runtime Configuration (Docker)
The application uses runtime environment variable injection via `/config.js` generated at container startup. This allows changing environment variables without rebuilding the container.

- Configuration service: `src/config.ts`
- Docker entrypoint: `docker-entrypoint.sh`
- Runtime config loaded in: `index.html`

## Deployment

### Docker Build & Run
```bash
# Build the container (only needs to be done once)
docker build -t brandician-front .

# Run with runtime environment variables
docker run -p 8080:8080 \
  -e VITE_API_URL=https://api.production.com \
  -e VITE_DEBUG=false \
  brandician-front
```

### Google Cloud Run Deployment Script

The project includes `deploy.ps1` for automated deployment:

#### Initial Deployment (First Time)
```powershell
# Set environment variable to trigger initial deployment
$env:INITIAL_DEPLOY = "1"

# Deploy with service name
.\deploy.ps1 brandician-front --region europe-west3 --project-id YOUR_PROJECT_ID
```

This will:
1. Build the Docker image
2. Create `vars/brandician-front.yaml` with default environment variables
3. Let you edit the YAML file before deployment
4. Deploy to Cloud Run with the specified environment variables

#### Code Updates (Regular Deployments)
```powershell
# Regular deployment (no INITIAL_DEPLOY variable)
.\deploy.ps1 brandician-front --region europe-west3 --project-id YOUR_PROJECT_ID
```

This will:
1. Build the Docker image with latest code
2. Push to Google Cloud Registry
3. Deploy to Cloud Run **WITHOUT changing environment variables**
4. Existing runtime configuration is preserved

#### Updating Environment Variables
To change environment variables without code changes:
1. Go to Cloud Run console
2. Select your service
3. Click "Edit & Deploy New Revision"
4. Update environment variables (VITE_API_URL, VITE_DEBUG, etc.)
5. Deploy

The container will regenerate `/config.js` on startup with the new values.