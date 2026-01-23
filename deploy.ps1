# Check if the first command-line parameter is provided
param(
    [Parameter(Position=0, Mandatory=$false)]
    [string]$serviceName,

    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$remainingArgs
)

if (-not $serviceName -or $serviceName -eq "-h") {
    Write-Host @"
Usage: deploy.ps1 <service-name> [options]

Deploy, update, or clone a Cloud Run service.

Arguments:
    service-name                 Name of the Cloud Run service to deploy. Required.

Options:
    --region <region>           GCP region for deployment.
                               Defaults to environment variable CLOUD_REGION
    --project-id <id>           GCP project ID. If not supplied, then env var PROJECT_ID
                               is used and if not set, then the default value portaone-ai is used.
    --clone <source-service>    Clone an existing service instead of building from source.
                               Creates a new service with the same container and configuration.
    --source-region <region>    Region of the source service to clone (defaults to --region value)

Environment variables:
    INITIAL_DEPLOY             If set, performs initial deployment with YAML config
                              allowing you to edit environment variables before deployment.
                              Otherwise updates only the code without changing variables.
    CLOUD_REGION              Default region if not specified as argument
    PROJECT_ID                Default project ID if not specified as argument

Examples:
    # Regular deployment
    deploy.ps1 brandician-front --region europe-west1

    # Clone existing service to new name
    deploy.ps1 brandician-front-staging --clone brandician-front --region europe-west1

    # Clone from different region
    deploy.ps1 my-new-service --clone brandician-front --source-region us-central1 --region europe-west1

"@
    exit 0
}

# Parse remaining arguments
$region = ""
$projectId = ""
$cloneSource = ""
$sourceRegion = ""

for ($i = 0; $i -lt $remainingArgs.Count; $i++) {
    switch ($remainingArgs[$i]) {
        "--region" {
            $region = $remainingArgs[$i + 1]
            $i++
        }
        "--project-id" {
            $projectId = $remainingArgs[$i + 1]
            $i++
        }
        "--clone" {
            $cloneSource = $remainingArgs[$i + 1]
            $i++
        }
        "--source-region" {
            $sourceRegion = $remainingArgs[$i + 1]
            $i++
        }
    }
}

$projectId = if ($projectId) { $projectId } `
    elseif ([System.Environment]::GetEnvironmentVariable("PROJECT_ID")) { [System.Environment]::GetEnvironmentVariable("PROJECT_ID") } `
    else { "portaone-ai" }


$projectName = "Brandician"
$service_account = "brandician"
$service_account_full = "$service_account@$projectId.iam.gserviceaccount.com"

$region = if ($region) { $region } `
    elseif ([System.Environment]::GetEnvironmentVariable("CLOUD_REGION")) { [System.Environment]::GetEnvironmentVariable("CLOUD_REGION") } `
    else { "europe-west3" }

# Source region defaults to target region if not specified
$sourceRegion = if ($sourceRegion) { $sourceRegion } else { $region }

# it should be near firestore, which is in the US
# not currently used in activation scripts
$pubsub_region = "us-central1"
$repo_region = "europe"

$tag = $serviceName
$cloudRunServiceName = $serviceName

# Perform operations in the new directory
$currentDirectory = $PWD.Path
Write-Host "Current Directory: $currentDirectory"

if (-not $repo_region) {
    $repo_region = "europe"
}

gcloud config set project $projectId

# =============================================================================
# CLONE MODE: Clone an existing service
# =============================================================================
if ($cloneSource) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  CLONE SERVICE MODE" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Source service: $cloneSource (region: $sourceRegion)" -ForegroundColor Yellow
    Write-Host "Target service: $cloudRunServiceName (region: $region)" -ForegroundColor Yellow
    Write-Host "Project: $projectId" -ForegroundColor Yellow
    Write-Host ""

    # Create temp file for the exported configuration
    $tempYaml = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.yaml'

    Write-Host "Exporting configuration from source service..." -ForegroundColor Cyan

    # Export the source service configuration
    $exportResult = gcloud run services describe $cloneSource --region $sourceRegion --format=export 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to export source service configuration" -ForegroundColor Red
        Write-Host $exportResult -ForegroundColor Red
        exit 1
    }

    # Write to temp file
    $exportResult | Set-Content -Path $tempYaml

    # Replace the service name in the YAML
    # The name is in metadata.name field
    Write-Host "Modifying service name in configuration..." -ForegroundColor Cyan

    $yamlContent = Get-Content -Path $tempYaml -Raw

    # Replace the service name in the YAML
    # The metadata.name field contains the service name (not the revision name which has a suffix)
    # Pattern matches "name: service-name" at the start of a line (with possible leading whitespace)
    $escapedSource = [regex]::Escape($cloneSource)

    # Replace exact service name matches (not revision names which have suffixes like -00001-xyz)
    # This matches "name: <exact-service-name>" followed by end of line
    $yamlContent = $yamlContent -replace "(?m)(^\s*name:\s*)${escapedSource}(\r?$)", "`$1$cloudRunServiceName`$2"

    # Also update any self-references in annotations if present
    $yamlContent = $yamlContent -replace "run\.googleapis\.com/client-name:\s*${escapedSource}", "run.googleapis.com/client-name: $cloudRunServiceName"

    $yamlContent | Set-Content -Path $tempYaml -NoNewline

    Write-Host ""
    Write-Host "Configuration prepared. Preview:" -ForegroundColor Cyan
    Write-Host "----------------------------------------"
    Get-Content -Path $tempYaml | Select-Object -First 30
    Write-Host "----------------------------------------"
    Write-Host "(showing first 30 lines)"
    Write-Host ""

    $confirmation = Read-Host "Type 'yes' to create the cloned service"

    if ($confirmation -ne "yes") {
        Write-Host "Clone cancelled." -ForegroundColor Yellow
        Remove-Item -Path $tempYaml -ErrorAction SilentlyContinue
        exit 0
    }

    Write-Host "Creating cloned service..." -ForegroundColor Green

    # Deploy the new service using the modified YAML
    gcloud run services replace $tempYaml --region $region

    if ($LASTEXITCODE -eq 0) {
        # Grant public access (IAM policy is not copied by services replace)
        Write-Host "Granting public access to the service..." -ForegroundColor Cyan
        gcloud run services add-iam-policy-binding $cloudRunServiceName --region $region --member="allUsers" --role="roles/run.invoker" 2>&1 | Out-Null

        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Clone completed successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "New service URL:" -ForegroundColor Cyan
        gcloud run services describe $cloudRunServiceName --region $region --format="value(status.url)"
    } else {
        Write-Host "Error: Failed to create cloned service" -ForegroundColor Red
    }

    # Cleanup
    Remove-Item -Path $tempYaml -ErrorAction SilentlyContinue

    exit $LASTEXITCODE
}

# =============================================================================
# NORMAL MODE: Build and deploy from source
# =============================================================================

gcloud auth configure-docker "$repo_region-docker.pkg.dev"

Write-Output "Building Docker image from directory: $currentDirectory"
Set-Location $currentDirectory
docker build -t $tag .

if (-not $repo_region) {
    $repo_region = "europe"
}
$registryId = "gcf-artifacts"
$image = "${repo_region}-docker.pkg.dev/$projectId/$registryId/$tag"
docker tag $tag $image
docker push $image

# when deploying

$deployArgs = @(
    $cloudRunServiceName,
    "--image", $image,
    "--region", $region,
    "--port", "8080",
    "--cpu", "1",
    "--memory", "512Mi",
    "--concurrency", "80",
    "--timeout", "30",
    "--service-account", $service_account,
    "--allow-unauthenticated"
)


if ([System.Environment]::GetEnvironmentVariable("INITIAL_DEPLOY")) {
    # Initial deployment: create YAML config file and let user edit it
    Write-Output "INITIAL DEPLOYMENT: Will deploy a new service $cloudRunServiceName/$projectId in $region"

    # Create vars directory if it doesn't exist
    $varsDir = Join-Path $currentDirectory "vars"
    if (-not (Test-Path $varsDir)) {
        New-Item -ItemType Directory -Path $varsDir | Out-Null
    }

    $yaml_cfg = Join-Path $varsDir "${cloudRunServiceName}.yaml"
    Write-Output "Creating YAML config file: $yaml_cfg"

    # Create template with default values
    @"
# Environment variables for Cloud Run service: $cloudRunServiceName
# Edit these values as needed before deployment

VITE_API_URL: "http://localhost:8000"
VITE_DEBUG: "false"
"@ | Set-Content -Path $yaml_cfg

    Write-Output "`nCurrent configuration:"
    Get-Content -Path $yaml_cfg
    Write-Output "`nEdit the file if needed and press enter to continue..."
    $response = Read-Host

    # Verify file exists and has content
    if (-not (Test-Path $yaml_cfg)) {
        Write-Error "YAML config file $yaml_cfg was not created. Aborting deployment."
        exit 1
    }

    if ((Get-Content $yaml_cfg).Length -eq 0) {
        Write-Error "YAML config file $yaml_cfg is empty. Aborting deployment."
        exit 1
    }

    $deployArgs += @("--env-vars-file", $yaml_cfg)
} else {
    # Regular deployment: only update code, keep existing environment variables
    Write-Output "CODE UPDATE: Will update $projectId/$cloudRunServiceName in $region"
    Write-Output "Environment variables will NOT be changed (runtime configuration maintained)"
    Write-Output "Press enter to continue..."
    $response = Read-Host
}

gcloud run deploy @deployArgs
