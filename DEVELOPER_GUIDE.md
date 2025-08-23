# 🛠️ Kin Workspace E-commerce - Developer Guide

## Project Overview

This is a modern e-commerce platform built with Next.js 15, TypeScript, and Tailwind CSS. The project is designed with a demo-first approach, allowing full functionality without external dependencies while being production-ready.

## Architecture

### Tech Stack
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with custom design system
- **Database:** Prisma ORM with SQLite (demo) / PostgreSQL (production)
- **Authentication:** JWT-based with bcrypt hashing
- **State Management:** React Context (CartContext, AuthContext, WishlistContext)
- **Testing:** Jest with React Testing Library
- **Deployment:** Vercel (recommended)

### Project Structure
```
app/
├── api/                 # API routes (Next.js App Router)
│   ├── auth/           # Authentication endpoints
│   ├── products/       # Product management
│   ├── reviews/        # Review system
│   └── wishlist/       # Wishlist functionality
├── components/         # Reusable UI components
│   ├── auth/          # Authentication components
│   ├── checkout/      # Checkout flow components
│   └── reviews/       # Review system components
├── contexts/          # React Context providers
├── lib/               # Utilities and services
└── [pages]/           # File-based routing

.kiro/
├── specs/             # Feature specifications
└── steering/          # Development guidelines

__tests__/             # Test files
prisma/               # Database schema and migrations
```

## Development Setup

### Prerequisites
- Node.js 18+ and npm 8+
- Git
- VS Code (recommended) with TypeScript and Tailwind extensions

### Initial Setup
```bash
# Clone and install
git clone [repository-url]
cd kin-workspace-ecommerce
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your configuration

# Database setup
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run demo:reset   # Reset demo data
npm run demo:seed    # Generate demo data
```

## Development Guidelines

### Code Standards
- **TypeScript:** Strict mode enabled, no `any` types
- **ESLint:** Next.js configuration with custom rules
- **Prettier:** Consistent code formatting
- **File Naming:** PascalCase for components, kebab-case for utilities
- **Import Order:** External → Internal → Relative imports

### Component Patterns
```typescript
// Component structure
interface ComponentProps {
  // Props with proper TypeScript types
}

export default function Component({ prop }: ComponentProps) {
  // Component logic
  return (
    // JSX with Tailwind classes
  )
}
```

### API Route Patterns
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // API logic
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Error message' }, { status: 500 })
  }
}
```

### Database Patterns
```typescript
// Using Prisma
import { prisma } from '@/lib/db'

const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { orders: true }
})
```

## Feature Development

### Adding New Features
1. **Create Spec:** Add requirements, design, and tasks in `.kiro/specs/`
2. **Write Tests:** Test-driven development approach
3. **Implement API:** Create API routes with proper error handling
4. **Build Components:** Create reusable UI components
5. **Add Pages:** Implement user-facing pages
6. **Update Types:** Add TypeScript interfaces
7. **Test Integration:** End-to-end testing

### Service Abstraction Pattern
For features that need demo/production modes:

```typescript
// Service interface
interface PaymentService {
  processPayment(amount: number): Promise<PaymentResult>
  isDemo(): boolean
}

// Factory pattern
export function createPaymentService(): PaymentService {
  return process.env.PAYMENT_MODE === 'demo'
    ? new DemoPaymentService()
    : new StripePaymentService()
}
```

### State Management
Use React Context for global state:

```typescript
// Context creation
const CartContext = createContext<CartContextType | undefined>(undefined)

// Custom hook
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
```

## Testing Strategy

### Test Structure
```
__tests__/
├── api-integration.test.ts    # API endpoint tests
├── auth-database.test.ts      # Authentication tests
├── cart-context.test.tsx      # Context tests
└── [feature].test.ts          # Feature-specific tests
```

### Testing Patterns
```typescript
// Component testing
import { render, screen } from '@testing-library/react'
import Component from '@/components/Component'

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })
})

// API testing
import { GET } from '@/app/api/endpoint/route'

describe('/api/endpoint', () => {
  it('should return data', async () => {
    const response = await GET(new Request('http://localhost/api/endpoint'))
    const data = await response.json()
    expect(data).toHaveProperty('expectedProperty')
  })
})
```

### Test Commands
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test -- --coverage  # Coverage report
```

## Database Management

### Schema Changes
```bash
# After modifying prisma/schema.prisma
npx prisma db push        # Apply changes to database
npx prisma generate       # Regenerate Prisma client
```

### Migrations (Production)
```bash
npx prisma migrate dev --name migration-name
npx prisma migrate deploy  # Production deployment
```

### Database Inspection
```bash
npx prisma studio         # Visual database browser
```

## Deployment

### Demo Deployment
```bash
# Build and test locally
npm run build
npm run start

# Deploy to Vercel
vercel --prod
```

### Production Deployment
1. **Environment Variables:** Set production values
2. **Database:** Set up PostgreSQL database
3. **Services:** Configure Stripe, email service, etc.
4. **Domain:** Configure custom domain
5. **Monitoring:** Set up error tracking and analytics

### Environment Variables
```bash
# Demo
PAYMENT_MODE=demo
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_DEMO_MODE=true

# Production
PAYMENT_MODE=production
DATABASE_URL="postgresql://..."
STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
EMAIL_SERVICE_API_KEY="..."
```

## Performance Optimization

### Next.js Optimizations
- **Image Optimization:** Use `next/image` component
- **Bundle Analysis:** `npm run build` shows bundle sizes
- **Code Splitting:** Automatic with App Router
- **Static Generation:** Use `generateStaticParams` where possible

### Database Optimization
- **Indexing:** Add indexes for frequently queried fields
- **Query Optimization:** Use `include` and `select` appropriately
- **Connection Pooling:** Configure for production

### Monitoring
```typescript
// Error tracking
import { captureException } from '@sentry/nextjs'

try {
  // Code that might fail
} catch (error) {
  captureException(error)
  // Handle error
}
```

## Debugging

### Common Issues
- **Hydration Errors:** Check for client/server rendering differences
- **Database Errors:** Verify schema and connection
- **Type Errors:** Run `npm run type-check`
- **Build Errors:** Check for unused imports and type issues

### Debug Tools
- **React DevTools:** Component inspection
- **Prisma Studio:** Database inspection
- **Next.js DevTools:** Performance and bundle analysis
- **Browser DevTools:** Network and console debugging

## Contributing

### Pull Request Process
1. Create feature branch from `main`
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation if needed
5. Submit PR with clear description

### Code Review Checklist
- [ ] Tests written and passing
- [ ] TypeScript types properly defined
- [ ] Error handling implemented
- [ ] Performance considerations addressed
- [ ] Accessibility standards met
- [ ] Documentation updated

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Project-Specific
- `README.md` - Project overview
- `.kiro/specs/` - Feature specifications
- `.kiro/steering/` - Development guidelines
- `DEMO_SETUP_GUIDE.md` - Demo setup instructions

---

**Happy coding! 🚀**

This guide should help you understand the project structure and development patterns. For specific feature implementation, check the specs in `.kiro/specs/` directory.