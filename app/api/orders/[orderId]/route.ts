import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/app/lib/auth-utils'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    // Fetch order with all related data
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: authResult.user.id // Ensure user can only access their own orders
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                media: {
                  include: { media: true },
                  orderBy: { sortOrder: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Transform the data to match our interface
    const transformedOrder = {
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          image: item.product.media[0]?.media?.filename 
            ? `/uploads/${item.product.media[0].media.filename}`
            : '/images/placeholder.jpg',
          images: item.product.media.map(m => 
            `/uploads/${m.media.filename}`
          )
        }
      }))
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}