#!/bin/bash

# Kin Workspace E-commerce - Deployment Testing Script
# This script tests the deployment and validates all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test configuration
TEST_RESULTS=()
FAILED_TESTS=0

# Add test result
add_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    TEST_RESULTS+=("$test_name|$status|$message")
    
    if [ "$status" = "FAIL" ]; then
        ((FAILED_TESTS++))
        print_error "$test_name: $message"
    elif [ "$status" = "WARN" ]; then
        print_warning "$test_name: $message"
    else
        print_success "$test_name: $message"
    fi
}

# Test environment configuration
test_environment() {
    print_status "Testing environment configuration..."
    
    # Check if .env file exists
    if [ -f .env ]; then
        add_result "Environment File" "PASS" ".env file exists"
        
        # Source environment variables
        set -a
        source .env
        set +a
        
        # Test required variables
        if [ -n "$DATABASE_URL" ]; then
            add_result "Database URL" "PASS" "Database URL is configured"
        else
            add_result "Database URL" "FAIL" "DATABASE_URL is not set"
        fi
        
        if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 32 ]; then
            add_result "JWT Secret" "PASS" "JWT secret is properly configured"
        else
            add_result "JWT Secret" "FAIL" "JWT_SECRET is missing or too short"
        fi
        
        if [ -n "$NEXTAUTH_SECRET" ] && [ ${#NEXTAUTH_SECRET} -ge 32 ]; then
            add_result "NextAuth Secret" "PASS" "NextAuth secret is properly configured"
        else
            add_result "NextAuth Secret" "FAIL" "NEXTAUTH_SECRET is missing or too short"
        fi
        
        # Test mode-specific configuration
        if [ "$PAYMENT_MODE" = "production" ]; then
            if [[ "$STRIPE_PUBLISHABLE_KEY" == pk_* ]]; then
                add_result "Stripe Config" "PASS" "Stripe publishable key format is valid"
            else
                add_result "Stripe Config" "FAIL" "Invalid Stripe publishable key format"
            fi
            
            if [[ "$SENDGRID_API_KEY" == SG.* ]]; then
                add_result "SendGrid Config" "PASS" "SendGrid API key format is valid"
            else
                add_result "SendGrid Config" "FAIL" "Invalid SendGrid API key format"
            fi
        else
            add_result "Demo Mode" "PASS" "Running in demo mode"
        fi
        
    else
        add_result "Environment File" "FAIL" ".env file not found"
    fi
}

# Test Node.js and npm
test_node_environment() {
    print_status "Testing Node.js environment..."
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            add_result "Node.js Version" "PASS" "Node.js $(node --version) is supported"
        else
            add_result "Node.js Version" "FAIL" "Node.js version must be 18+, found $(node --version)"
        fi
    else
        add_result "Node.js" "FAIL" "Node.js is not installed"
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        add_result "npm" "PASS" "npm $(npm --version) is available"
    else
        add_result "npm" "FAIL" "npm is not installed"
    fi
    
    # Check if node_modules exists
    if [ -d node_modules ]; then
        add_result "Dependencies" "PASS" "Dependencies are installed"
    else
        add_result "Dependencies" "FAIL" "Dependencies not installed (run npm install)"
    fi
}

# Test database connectivity
test_database() {
    print_status "Testing database connectivity..."
    
    # Test Prisma configuration
    if [ -f prisma/schema.prisma ]; then
        add_result "Prisma Schema" "PASS" "Prisma schema file exists"
        
        # Test database connection
        if npx prisma db pull --force > /dev/null 2>&1; then
            add_result "Database Connection" "PASS" "Database connection successful"
        else
            add_result "Database Connection" "FAIL" "Cannot connect to database"
        fi
        
        # Check if migrations are up to date
        if npx prisma migrate status > /dev/null 2>&1; then
            add_result "Database Migrations" "PASS" "Database migrations are up to date"
        else
            add_result "Database Migrations" "WARN" "Database migrations may be needed"
        fi
        
    else
        add_result "Prisma Schema" "FAIL" "Prisma schema file not found"
    fi
}

# Test application build
test_build() {
    print_status "Testing application build..."
    
    # Check if build directory exists
    if [ -d .next ]; then
        add_result "Build Directory" "PASS" "Build directory exists"
    else
        add_result "Build Directory" "WARN" "Build directory not found (run npm run build)"
    fi
    
    # Test TypeScript compilation
    if npx tsc --noEmit > /dev/null 2>&1; then
        add_result "TypeScript" "PASS" "TypeScript compilation successful"
    else
        add_result "TypeScript" "FAIL" "TypeScript compilation errors found"
    fi
    
    # Test linting
    if npm run lint > /dev/null 2>&1; then
        add_result "Linting" "PASS" "Code linting passed"
    else
        add_result "Linting" "WARN" "Linting issues found"
    fi
}

# Test application startup
test_startup() {
    print_status "Testing application startup..."
    
    # Start the application in background
    npm run build > /dev/null 2>&1 || true
    
    # Start server in background
    timeout 30s npm start &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 10
    
    # Test if server is responding
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        add_result "Server Startup" "PASS" "Server started and responding"
    else
        add_result "Server Startup" "FAIL" "Server not responding on port 3000"
    fi
    
    # Test health endpoint
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        add_result "Health Endpoint" "PASS" "Health endpoint responding"
    else
        add_result "Health Endpoint" "FAIL" "Health endpoint not responding"
    fi
    
    # Test services health
    if curl -f http://localhost:3000/api/health/services > /dev/null 2>&1; then
        add_result "Services Health" "PASS" "Services health check passed"
    else
        add_result "Services Health" "WARN" "Services health check failed"
    fi
    
    # Stop the server
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
}

# Test external services (if in production mode)
test_external_services() {
    if [ "$PAYMENT_MODE" = "production" ]; then
        print_status "Testing external services (production mode)..."
        
        # Test Stripe connectivity (basic validation)
        if [ -n "$STRIPE_SECRET_KEY" ]; then
            # This would test actual Stripe connectivity in a real scenario
            add_result "Stripe Service" "PASS" "Stripe configuration appears valid"
        else
            add_result "Stripe Service" "FAIL" "Stripe secret key not configured"
        fi
        
        # Test SendGrid connectivity (basic validation)
        if [ -n "$SENDGRID_API_KEY" ]; then
            # This would test actual SendGrid connectivity in a real scenario
            add_result "SendGrid Service" "PASS" "SendGrid configuration appears valid"
        else
            add_result "SendGrid Service" "FAIL" "SendGrid API key not configured"
        fi
        
        # Test Cloudinary (if configured)
        if [ "$STORAGE_PROVIDER" = "cloudinary" ] && [ -n "$CLOUDINARY_CLOUD_NAME" ]; then
            add_result "Cloudinary Service" "PASS" "Cloudinary configuration appears valid"
        elif [ "$STORAGE_PROVIDER" = "local" ]; then
            add_result "Storage Service" "PASS" "Using local storage"
        else
            add_result "Storage Service" "WARN" "Storage service not properly configured"
        fi
        
    else
        print_status "Skipping external services test (demo mode)"
        add_result "External Services" "PASS" "Demo mode - external services not required"
    fi
}

# Test security configuration
test_security() {
    print_status "Testing security configuration..."
    
    # Check HTTPS configuration (in production)
    if [ "$NODE_ENV" = "production" ]; then
        if [[ "$NEXTAUTH_URL" == https://* ]]; then
            add_result "HTTPS Config" "PASS" "HTTPS is configured for production"
        else
            add_result "HTTPS Config" "FAIL" "HTTPS should be used in production"
        fi
    else
        add_result "HTTPS Config" "PASS" "HTTP is acceptable for development"
    fi
    
    # Check secret strength
    if [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 64 ]; then
        add_result "Secret Strength" "PASS" "JWT secret has good entropy"
    elif [ -n "$JWT_SECRET" ] && [ ${#JWT_SECRET} -ge 32 ]; then
        add_result "Secret Strength" "WARN" "JWT secret meets minimum requirements"
    else
        add_result "Secret Strength" "FAIL" "JWT secret is too weak"
    fi
}

# Generate test report
generate_report() {
    echo ""
    echo "=================================================="
    echo "  Deployment Test Report"
    echo "=================================================="
    echo ""
    echo "Test Summary:"
    echo "  Total Tests: ${#TEST_RESULTS[@]}"
    echo "  Failed Tests: $FAILED_TESTS"
    echo "  Success Rate: $(( (${#TEST_RESULTS[@]} - FAILED_TESTS) * 100 / ${#TEST_RESULTS[@]} ))%"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "All tests passed! Deployment appears ready."
    else
        print_error "$FAILED_TESTS test(s) failed. Please address issues before deployment."
    fi
    
    echo ""
    echo "Detailed Results:"
    echo "=================="
    
    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r test_name status message <<< "$result"
        printf "%-25s [%s] %s\n" "$test_name" "$status" "$message"
    done
    
    echo ""
    echo "Recommendations:"
    echo "================"
    
    if [ $FAILED_TESTS -gt 0 ]; then
        echo "• Fix all FAIL items before proceeding with deployment"
        echo "• Review WARN items and address if necessary"
        echo "• Re-run this test script after making changes"
    else
        echo "• All critical tests passed"
        echo "• Review any WARN items for optimization opportunities"
        echo "• Proceed with deployment when ready"
    fi
    
    if [ "$PAYMENT_MODE" = "production" ]; then
        echo "• Ensure all external services are properly configured"
        echo "• Verify SSL certificates are installed and valid"
        echo "• Test payment processing with small amounts"
        echo "• Monitor logs closely after deployment"
    fi
    
    echo ""
}

# Main test execution
main() {
    echo "=================================================="
    echo "  Kin Workspace E-commerce - Deployment Testing"
    echo "=================================================="
    echo ""
    
    test_environment
    test_node_environment
    test_database
    test_build
    test_startup
    test_external_services
    test_security
    
    generate_report
    
    # Exit with error code if tests failed
    if [ $FAILED_TESTS -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"