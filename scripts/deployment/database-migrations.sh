#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
MIGRATION_DIRECTION=${2:-up}

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

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        dev|staging|production)
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Get database connection string
get_database_url() {
    if [ "$ENVIRONMENT" = "dev" ]; then
        echo "postgresql://admin:devpassword@localhost:5432/jewelry_seo_dev"
    elif [ "$ENVIRONMENT" = "staging" ]; then
        # Get from Railway or AWS RDS
        railway domain --environment=staging | head -n 1
    else
        # Get from Railway or AWS RDS
        railway domain --environment=production | head -n 1
    fi
}

# Create backup before migration
create_backup() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Creating database backup before migration..."

        # Get database URL
        DB_URL=$(get_database_url)

        # Create backup
        BACKUP_NAME="pre-migration-$(date +%Y%m%d-%H%M%S)"

        if command -v pg_dump >/dev/null 2>&1; then
            pg_dump "$DB_URL" > "backups/${BACKUP_NAME}.sql"
            log_info "Backup created: backups/${BACKUP_NAME}.sql"
        else
            log_warn "pg_dump not available, skipping backup"
        fi
    fi
}

# Run migrations
run_migrations() {
    log_info "Running database migrations for $ENVIRONMENT environment"

    # Load environment
    if [ -f "config/$ENVIRONMENT/.env" ]; then
        export $(cat "config/$ENVIRONMENT/.env" | grep -v '^#' | xargs)
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        pnpm install
    fi

    case $MIGRATION_DIRECTION in
        up)
            log_info "Running up migrations..."
            pnpm --filter @jewelry-seo/api db:migrate
            ;;
        down)
            log_info "Running down migrations..."
            pnpm --filter @jewelry-seo/api db:rollback
            ;;
        *)
            log_error "Invalid migration direction: $MIGRATION_DIRECTION"
            exit 1
            ;;
    esac
}

# Verify migration
verify_migration() {
    log_info "Verifying migration..."

    # Check if database is accessible
    DB_URL=$(get_database_url)

    if command -v psql >/dev/null 2>&1; then
        # Simple connection test
        if psql "$DB_URL" -c "SELECT 1;" >/dev/null 2>&1; then
            log_info "Database connection successful"
        else
            log_error "Database connection failed"
            exit 1
        fi
    fi

    # Run basic application checks
    log_info "Running application health check..."
    # This would be implemented based on your health check endpoint
}

# Seed database
seed_database() {
    if [ "$ENVIRONMENT" != "production" ]; then
        log_info "Seeding database..."
        pnpm --filter @jewelry-seo/api db:seed
    fi
}

# Rollback on failure
rollback() {
    log_error "Migration failed, initiating rollback..."

    # Restore from backup if available
    if [ "$ENVIRONMENT" = "production" ] && [ -n "$BACKUP_NAME" ]; then
        if command -v psql >/dev/null 2>&1; then
            DB_URL=$(get_database_url)
            psql "$DB_URL" < "backups/${BACKUP_NAME}.sql"
            log_info "Database restored from backup"
        fi
    fi

    # Run rollback migrations
    pnpm --filter @jewelry-seo/api db:rollback
}

# Main function
main() {
    log_info "Starting database migration for $ENVIRONMENT environment"

    validate_environment

    if [ "$MIGRATION_DIRECTION" = "up" ]; then
        create_backup
    fi

    # Run migrations with error handling
    if ! run_migrations; then
        rollback
        exit 1
    fi

    verify_migration
    seed_database

    log_info "Database migration completed successfully"
}

# Run main function with error handling
if ! main "$@"; then
    log_error "Database migration failed"
    exit 1
fi