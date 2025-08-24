import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/app/lib/auth-utils'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = params

    // Fetch order with items
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: authResult.user.id
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

    // Check if order can be reordered (not cancelled)
    if (order.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot reorder a cancelled order' },
        { status: 400 }
      )
    }

    // Transform order items to cart format
    const cartItems = order.items.map(item => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.price),
        image: item.product.media[0]?.media?.filename 
          ? `/uploads/${item.product.media[0].media.filename}`
          : '/images/placeholder.jpg',
        slug: item.product.slug,
        category: '', // We don't have category in order item
        inStock: item.product.inventoryQuantity > 0
      },
      quantity: item.quantity,
      variant: item.variant as any
    }))

    // Check product availability
    const unavailableItems = cartItems.filter(item => !item.product.inStock)
    
    return NextResponse.json({
      success: true,
      cartItems,
      unavailableItems: unavailableItems.length > 0 ? unavailableItems : undefined,
      message: unavailableItems.length > 0 
        ? 'Some items are no longer available'
        : 'Items ready to add to cart'
    })
  } catch (error) {
    console.error('Error processing reorder:', error)
    return NextResponse.json(
      { error: 'Failed to process reorder' },
      { status: 500 }
    )
  }
}