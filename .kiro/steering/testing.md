# E-commerce Testing Guidelines

## Core Testing Principle
**ALWAYS write tests first** - Before implementing any feature or fix, write a test that demonstrates the expected behavior.

## Testing Standards
- Write tests for all new features and bug fixes
- Use descriptive test names that explain the behavior being tested
- Include both positive and negative test cases
- Test edge cases and error conditions
- Keep tests focused and isolated

## E-commerce Specific Testing
- Test cart functionality (add, remove, update quantities)
- Test product filtering and search
- Test responsive design across devices
- Test API endpoints for products and cart operations
- Test form validation and user interactions

## Test Structure
- Use `describe` blocks to group related tests
- Use `beforeEach`/`afterEach` for test setup/cleanup
- Mock external dependencies when appropriate
- Use meaningful assertions with clear error messages