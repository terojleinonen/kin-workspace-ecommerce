#!/bin/bash

# Kin Workspace E-commerce - Environment Setup Script
# This script helps set up environment variables for different deployment modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Generate secure random string
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Validate email format
validate_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Validate URL format
validate_url() {
    local url=$1
    if [[ $url =~ ^https?://[a-zA-Z0-9.-]+.*$ ]]; then
        return 0
    else
        return 1
    fi
}

# Setup demo environment
setup_demo_environment() {
    print_status "Setting up demo environment configuration..."
    
    cat > .env << EOF
# ================================================
# Kin Workspace E-commerce - Demo Configuration
# ================================================

# Application Mode
PAYMENT_MODE=demo
NODE_ENV=development
NEXT_PUBLIC_DEMO_MODE=true

# Database Configuration (SQLite for demo)
DATABASE_URL="file:./prisma/dev.db"

# Authentication Secrets
JWT_SECRET="$(generate_secret 64)"
NEXTAUTH_SECRET="$(generate_secret 64)"
NEXTAUTH_URL="http://localhost:3000"

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="Kin Workspace"

# Demo Payment Configuration
DEMO_SUCCESS_RATE="0.9"
DEMO_PROCESSING_DELAY="2000"
DEMO_ENABLE_FAILURES="true"

# Demo Email Configuration
EMAIL_SERVICE="demo"
DEMO_LOG_EMAILS="true"
DEMO_EMAIL_DELAY="1000"

# Demo Storage Configuration
STORAGE_PROVIDER="local"
LOCAL_UPLOAD_DIR="./public/uploads"
LOCAL_PUBLIC_PATH="/uploads"

# CMS Configuration (Disabled for demo)
CMS_ENABLED="false"
CMS_FALLBACK_TO_LOCAL="true"

# Monitoring (Disabled for demo)
MONITORING_ENABLED="false"

# Development Tools
NEXT_TELEMETRY_DISABLED="1"

# ================================================
# Optional: Uncomment and configure for testing
# ================================================

# Stripe Test Keys (for testing Stripe integration)
# STRIPE_PUBLISHABLE_KEY="pk_test_your_test_key_here"
# STRIPE_SECRET_KEY="sk_test_your_test_key_here"
# STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# SendGrid Test Configuration
# SENDGRID_API_KEY="SG.your_test_api_key_here"
# SENDGRID_FROM_EMAIL="demo@yourdomain.com"
# SENDGRID_FROM_NAME="Kin Workspace Demo"

# Cloudinary Test Configuration
# CLOUDINARY_CLOUD_NAME="your_test_cloud_name"
# CLOUDINARY_API_KEY="your_test_api_key"
# CLOUDINARY_API_SECRET="your_test_api_secret"
EOF

    print_success "Demo environment configuration created in .env"
    print_status "You can now run: npm run dev"
}

# Setup production environment template
setup_production_template() {
    print_status "Creating production environment template..."
    
    read -p "Enter your domain (e.g., yourdomain.com): " DOMAIN
    if ! validate_url "https://$DOMAIN"; then
        print_error "Invalid domain format"
        exit 1
    fi
    
    read -p "Enter your database URL: " DATABASE_URL
    if [ -z "$DATABASE_URL" ]; then
        print_error "Database URL is required"
        exit 1
    fi
    
    read -p "Enter your email address for SendGrid: " FROM_EMAIL
    if ! validate_email "$FROM_EMAIL"; then
        print_error "Invalid email format"
        exit 1
    fi
    
    cat > .env.production << EOF
# ================================================
# Kin Workspace E-commerce - Production Configuration
# ================================================
# 
# IMPORTANT: 
# 1. Fill in all the placeholder values below
# 2. Keep this file secure and never commit to version control
# 3. Use environment-specific values for each deployment
# ================================================

# Application Mode
PAYMENT_MODE=production
NODE_ENV=production
NEXT_PUBLIC_DEMO_MODE=false

# Database Configuration
DATABASE_URL="$DATABASE_URL"

# Authentication Secrets (CHANGE THESE!)
JWT_SECRET="$(generate_secret 64)"
NEXTAUTH_SECRET="$(generate_secret 64)"
NEXTAUTH_URL="https://$DOMAIN"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://$DOMAIN"
NEXT_PUBLIC_SITE_NAME="Kin Workspace"

# Stripe Payment Processing (REQUIRED)
STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_PUBLISHABLE_KEY_HERE"
STRIPE_SECRET_KEY="sk_live_YOUR_SECRET_KEY_HERE"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"

# SendGrid Email Service (REQUIRED)
EMAIL_SERVICE="sendgrid"
SENDGRID_API_KEY="SG.YOUR_SENDGRID_API_KEY_HERE"
SENDGRID_FROM_EMAIL="$FROM_EMAIL"
SENDGRID_FROM_NAME="Kin Workspace"

# File Storage Configuration
STORAGE_PROVIDER="cloudinary"
CLOUDINARY_CLOUD_NAME="YOUR_CLOUD_NAME_HERE"
CLOUDINARY_API_KEY="YOUR_CLOUDINARY_API_KEY_HERE"
CLOUDINARY_API_SECRET="YOUR_CLOUDINARY_API_SECRET_HERE"

# CMS Integration (Optional)
CMS_ENABLED="true"
CMS_PROVIDER="contentful"
CMS_ENDPOINT="https://api.contentful.com"
CMS_API_KEY="YOUR_CMS_API_KEY_HERE"
CMS_PROJECT_ID="YOUR_CMS_PROJECT_ID_HERE"
CMS_FALLBACK_TO_LOCAL="true"

# Monitoring and Analytics
MONITORING_ENABLED="true"
SENTRY_DSN="https://YOUR_SENTRY_DSN_HERE"
GOOGLE_ANALYTICS_ID="G-YOUR_GA_ID_HERE"

# Security Configuration
NEXT_TELEMETRY_DISABLED="1"

# ================================================
# Optional Advanced Configuration
# ================================================

# Redis Configuration (for session storage)
# REDIS_URL="redis://localhost:6379"

# Custom SMTP (alternative to SendGrid)
# EMAIL_SERVICE="smtp"
# SMTP_HOST="smtp.yourdomain.com"
# SMTP_PORT="587"
# SMTP_USER="noreply@yourdomain.com"
# SMTP_PASS="your_smtp_password"

# AWS S3 Storage (alternative to Cloudinary)
# STORAGE_PROVIDER="s3"
# AWS_S3_BUCKET="your-bucket-name"
# AWS_S3_REGION="us-east-1"
# AWS_ACCESS_KEY_ID="your_access_key"
# AWS_SECRET_ACCESS_KEY="your_secret_key"

# Custom Database Pool Settings
# DATABASE_POOL_MIN="2"
# DATABASE_POOL_MAX="20"
# DATABASE_TIMEOUT="30000"
EOF

    print_success "Production environment template created in .env.production"
    print_warning "Please edit .env.production and fill in all the placeholder values"
    print_warning "Remember to keep this file secure and never commit it to version control"
}

# Interactive environment setup
interactive_setup() {
    echo "=================================================="
    echo "  Kin Workspace E-commerce - Environment Setup"
    echo "=================================================="
    echo ""
    echo "This script will help you set up environment variables"
    echo "for your Kin Workspace e-commerce deployment."
    echo ""
    
    PS3="Please select your deployment type: "
    options=("Demo/Development" "Production" "Exit")
    select opt in "${options[@]}"
    do
        case $opt in
            "Demo/Development")
                setup_demo_environment
                break
                ;;
            "Production")
                setup_production_template
                break
                ;;
            "Exit")
                print_status "Exiting setup"
                exit 0
                ;;
            *) 
                print_error "Invalid option $REPLY"
                ;;
        esac
    done
}

# Validate existing environment
validate_environment() {
    print_status "Validating current environment configuration..."
    
    if [ ! -f .env ]; then
        print_error "No .env file found. Run setup first."
        exit 1
    fi
    
    # Source the .env file
    set -a
    source .env
    set +a
    
    # Check required variables based on mode
    if [ "$PAYMENT_MODE" = "production" ]; then
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
    else
        REQUIRED_VARS=(
            "DATABASE_URL"
            "JWT_SECRET"
            "NEXTAUTH_SECRET"
            "NEXTAUTH_URL"
        )
    fi
    
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
    
    # Validate formats
    if [ "$PAYMENT_MODE" = "production" ]; then
        if [[ ! "$STRIPE_PUBLISHABLE_KEY" == pk_* ]]; then
            print_error "Invalid Stripe publishable key format (should start with pk_)"
            exit 1
        fi
        
        if [[ ! "$STRIPE_SECRET_KEY" == sk_* ]]; then
            print_error "Invalid Stripe secret key format (should start with sk_)"
            exit 1
        fi
        
        if [[ ! "$SENDGRID_API_KEY" == SG.* ]]; then
            print_error "Invalid SendGrid API key format (should start with SG.)"
            exit 1
        fi
        
        if ! validate_email "$SENDGRID_FROM_EMAIL"; then
            print_error "Invalid SendGrid from email format"
            exit 1
        fi
    fi
    
    print_success "Environment configuration is valid"
}

# Show current configuration
show_config() {
    print_status "Current environment configuration:"
    
    if [ ! -f .env ]; then
        print_error "No .env file found"
        exit 1
    fi
    
    # Source the .env file
    set -a
    source .env
    set +a
    
    echo ""
    echo "Mode: ${PAYMENT_MODE:-not set}"
    echo "Environment: ${NODE_ENV:-not set}"
    echo "Site URL: ${NEXT_PUBLIC_SITE_URL:-not set}"
    echo "Database: ${DATABASE_URL:-not set}"
    echo "Email Service: ${EMAIL_SERVICE:-not set}"
    echo "Storage Provider: ${STORAGE_PROVIDER:-not set}"
    echo "Demo Mode: ${NEXT_PUBLIC_DEMO_MODE:-not set}"
    echo ""
    
    if [ "$PAYMENT_MODE" = "production" ]; then
        echo "Production Services:"
        echo "  Stripe: ${STRIPE_PUBLISHABLE_KEY:+configured}"
        echo "  SendGrid: ${SENDGRID_API_KEY:+configured}"
        echo "  Cloudinary: ${CLOUDINARY_CLOUD_NAME:+configured}"
        echo "  Monitoring: ${MONITORING_ENABLED:-false}"
    fi
}

# Main function
main() {
    case "${1:-}" in
        "demo")
            setup_demo_environment
            ;;
        "production")
            setup_production_template
            ;;
        "validate")
            validate_environment
            ;;
        "show")
            show_config
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [demo|production|validate|show|help]"
            echo ""
            echo "Commands:"
            echo "  demo        - Set up demo/development environment"
            echo "  production  - Create production environment template"
            echo "  validate    - Validate current environment configuration"
            echo "  show        - Show current configuration"
            echo "  help        - Show this help message"
            echo ""
            echo "If no command is provided, interactive setup will be launched."
            ;;
        "")
            interactive_setup
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"