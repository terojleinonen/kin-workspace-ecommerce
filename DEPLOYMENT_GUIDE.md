# Kin Workspace E-commerce Deployment Guide

This guide covers deploying the Kin Workspace e-commerce platform in both demo and production environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Demo Deployment](#demo-deployment)
- [Production Deployment](#production-deployment)
- [Database Setup](#database-setup)
- [Service Integration](#service-integration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Overview

The Kin Workspace e-commerce platform is designed to run in two modes:

- **Demo Mode**: Fully functional offline demonstration with simulated services
- **Production Mode**: Live e-commerce store with real payment processing and external integrations

## Prerequisites

### System Requirements

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Git
- SSL certificate (for production)

### Development Tools

```bash
# Install required tools
npm install -g prisma
npm install -g next
```

### External Services (Production Only)

- **Database**: PostgreSQL 12+ (recommended) or MySQL 8+
- **Payment Processing**: Stripe account with API keys
- **Email Service**: SendGrid account with API key
- **File Storage**: Cloudinary account (optional, can use local storage)
- **Domain**: Custom domain with SSL certificate

## Environment Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Demo Mode Configuration

```env
# Application Mode
PAYMENT_MODE=demo
NODE_ENV=development
NEXT_PUBLIC_DEMO_MODE=true

# Database (SQLite for demo)
DATABASE_URL="file:./prisma/dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="Kin Workspace"

# Demo Configuration
DEMO_SUCCESS_RATE="0.9"
DEMO_PROCESSING_DELAY="2000"
DEMO_ENABLE_FAILURES="true"

# Services (Demo)
EMAIL_SERVICE="demo"
STORAGE_PROVIDER="local"
CMS_ENABLED="false"
MONITORING_ENABLED="false"
```

### Production Mode Configuration

```env
# Application Mode
PAYMENT_MODE=production
NODE_ENV=production
NEXT_PUBLIC_DEMO_MODE=false

# Database (PostgreSQL recommended)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Authentication (Generate secure secrets)
JWT_SECRET="your-production-jwt-secret-minimum-32-characters"
NEXTAUTH_SECRET="your-production-nextauth-secret-minimum-32-characters"
NEXTAUTH_URL="https://yourdomain.com"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
NEXT_PUBLIC_SITE_NAME="Kin Workspace"

# Stripe Payment Processing
STRIPE_PUBLISHABLE_KEY="pk_live_your_publishable_key"
STRIPE_SECRET_KEY="sk_live_your_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# SendGrid Email Service
EMAIL_SERVICE="sendgrid"
SENDGRID_API_KEY="SG.your_sendgrid_api_key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="Kin Workspace"

# Cloudinary File Storage (Optional)
STORAGE_PROVIDER="cloudinary"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# CMS Integration (Optional)
CMS_ENABLED="true"
CMS_PROVIDER="contentful"
CMS_ENDPOINT="https://api.contentful.com"
CMS_API_KEY="your_cms_api_key"
CMS_PROJECT_ID="your_project_id"

# Monitoring and Analytics
MONITORING_ENABLED="true"
SENTRY_DSN="https://your_sentry_dsn"
GOOGLE_ANALYTICS_ID="GA_MEASUREMENT_ID"
```

## Demo Deployment

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd kin-workspace-ecommerce
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up demo environment**:
   ```bash
   cp .env.example .env
   # Edit .env with demo configuration (see above)
   ```

4. **Initialize database**:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Open http://localhost:3000
   - Demo mode banner will be visible
   - Use demo credit cards for testing payments

### Demo Deployment Script

Create and run the demo deployment script:

```bash
chmod +x scripts/deploy-demo.sh
./scripts/deploy-demo.sh
```

### Demo Testing

Use these demo credit card numbers for testing:

- **Successful Payment**: 4111111111111111
- **Card Declined**: 4000000000000002
- **Insufficient Funds**: 4000000000009995
- **Lost Card**: 4000000000009987

## Production Deployment

### Pre-deployment Checklist

- [ ] Domain name configured with SSL certificate
- [ ] Database server set up and accessible
- [ ] Stripe account configured with live API keys
- [ ] SendGrid account set up with verified sender
- [ ] Cloudinary account configured (if using)
- [ ] Environment variables configured
- [ ] DNS records pointing to deployment server

### Database Setup

#### PostgreSQL (Recommended)

1. **Create database**:
   ```sql
   CREATE DATABASE kin_workspace_prod;
   CREATE USER kin_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE kin_workspace_prod TO kin_user;
   ```

2. **Configure connection**:
   ```env
   DATABASE_URL="postgresql://kin_user:secure_password@localhost:5432/kin_workspace_prod?sslmode=require"
   ```

#### MySQL (Alternative)

1. **Create database**:
   ```sql
   CREATE DATABASE kin_workspace_prod;
   CREATE USER 'kin_user'@'%' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON kin_workspace_prod.* TO 'kin_user'@'%';
   FLUSH PRIVILEGES;
   ```

2. **Configure connection**:
   ```env
   DATABASE_URL="mysql://kin_user:secure_password@localhost:3306/kin_workspace_prod"
   ```

### Deployment Steps

1. **Prepare production environment**:
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export PAYMENT_MODE=production
   ```

2. **Install dependencies**:
   ```bash
   npm ci --only=production
   ```

3. **Build application**:
   ```bash
   npm run build
   ```

4. **Run database migrations**:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. **Start production server**:
   ```bash
   npm start
   ```

### Production Deployment Script

Create and run the production deployment script:

```bash
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### Platform-Specific Deployments

#### Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Configure project**:
   ```bash
   vercel
   # Follow prompts to configure project
   ```

3. **Set environment variables**:
   ```bash
   vercel env add PAYMENT_MODE production
   vercel env add DATABASE_URL
   vercel env add STRIPE_SECRET_KEY
   # Add all other production environment variables
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

#### Netlify

1. **Build configuration** (netlify.toml):
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy via Git**:
   - Connect repository to Netlify
   - Configure environment variables in Netlify dashboard
   - Deploy from main branch

#### Docker

1. **Dockerfile**:
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. **Build and run**:
   ```bash
   docker build -t kin-workspace .
   docker run -p 3000:3000 --env-file .env kin-workspace
   ```

## Service Integration

### Stripe Setup

1. **Create Stripe account** at https://stripe.com
2. **Get API keys** from Stripe Dashboard
3. **Configure webhooks**:
   - Endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. **Test integration**:
   ```bash
   npm run test:stripe
   ```

### SendGrid Setup

1. **Create SendGrid account** at https://sendgrid.com
2. **Verify sender identity**
3. **Generate API key** with Mail Send permissions
4. **Configure DNS records** for domain authentication
5. **Test integration**:
   ```bash
   npm run test:email
   ```

### Cloudinary Setup (Optional)

1. **Create Cloudinary account** at https://cloudinary.com
2. **Get credentials** from dashboard
3. **Configure upload presets**
4. **Test integration**:
   ```bash
   npm run test:storage
   ```

## Monitoring and Maintenance

### Health Checks

The application provides health check endpoints:

- **Application Health**: `/api/health`
- **Database Health**: `/api/health/database`
- **Services Health**: `/api/health/services`

### Monitoring Setup

#### Sentry (Error Tracking)

1. **Create Sentry project**
2. **Configure DSN**:
   ```env
   SENTRY_DSN="https://your_sentry_dsn"
   ```

#### Google Analytics

1. **Create GA4 property**
2. **Configure measurement ID**:
   ```env
   GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
   ```

### Backup Strategy

#### Database Backups

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
./scripts/backup-database.sh
```

#### File Backups

```bash
# Backup uploaded files (if using local storage)
tar -czf files_backup_$(date +%Y%m%d_%H%M%S).tar.gz public/uploads/

# Cloudinary backups are handled automatically
```

### Performance Optimization

1. **Enable caching**:
   ```bash
   # Redis for session storage (optional)
   npm install redis
   ```

2. **Configure CDN** for static assets

3. **Database optimization**:
   - Add database indexes
   - Configure connection pooling
   - Monitor query performance

### Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] CORS configured properly
- [ ] Security headers configured
- [ ] Regular security updates applied

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check database connectivity
npx prisma db pull

# Reset database (demo mode only)
npm run db:reset
```

#### Payment Processing Issues

```bash
# Test Stripe integration
npm run test:payments

# Check Stripe webhook logs
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### Email Delivery Issues

```bash
# Test email service
npm run test:email

# Check SendGrid activity logs in dashboard
```

### Log Analysis

```bash
# View application logs
tail -f logs/application.log

# View error logs
tail -f logs/error.log

# View access logs
tail -f logs/access.log
```

### Performance Issues

```bash
# Analyze bundle size
npm run analyze

# Check database performance
npm run db:analyze

# Monitor memory usage
npm run monitor:memory
```

### Support

For deployment support:

1. **Check documentation**: Review this guide and README.md
2. **Search issues**: Check GitHub issues for similar problems
3. **Create issue**: Submit detailed bug report with logs
4. **Contact support**: Email support@kinworkspace.com

## Production Readiness Checklist

### Pre-Launch

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificate installed
- [ ] Payment processing tested
- [ ] Email delivery tested
- [ ] File uploads tested
- [ ] Performance testing completed
- [ ] Security audit completed
- [ ] Backup strategy implemented
- [ ] Monitoring configured

### Post-Launch

- [ ] Health checks passing
- [ ] Error tracking active
- [ ] Analytics configured
- [ ] Backup verification
- [ ] Performance monitoring
- [ ] Security monitoring
- [ ] User feedback collection

## Maintenance Schedule

### Daily
- Monitor error rates
- Check system health
- Review performance metrics

### Weekly
- Database backup verification
- Security update review
- Performance optimization review

### Monthly
- Full system backup
- Security audit
- Dependency updates
- Performance analysis

### Quarterly
- Disaster recovery testing
- Security penetration testing
- Capacity planning review
- Business continuity planning

---

For additional support or questions, please refer to the [README.md](./README.md) or contact the development team.