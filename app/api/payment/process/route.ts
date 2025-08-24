import { NextRequest, NextResponse } from 'next/server'
import { PaymentServiceFactory } from '../../../lib/payment-service'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../../../lib/auth-utils'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Get and verify auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      amount,
      paymentMethod,
      shippingAddress,
      billingAddress,
      cartItems,
      orderSummary
    } = body

    // Validate required fields
    if (!amount || !paymentMethod || !shippingAddress || !billingAddress || !cartItems) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate cart items
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart cannot be empty' },
        { status: 400 }
      )
    }

    // Get payment service instance
    const paymentService = PaymentServiceFactory.getInstance()

    // Validate payment method
    const validation = paymentService.validatePaymentMethod(paymentMethod)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid payment method', details: validation.errors },
        { status: 400 }
      )
    }

    // Process payment
    const paymentResult = await paymentService.processPayment(amount, paymentMethod)

    if (!paymentResult.success) {
      return NextResponse.json(
        { 
          error: 'Payment failed', 
          message: paymentResult.error,
          paymentId: paymentResult.paymentId
        },
        { status: 402 }
      )
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: decoded.userId,
        status: 'CONFIRMED',
        total: orderSummary?.total || amount,
        subtotal: orderSummary?.subtotal || amount,
        tax: orderSummary?.tax || 0,
        shipping: orderSummary?.shipping || 0,
        shippingAddress,
        billingAddress,
        paymentMethod: paymentService.isDemo() ? 'demo' : paymentMethod.type,
        paymentStatus: 'PAID',
        items: {
          create: cartItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant || null
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Return success response
    return NextResponse.json({
      success: true,
      paymentId: paymentResult.paymentId,
      transactionId: paymentResult.transactionId,
      orderId: order.id,
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price
        }))
      },
      receipt: paymentResult.receipt,
      isDemoTransaction: paymentService.isDemo()
    })

  } catch (error) {
    console.error('Payment processing error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET endpoint to retrieve payment methods and demo information
export async function GET(request: NextRequest) {
  try {
    const paymentService = PaymentServiceFactory.getInstance()
    
    const response: any = {
      isDemo: paymentService.isDemo(),
      supportedMethods: ['card']
    }

    // Add demo-specific information
    if (paymentService.isDemo()) {
      const demoService = paymentService as any
      response.demoInfo = {
        scenarios: demoService.getDemoScenarios(),
        cardNumbers: demoService.getDemoCardNumbers(),
        processingStats: demoService.getProcessingStats()
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Payment info error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}