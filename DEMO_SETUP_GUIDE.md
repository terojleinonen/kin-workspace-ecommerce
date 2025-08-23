# 🎭 Kin Workspace Demo Store - Setup Guide

## Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ and npm 8+
- Git

### Installation
```bash
# Clone the repository
git clone [your-repository-url]
cd kin-workspace-ecommerce

# Install dependencies
npm install

# Set up demo environment
cp .env.example .env.local
```

### Environment Configuration
Edit `.env.local` with these demo settings:
```bash
# Demo Mode Configuration
PAYMENT_MODE=demo
DEMO_SUCCESS_RATE=0.9
DEMO_PROCESSING_DELAY=2000

# Database (SQLite for demo)
DATABASE_URL="file:./prisma/dev.db"

# CMS Configuration (optional)
CMS_ENDPOINT=your-cms-url
CMS_API_KEY=your-cms-key

# Demo Mode Indicator
NEXT_PUBLIC_DEMO_MODE=true
```

### Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Set up database
npx prisma db push

# Seed with demo data
npx prisma db seed
```

### Start Demo Store
```bash
npm run dev
```

Visit `http://localhost:3000` to see your demo store!

## Demo Features

### 🛒 Shopping Experience
- Browse 32+ workspace products
- Add items to cart with variants
- Complete checkout with demo payments
- View order history and tracking

### 💳 Demo Payment System
- Use demo credit card numbers:
  - Visa: `4242424242424242`
  - Mastercard: `5555555555554444`
  - American Express: `378282246310005`
  - Declined Card: `4000000000000002`
- Any future expiry date and CVC work
- 90% success rate (configurable)

### 👤 Demo User Accounts
- Register new accounts or use demo accounts
- Complete user profiles and preferences
- Wishlist functionality
- Product reviews and ratings

### 📦 Order Management
- View order history with filtering
- Track order status progression
- Reorder previous purchases
- Download demo receipts

## Demo Data Management

### Reset Demo Data
```bash
npm run demo:reset
```

### Generate Fresh Demo Data
```bash
npm run demo:seed
```

### Demo User Accounts
- **Customer:** demo@customer.com / password123
- **Admin:** demo@admin.com / admin123

## Customization

### Modify Demo Success Rate
In `.env.local`:
```bash
DEMO_SUCCESS_RATE=0.95  # 95% success rate
DEMO_PROCESSING_DELAY=3000  # 3 second delay
```

### Add Custom Demo Products
Edit `prisma/seed.ts` to add your products, then:
```bash
npm run demo:seed
```

### Customize Demo Scenarios
Edit demo data in:
- `app/lib/demo-data.ts` - Demo orders and users
- `app/lib/demo-payment.ts` - Payment scenarios
- `prisma/seed.ts` - Product catalog

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
npm run dev -- -p 3001
```

**Database connection errors:**
```bash
npx prisma db push --force-reset
npm run demo:seed
```

**Demo mode not showing:**
Verify `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local`

**CMS sync failing:**
Demo works without CMS - check CMS credentials or disable CMS sync

### Getting Help
- Check the console for error messages
- Verify all environment variables are set
- Ensure Node.js version is 18+
- Try resetting demo data

## Production Deployment

When ready for production, see `PRODUCTION_DEPLOYMENT_GUIDE.md` for switching to live payments and services.

## Demo Presentation Tips

### Key Features to Showcase
1. **Complete E-commerce Flow** - Registration → Shopping → Checkout → Orders
2. **Responsive Design** - Test on mobile and desktop
3. **User Experience** - Smooth animations and interactions
4. **Admin Features** - Product management and order tracking
5. **Performance** - Fast loading and smooth navigation

### Demo Script Suggestions
1. Start with homepage and brand presentation
2. Browse products and show filtering/search
3. Add items to cart and show cart management
4. Complete checkout with demo payment
5. Show order confirmation and history
6. Demonstrate user account features
7. Show responsive design on mobile

### Demo Reset Between Presentations
```bash
npm run demo:reset
```

This ensures each demo starts with fresh, consistent data.

---

**Your demo store is now ready! 🎉**

The store runs completely offline and provides a realistic e-commerce experience without any real transactions or external dependencies.