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

Deploy or update a Cloud Run service.

Arguments:
    service-name                 Name of the Cloud Run service to deploy. Required.

Options:
    --region <region>           GCP region for deployment.
                               Defaults to environment variable CLOUD_REGION
    --project-id <id>           GCP project ID. If not supplied, then env var PROJECT_ID
                               is used and if not set, then the default value portaone-ai is used.

Environment variables:
    INITIAL_DEPLOY             If set, performs initial deployment with YAML config
                              allowing you to edit environment variables before deployment.
                              Otherwise updates only the code without changing variables.
    CLOUD_REGION              Default region if not specified as argument
    PROJECT_ID                Default project ID if not specified as argument
"@
    exit 0
}

# Parse remaining arguments
$region = ""
$projectId = ""

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