// app/api/checkout/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const { user_id, items } = await req.json() as {
      user_id: string,
      items: Array<{ product_id: string; name: string; price: number; quantity: number; image_url?: string | null; cart_id: string }>
    }

    if (!user_id || !items?.length) {
      return NextResponse.json({ error: 'Missing user or items' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((it) => ({
      quantity: it.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(it.price * 100),
        product_data: {
          name: it.name,
          images: it.image_url ? [it.image_url] : []
        }
      }
    }))

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      metadata: {
        user_id,
        cart: JSON.stringify(items.map(({ cart_id, product_id, quantity, price }) => ({ cart_id, product_id, quantity, price })))
      },
      success_url: `${origin}/dashboard/buyer/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/buyer/cart`
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
