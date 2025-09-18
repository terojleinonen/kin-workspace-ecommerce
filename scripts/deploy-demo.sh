#!/bin/bash

# Kin Workspace E-commerce - Demo Deployment Script
# This script sets up and deploys the application in demo mode

set -e  # Exit on any error

echo "🚀 Starting Kin Workspace Demo Deployment..."

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

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    print_success "npm $(npm --version) is installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Setup demo environment
setup_demo_environment() {
    print_status "Setting up demo environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        
        # Update .env with demo-specific values
        sed -i.bak 's/PAYMENT_MODE="demo"/PAYMENT_MODE="demo"/' .env
        sed -i.bak 's/NEXT_PUBLIC_DEMO_MODE="true"/NEXT_PUBLIC_DEMO_MODE="true"/' .env
        sed -i.bak 's/EMAIL_SERVICE="demo"/EMAIL_SERVICE="demo"/' .env
        sed -i.bak 's/STORAGE_PROVIDER="local"/STORAGE_PROVIDER="local"/' .env
        
        # Remove backup file
        rm -f .env.bak
        
        print_success "Demo environment configuration created"
    else
        print_warning ".env file already exists. Please verify demo configuration."
    fi
}

# Setup database
setup_database() {
    print_status "Setting up demo database..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Push database schema
    npx prisma db push --force-reset
    
    # Seed database with demo data
    if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
        npx prisma db seed
        print_success "Database seeded with demo data"
    else
        print_warning "No seed file found. Database created without demo data."
    fi
    
    print_success "Demo database setup completed"
}

# Build application
build_application() {
    print_status "Building application..."
    npm run build
    print_success "Application built successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    if npm run test -- --passWithNoTests --watchAll=false; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed, but continuing with deployment"
    fi
}

# Start development server
start_dev_server() {
    print_status "Starting development server..."
    print_success "Demo deployment completed successfully!"
    echo ""
    echo "🎉 Your Kin Workspace demo is ready!"
    echo ""
    echo "📍 Access your demo at: http://localhost:3000"
    echo ""
    echo "🧪 Demo Features:"
    echo "  • Complete e-commerce functionality"
    echo "  • Simulated payment processing"
    echo "  • Demo user accounts and data"
    echo "  • Offline operation (no external dependencies)"
    echo ""
    echo "💳 Demo Credit Cards:"
    echo "  • Success: 4111111111111111"
    echo "  • Declined: 4000000000000002"
    echo "  • Insufficient Funds: 4000000000009995"
    echo ""
    echo "🔧 Useful Commands:"
    echo "  • Reset demo data: npm run demo:reset"
    echo "  • View logs: npm run logs"
    echo "  • Stop server: Ctrl+C"
    echo ""
    echo "Starting server..."
    npm run dev
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    # Add any cleanup tasks here
}

# Trap cleanup function on script exit
trap cleanup EXIT

# Main deployment flow
main() {
    echo "=================================================="
    echo "  Kin Workspace E-commerce - Demo Deployment"
    echo "=================================================="
    echo ""
    
    check_node
    check_npm
    install_dependencies
    setup_demo_environment
    setup_database
    build_application
    run_tests
    start_dev_server
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi