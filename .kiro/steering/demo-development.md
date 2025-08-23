# Demo Development Guidelines

## Demo-First Development Approach

When implementing features, always consider both demo and production modes:

### Demo Mode Requirements
- All functionality must work completely offline/locally
- No real external API dependencies required
- Clear "DEMO MODE" indicators throughout the interface
- Realistic but obviously fake data and transactions
- Easy reset functionality for demonstrations

### Service Abstraction Pattern
Always implement services with abstraction layers:

```typescript
// Use factory pattern for service switching
interface PaymentService {
  processPayment(amount: number, method: PaymentMethod): Promise<PaymentResult>
  isDemo(): boolean
}

const paymentService = process.env.PAYMENT_MODE === 'demo' 
  ? new DemoPaymentService()
  : new StripePaymentService()
```

### Demo Data Standards
- Use realistic but clearly fake information
- Include sample orders, reviews, and user accounts
- Provide rich demo scenarios for feature showcase
- Ensure demo data survives browser refresh

### Environment Configuration
- Use environment variables for demo/production switching
- Provide clear configuration templates
- Document all required environment variables
- Validate configuration on startup

### Production Readiness
- All demo implementations must have production counterparts ready
- Environment variable switching should be seamless
- No demo-specific code should reach production
- Maintain security and performance standards in both modes

## Demo Testing Requirements
- Test complete user flows in demo mode
- Validate production switching functionality
- Ensure demo indicators are visible and clear
- Test demo data reset functionality
- Verify offline functionality works completely