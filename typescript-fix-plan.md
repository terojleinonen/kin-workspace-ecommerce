# TypeScript Error Fix Plan

## Overview
Total Errors: 86 across 17 files
Strategy: Fix core types first, then dependent files, then tests

## Phase 1: Core Type System Fixes (Priority 1)
These are foundational issues that other files depend on.

### 1.1 User Model Alignment (2 errors)
**Files:** `app/profile/page.tsx`
**Issue:** Using `firstName`/`lastName` instead of `name`
**Impact:** Affects all user-related components
**Fix:** Update to use `user.name` and split if needed

### 1.2 ValidationResult Interface (3 errors)
**Files:** `app/lib/config.ts`
**Issue:** Functions returning properties not in ValidationResult interface
**Impact:** Affects all validation functions
**Fix:** Either extend interface or simplify return objects

### 1.3 Service Factory Duplicates (25 errors)
**Files:** `app/lib/service-factory.ts`
**Issue:** Duplicate function declarations, undefined config access
**Impact:** Affects all service instantiation
**Fix:** Remove duplicates, add proper null checks

## Phase 2: Database/Prisma Fixes (Priority 2)
These affect data operations and API routes.

### 2.1 User Creation Fields (3 errors)
**Files:** `app/lib/demo-data-generator.ts`
**Issue:** Using `password` instead of `passwordHash`, missing `name` field
**Impact:** Demo data generation fails
**Fix:** Update field names to match Prisma schema

### 2.2 Review Model Fields (1 error)
**Files:** `app/lib/demo-data-generator.ts`
**Issue:** Using `content` instead of `comment`
**Impact:** Review creation fails
**Fix:** Update field name

### 2.3 Order Status Types (1 error)
**Files:** `app/lib/demo-data-generator.ts`
**Issue:** String status vs OrderStatus enum
**Impact:** Order creation fails
**Fix:** Cast to proper enum type

### 2.4 Product Creation Fields (1 error)
**Files:** `app/lib/product-sync.ts`
**Issue:** Missing `createdBy` field
**Impact:** Product sync fails
**Fix:** Add required field

## Phase 3: API Route Fixes (Priority 3)
These affect the API functionality.

### 3.1 Missing Exports (1 error)
**Files:** `__tests__/product-sync.test.ts`
**Issue:** `SyncResult` not exported from product-sync module
**Impact:** Test compilation fails
**Fix:** Export the type or import from correct location

## Phase 4: Test File Fixes (Priority 4)
These are test-specific issues that don't affect production.

### 4.1 Mock Data Type Mismatches (15 errors)
**Files:** Multiple test files
**Issue:** Mock objects missing required properties
**Impact:** Test compilation fails
**Fix:** Update mock objects to match current interfaces

### 4.2 Jest Fetch Mocking (16 errors)
**Files:** `__tests__/order-management.test.ts`
**Issue:** Incorrect fetch mock typing
**Impact:** Test compilation fails
**Fix:** Proper Jest mock typing

### 4.3 API Route Test Parameters (7 errors)
**Files:** `__tests__/products-api.test.ts`, `__tests__/reviews-api.test.ts`
**Issue:** Using old sync params instead of Promise params
**Impact:** Test compilation fails
**Fix:** Update to async params pattern

### 4.4 Import Path Issues (2 errors)
**Files:** `__tests__/reviews.test.ts`, test files
**Issue:** Wrong import paths
**Impact:** Test compilation fails
**Fix:** Correct import paths

### 4.5 Environment Variable Issues (4 errors)
**Files:** Production readiness tests
**Issue:** Cannot assign to readonly NODE_ENV, duplicate variables
**Impact:** Test compilation fails
**Fix:** Use proper environment mocking

### 4.6 Missing Service Methods (4 errors)
**Files:** `__tests__/production-services.test.ts`
**Issue:** Importing non-existent methods
**Impact:** Test compilation fails
**Fix:** Import correct methods or create missing ones

### 4.7 Checkout Utils Test (2 errors)
**Files:** `__tests__/checkout-utils.test.ts`
**Issue:** Missing properties in test objects
**Impact:** Test compilation fails
**Fix:** Add missing properties to test data

### 4.8 Payment API Test (1 error)
**Files:** `__tests__/payment-api.test.ts`
**Issue:** Deleting non-optional property
**Impact:** Test compilation fails
**Fix:** Make property optional or use different approach

## Implementation Order

### Step 1: Core Types (Estimated: 30 min)
1. Fix ValidationResult interface in config.ts
2. Fix service-factory duplicates and null checks
3. Fix profile page user field access

### Step 2: Database Schema Alignment (Estimated: 20 min)
1. Fix demo-data-generator field names
2. Fix product-sync missing fields
3. Verify all Prisma operations use correct field names

### Step 3: Export/Import Issues (Estimated: 10 min)
1. Fix missing exports
2. Correct import paths
3. Verify all modules export what they claim

### Step 4: Test Files (Estimated: 45 min)
1. Update mock data to match current interfaces
2. Fix Jest fetch mocking
3. Update API route test parameters
4. Fix environment variable mocking
5. Add missing test service methods

## Verification Plan
After each phase:
1. Run `npx tsc --noEmit` to check remaining errors
2. Run `npm run build` to verify build passes
3. Run tests to ensure functionality works

## Risk Assessment
- **Low Risk:** Test file fixes (won't affect production)
- **Medium Risk:** Type interface changes (might affect other files)
- **High Risk:** Database schema changes (could break existing data)

## Success Criteria
- `npx tsc --noEmit` returns 0 errors
- `npm run build` completes successfully
- All tests pass
- No runtime errors in development mode