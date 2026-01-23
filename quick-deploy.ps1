# Quick deploy script for brandician-front
# Usage: .\quick-deploy.ps1 [--prod]
# Without --prod: deploys to staging (default)
# With --prod: deploys to production (requires confirmation)

param(
    [switch]$prod
)

# =============================================================================
# CONFIGURATION - Edit these values to change staging/production settings
# =============================================================================

# Staging configuration (default)
$STAGING_SERVICE_NAME = "brandician-front-staging"
$STAGING_PROJECT_ID = "portaone-ai"
$STAGING_REGION = "europe-west1"

# Production configuration
$PROD_SERVICE_NAME = "brandician-front"
$PROD_PROJECT_ID = "portaone-ai"
$PROD_REGION = "europe-west1"

# =============================================================================

if ($prod) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  WARNING: PRODUCTION DEPLOYMENT" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "You are about to deploy to PRODUCTION:" -ForegroundColor Yellow
    Write-Host "  Service: $PROD_SERVICE_NAME" -ForegroundColor Yellow
    Write-Host "  Project: $PROD_PROJECT_ID" -ForegroundColor Yellow
    Write-Host "  Region:  $PROD_REGION" -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Type 'yes' to confirm production deployment"

    if ($confirmation -ne "yes") {
        Write-Host "Deployment cancelled." -ForegroundColor Cyan
        exit 0
    }

    Write-Host "Proceeding with production deployment..." -ForegroundColor Green
    .\deploy.ps1 $PROD_SERVICE_NAME --region $PROD_REGION --project-id $PROD_PROJECT_ID
} else {
    Write-Host ""
    Write-Host "Deploying to STAGING environment:" -ForegroundColor Cyan
    Write-Host "  Service: $STAGING_SERVICE_NAME" -ForegroundColor Cyan
    Write-Host "  Project: $STAGING_PROJECT_ID" -ForegroundColor Cyan
    Write-Host "  Region:  $STAGING_REGION" -ForegroundColor Cyan
    Write-Host ""
    .\deploy.ps1 $STAGING_SERVICE_NAME --region $STAGING_REGION --project-id $STAGING_PROJECT_ID
}
