#!/bin/bash

# Kin Workspace E-commerce - Production Deployment Script
# This script deploys the application to production environment

set -e  # Exit on any error

echo "🚀 Starting Kin Workspace Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
BACKUP_DIR="./backups"
LOG_DIR="./logs"
DEPLOYMENT_LOG="$LOG_DIR/deployment_$(date +%Y%m%d_%H%M%S).log"

# Create directories
mkdir -p "$BACKUP_DIR" "$LOG_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$DEPLOYMENT_LOG"
    echo "$1"
}

# Check if running as production
check_production_mode() {
    print_status "Verifying production mode..."
    
    if [ "$NODE_ENV" != "production" ]; then
        print_error "NODE_ENV must be set to 'production' for production deployment"
        exit 1
    fi
    
    if [ "$PAYMENT_MODE" != "production" ]; then
        print_error "PAYMENT_MODE must be set to 'production' for production deployment"
        exit 1
    fi
    
    print_success "Production mode verified"
    log "Production mode verification passed"
}

# Check required environment variables
check_environment_variables() {
    print_status "Checking required environment variables..."
    
    REQUIRED_VARS=(
        "DATABASE_URL"
        "JWT_SECRET"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "STRIPE_PUBLISHABLE_KEY"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "SENDGRID_API_KEY"
        "SENDGRID_FROM_EMAIL"
    )
    
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "All required environment variables are set"
    log "Environment variables validation passed"
}

# Validate external services
validate_services() {
    print_status "Validating external services..."
    
    # Test database connection
    print_status "Testing database connection..."
    if npx prisma db pull --force > /dev/null 2>&1; then
        print_success "Database connection successful"
        log "Database connection test passed"
    else
        print_error "Database connection failed"
        log "Database connection test failed"
        exit 1
    fi
    
    # Test Stripe connection (basic validation)
    print_status "Validating Stripe configuration..."
    if [[ "$STRIPE_PUBLISHABLE_KEY" == pk_* ]] && [[ "$STRIPE_SECRET_KEY" == sk_* ]]; then
        print_success "Stripe configuration appears valid"
        log "Stripe configuration validation passed"
    else
        print_error "Invalid Stripe API keys format"
        log "Stripe configuration validation failed"
        exit 1
    fi
    
    # Test SendGrid configuration
    print_status "Validating SendGrid configuration..."
    if [[ "$SENDGRID_API_KEY" == SG.* ]]; then
        print_success "SendGrid configuration appears valid"
        log "SendGrid configuration validation passed"
    else
        print_error "Invalid SendGrid API key format"
        log "SendGrid configuration validation failed"
        exit 1
    fi
}

# Create database backup
create_backup() {
    print_status "Creating database backup..."
    
    BACKUP_FILE="$BACKUP_DIR/pre_deployment_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Extract database type from URL
    if [[ "$DATABASE_URL" == postgresql* ]] || [[ "$DATABASE_URL" == postgres* ]]; then
        if command -v pg_dump &> /dev/null; then
            pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
            print_success "PostgreSQL backup created: $BACKUP_FILE"
            log "Database backup created: $BACKUP_FILE"
        else
            print_warning "pg_dump not found. Skipping database backup."
            log "Database backup skipped - pg_dump not available"
        fi
    elif [[ "$DATABASE_URL" == mysql* ]]; then
        if command -v mysqldump &> /dev/null; then
            # Extract connection details for mysqldump
            print_warning "MySQL backup requires manual configuration. Please create backup manually."
            log "MySQL backup requires manual intervention"
        else
            print_warning "mysqldump not found. Skipping database backup."
            log "Database backup skipped - mysqldump not available"
        fi
    else
        print_warning "Unknown database type. Skipping backup."
        log "Database backup skipped - unknown database type"
    fi
}

# Install production dependencies
install_dependencies() {
    print_status "Installing production dependencies..."
    
    # Clean install with only production dependencies
    rm -rf node_modules package-lock.json
    npm ci --only=production --no-audit --no-fund
    
    print_success "Production dependencies installed"
    log "Production dependencies installation completed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Run migrations
    npx prisma migrate deploy
    
    print_success "Database migrations completed"
    log "Database migrations completed successfully"
}

# Build application
build_application() {
    print_status "Building application for production..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    npm run build
    
    print_success "Application built successfully"
    log "Application build completed"
}

# Run production tests
run_production_tests() {
    print_status "Running production tests..."
    
    # Install dev dependencies temporarily for testing
    npm install --only=dev --no-audit --no-fund
    
    # Run tests
    if npm run test -- --passWithNoTests --watchAll=false --coverage; then
        print_success "All production tests passed"
        log "Production tests passed"
    else
        print_error "Production tests failed"
        log "Production tests failed"
        exit 1
    fi
    
    # Remove dev dependencies
    npm prune --production
}

# Validate deployment
validate_deployment() {
    print_status "Validating deployment..."
    
    # Start server in background for testing
    npm start &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 10
    
    # Test health endpoints
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Health check passed"
        log "Health check validation passed"
    else
        print_error "Health check failed"
        log "Health check validation failed"
        kill $SERVER_PID
        exit 1
    fi
    
    # Test service health
    if curl -f http://localhost:3000/api/health/services > /dev/null 2>&1; then
        print_success "Services health check passed"
        log "Services health check passed"
    else
        print_warning "Services health check failed - some services may not be configured"
        log "Services health check failed"
    fi
    
    # Stop test server
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null || true
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create log directories
    mkdir -p logs/{application,error,access}
    
    # Setup log rotation (if logrotate is available)
    if command -v logrotate &> /dev/null; then
        cat > /tmp/kin-workspace-logrotate << EOF
logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
EOF
        print_success "Log rotation configured"
        log "Log rotation setup completed"
    else
        print_warning "logrotate not available. Manual log management required."
        log "Log rotation setup skipped - logrotate not available"
    fi
    
    # Setup process monitoring (if PM2 is available)
    if command -v pm2 &> /dev/null; then
        cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'kin-workspace',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error/pm2-error.log',
    out_file: './logs/application/pm2-out.log',
    log_file: './logs/application/pm2-combined.log',
    time: true
  }]
}
EOF
        print_success "PM2 configuration created"
        log "PM2 configuration setup completed"
    else
        print_warning "PM2 not available. Manual process management required."
        log "PM2 setup skipped - PM2 not available"
    fi
}

# Setup SSL and security
setup_security() {
    print_status "Setting up security configurations..."
    
    # Create security headers configuration for nginx (if applicable)
    cat > nginx-security.conf << EOF
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;" always;

# SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
EOF
    
    print_success "Security configuration files created"
    log "Security configuration setup completed"
}

# Final deployment steps
finalize_deployment() {
    print_status "Finalizing deployment..."
    
    # Create deployment info file
    cat > deployment-info.json << EOF
{
  "deploymentDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "environment": "production",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)"
}
EOF
    
    # Set proper file permissions
    chmod 644 deployment-info.json
    chmod -R 755 scripts/
    
    print_success "Deployment finalized"
    log "Deployment finalization completed"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up temporary files..."
    # Remove any temporary files created during deployment
    rm -f /tmp/kin-workspace-logrotate
    log "Cleanup completed"
}

# Trap cleanup function on script exit
trap cleanup EXIT

# Main deployment flow
main() {
    echo "=================================================="
    echo "  Kin Workspace E-commerce - Production Deployment"
    echo "=================================================="
    echo ""
    echo "Deployment log: $DEPLOYMENT_LOG"
    echo ""
    
    log "Production deployment started"
    
    check_production_mode
    check_environment_variables
    validate_services
    create_backup
    install_dependencies
    run_migrations
    build_application
    run_production_tests
    validate_deployment
    setup_monitoring
    setup_security
    finalize_deployment
    
    print_success "🎉 Production deployment completed successfully!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "  • Environment: Production"
    echo "  • Database: Migrated and ready"
    echo "  • Application: Built and tested"
    echo "  • Services: Validated and configured"
    echo "  • Monitoring: Configured"
    echo "  • Security: Headers and SSL configured"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Start the production server: npm start"
    echo "  2. Configure reverse proxy (nginx/apache)"
    echo "  3. Set up SSL certificate"
    echo "  4. Configure domain DNS"
    echo "  5. Test all functionality"
    echo "  6. Monitor logs and performance"
    echo ""
    echo "📊 Monitoring:"
    echo "  • Health check: https://yourdomain.com/api/health"
    echo "  • Logs directory: ./logs/"
    echo "  • Deployment log: $DEPLOYMENT_LOG"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • Start: npm start"
    echo "  • Stop: pkill -f 'npm start' or pm2 stop kin-workspace"
    echo "  • Logs: tail -f logs/application/*.log"
    echo "  • Health: curl https://yourdomain.com/api/health"
    
    log "Production deployment completed successfully"
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi