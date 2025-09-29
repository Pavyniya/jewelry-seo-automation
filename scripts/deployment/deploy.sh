#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_NAME="jewelry-seo-automation"
AWS_REGION="us-east-1"

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required tools
check_requirements() {
    log_info "Checking requirements..."

    command -v terraform >/dev/null 2>&1 || { log_error "Terraform is required but not installed."; exit 1; }
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed."; exit 1; }
    command -v railway >/dev/null 2>&1 || { log_error "Railway CLI is required but not installed."; exit 1; }

    log_info "All requirements satisfied"
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        dev|staging|production)
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT. Must be dev, staging, or production"
            exit 1
            ;;
    esac
}

# Load environment variables
load_env() {
    log_info "Loading environment variables for $ENVIRONMENT"

    if [ -f "config/$ENVIRONMENT/.env" ]; then
        export $(cat "config/$ENVIRONMENT/.env" | grep -v '^#' | xargs)
    else
        log_warn "No environment file found for $ENVIRONMENT"
    fi
}

# Run Terraform
run_terraform() {
    log_info "Running Terraform..."

    cd infrastructure/terraform

    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init

    # Plan changes
    log_info "Planning infrastructure changes..."
    terraform plan -out=tfplan -var="environment=$ENVIRONMENT"

    # Confirm and apply
    if [ "$ENVIRONMENT" != "production" ]; then
        log_info "Applying infrastructure changes..."
        terraform apply -auto-approve tfplan
    else
        log_warn "Production environment requires manual approval"
        log_info "Please review the plan above and confirm:"
        select yn in "Yes" "No"; do
            case $yn in
                Yes )
                    terraform apply -auto-approve tfplan
                    break
                    ;;
                No )
                    log_info "Deployment cancelled"
                    exit 0
                    ;;
            esac
        done
    fi

    cd ../..
}

# Deploy to Railway
deploy_railway() {
    log_info "Deploying to Railway..."

    # Check if logged in to Railway
    if ! railway whoami >/dev/null 2>&1; then
        log_error "Not logged in to Railway. Please run 'railway login' first."
        exit 1
    fi

    # Deploy
    railway up --environment=$ENVIRONMENT

    # Wait for deployment to complete
    log_info "Waiting for deployment to complete..."
    railway status --wait

    # Get deployment URL
    DEPLOYMENT_URL=$(railway domains --environment=$ENVIRONMENT | head -n 1)
    log_info "Deployed to: $DEPLOYMENT_URL"
}

# Run tests
run_tests() {
    log_info "Running tests..."

    # Install dependencies
    pnpm install --frozen-lockfile

    # Run test suite
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Running production smoke tests..."
        pnpm test:smoke
    else
        log_info "Running full test suite..."
        pnpm test
    fi
}

# Health check
health_check() {
    log_info "Performing health check..."

    # Get deployment URL
    DEPLOYMENT_URL=$(railway domains --environment=$ENVIRONMENT | head -n 1)

    # Wait for health check endpoint
    local attempts=0
    local max_attempts=30

    while [ $attempts -lt $max_attempts ]; do
        if curl -f "$DEPLOYMENT_URL/health" >/dev/null 2>&1; then
            log_info "Health check passed"
            return 0
        fi

        log_warn "Health check failed, retrying in 10 seconds..."
        sleep 10
        attempts=$((attempts + 1))
    done

    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Backup database
backup_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Creating database backup..."

        # This would be implemented based on your database provider
        # For now, just logging
        log_warn "Database backup not implemented yet"
    fi
}

# Send notification
send_notification() {
    local status=$1

    # Send notification to Slack or other messaging service
    log_info "Sending deployment notification..."

    # This would integrate with your notification system
    # For now, just logging
    log_info "Deployment $status: $ENVIRONMENT environment"
}

# Main deployment process
main() {
    log_info "Starting deployment to $ENVIRONMENT environment"

    check_requirements
    validate_environment
    load_env

    # Infrastructure deployment
    if [ "$ENVIRONMENT" = "production" ]; then
        run_terraform
    fi

    # Application deployment
    deploy_railway

    # Testing
    run_tests

    # Health check
    if ! health_check; then
        log_error "Health check failed, initiating rollback..."
        # Implement rollback logic
        send_notification "FAILED"
        exit 1
    fi

    # Backup
    backup_database

    # Success
    log_info "Deployment completed successfully!"
    send_notification "SUCCESS"
}

# Run main function
main "$@"