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

```env
VITE_API_URL=http://localhost:8000  # Backend API URL
VITE_DEBUG=true                     # Enable debug logging
```

## Deployment

The project includes Docker configuration and Nginx setup for production deployment. Use the PowerShell deployment scripts for automated deployment processes.