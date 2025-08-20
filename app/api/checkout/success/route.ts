// app/api/checkout/success/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)



export async function POST(req: Request) {
  try {
    const { session_id } = await req.json() as { session_id: string }
    if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const user_id = session.metadata?.user_id
    const cartMeta = session.metadata?.cart
    if (!user_id || !cartMeta) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const cartItems: Array<{ cart_id: string; product_id: string; quantity: number; price: number }> = JSON.parse(cartMeta)

    // Compute total server-side for safety
    const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)

    // 1) Create order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({ user_id, total_amount: total })
      .select()
      .single()

    if (orderErr || !order) {
      console.error(orderErr)
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }

    // 2) Create order_items
    const orderItems = cartItems.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      price: i.price
    }))

    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems)
    if (itemsErr) {
      console.error(itemsErr)
      return NextResponse.json({ error: 'Order items failed' }, { status: 500 })
    }

    // 3) Clear cart rows (only those we checked out)
    const cartIds = cartItems.map((i) => i.cart_id)
    const { error: clearErr } = await supabaseAdmin.from('carts').delete().in('id', cartIds)
    if (clearErr) {
      console.error(clearErr)
      // Not fatal to the buyer, but log it
    }

    return NextResponse.json({ ok: true, order_id: order.id })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
