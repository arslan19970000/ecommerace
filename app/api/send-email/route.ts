import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import nodemailer from 'nodemailer'

// ✅ Types for safety
type OrderItem = {
  id: string
  quantity: number
  price: number
  products?: {
    id: string
    name: string
    user_id: string
  } | null
}

type Order = {
  id: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  order_items?: OrderItem[]
}

export async function POST(req: Request) {
  try {
    console.log('🚀 Email API called')
    
    const { order_id, user_id } = await req.json() as { order_id: string, user_id: string }
    
    if (!order_id || !user_id) {
      console.log('❌ Missing order_id or user_id')
      return NextResponse.json({ error: 'Missing order_id or user_id' }, { status: 400 })
    }

    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Missing EMAIL_USER or EMAIL_PASS')
      return NextResponse.json({ error: 'Email configuration missing' }, { status: 500 })
    }

    // 1) Get order with order_items and products
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', order_id)
      .single<Order>()   // ✅ typed

    if (orderErr || !order) {
      console.log('❌ Order not found:', orderErr)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log(`✅ Order found with ${order.order_items?.length || 0} items`)

    // 2) Get buyer details
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.admin.getUserById(user_id)
    
    if (userErr || !user) {
      console.log('❌ User not found:', userErr)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`✅ Buyer email: ${user.email}`)

    // 3) Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    })

    // Test SMTP connection
    try {
      await transporter.verify()
      console.log('✅ SMTP connection verified')
    } catch (verifyError) {
      console.log('❌ SMTP connection failed:', verifyError)
      return NextResponse.json({ error: 'Email service connection failed' }, { status: 500 })
    }

    // 4) Create order items summary for buyer email
    const orderItemsHtml = order.order_items?.map((item: OrderItem) => `
      <div style="background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px;">
        <p style="margin: 3px 0;"><b>${item.products?.name || 'Product'}</b></p>
        <p style="margin: 3px 0; color: #666;">
          Quantity: ${item.quantity} × $${item.price} = $${(item.quantity * item.price).toFixed(2)}
        </p>
      </div>
    `).join('') || ''

    // 5) Send confirmation email to Buyer
    console.log('📤 Sending buyer confirmation email...')
    
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '🎉 Order Confirmation – Thank you for your purchase!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
            <h2 style="color: #2ecc71; text-align: center;">✅ Payment Successful</h2>
            
            <p style="font-size: 16px; color: #333;">Hi <b>${user.email}</b>,</p>
            
            <p style="font-size: 16px; color: #333;">
              Thank you for your purchase! 🎉 <br/>
              Your order has been successfully placed and is being processed.
            </p>

            <div style="background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 16px;"><b>Order ID:</b> <span style="color: #555;">${order.id}</span></p>
              <p style="margin: 5px 0; font-size: 16px;"><b>Total Amount:</b> $${order.total_amount}</p>
              <p style="margin: 5px 0; font-size: 16px;"><b>Order Status:</b> <span style="color: #f39c12;">${order.status}</span></p>
              <p style="margin: 5px 0; font-size: 16px;"><b>Payment Status:</b> <span style="color: #2ecc71;">${order.payment_status}</span></p>
            </div>

            <h3 style="color: #34495e; margin: 20px 0 10px 0;">📦 Order Items:</h3>
            ${orderItemsHtml}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/buyer/orders"
                 style="background: #2ecc71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
                View My Orders
              </a>
            </div>
          </div>
        `,
      })
      
      console.log('✅ Buyer email sent successfully')
    } catch (emailError) {
      console.log('❌ Failed to send buyer email:', emailError)
    }

    // 6) Get seller information and send emails
    const sellerEmails = new Map<string, any>()
    let sellerEmailsSent = 0

    // Get unique seller user_ids from products
    const sellerUserIds = [...new Set(
      order.order_items?.map(item => item.products?.user_id).filter(Boolean) || []
    )]

    console.log('🔍 Found seller IDs:', sellerUserIds)

    // Loop through sellers
    for (const sellerId of sellerUserIds) {
      try {
        let { data: sellerProfile, error: sellerErr } = await supabaseAdmin
          .from('profiles')
          .select('email, full_name, role')
          .eq('auth_users_id', sellerId)
          .single()

        if (sellerErr) {
          const result = await supabaseAdmin
            .from('profiles')
            .select('email, full_name, role')
            .eq('user_id', sellerId)
            .single()
          sellerProfile = result.data
          sellerErr = result.error
        }

        if (sellerErr) {
          const result = await supabaseAdmin
            .from('profiles')
            .select('email, full_name, role')
            .eq('id', sellerId)
            .single()
          sellerProfile = result.data
          sellerErr = result.error
        }

        if (!sellerErr && sellerProfile?.email && sellerProfile?.role === 'seller') {
          const sellerItems = order.order_items?.filter(item => item.products?.user_id === sellerId) || []
          sellerEmails.set(sellerProfile.email, {
            name: sellerProfile.full_name || 'Seller',
            items: sellerItems,
            sellerId
          })
        }
      } catch (error) {
        console.log(`❌ Error getting seller ${sellerId}:`, error)
      }
    }

    console.log(`📧 Found ${sellerEmails.size} sellers to email`)

    // Send email to each seller
    for (const [sellerEmail, sellerData] of sellerEmails) {
      console.log(`📤 Sending seller email to: ${sellerEmail}`)
      
      const sellerItemsHtml = sellerData.items.map((item: OrderItem) => `
        <div style="background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px;">
          <p style="margin: 3px 0;"><b>${item.products?.name}</b></p>
          <p style="margin: 3px 0; color: #666;">Quantity: ${item.quantity}</p>
          <p style="margin: 3px 0; color: #666;">Price: $${item.price} each</p>
          <p style="margin: 3px 0; color: #2ecc71;"><b>Total: $${(item.quantity * item.price).toFixed(2)}</b></p>
        </div>
      `).join('')

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: sellerEmail,
          subject: '🛒 New Order Received - Action Required',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
              <h2 style="color: #3498db; text-align: center;">📦 New Order Notification</h2>
              <p>Hi <b>${sellerData.name}</b>, you have new items to ship.</p>
              ${sellerItemsHtml}
            </div>
          `
        })
        console.log(`✅ Seller email sent to: ${sellerEmail}`)
        sellerEmailsSent++
      } catch (sellerEmailError) {
        console.log(`❌ Failed to send seller email to ${sellerEmail}:`, sellerEmailError)
      }
    }

    console.log(`🎉 Email process completed. Seller emails sent: ${sellerEmailsSent}`)

    return NextResponse.json({ 
      success: true,
      buyer_email: user.email,
      seller_emails_sent: sellerEmailsSent,
      total_sellers: sellerEmails.size,
      total_items: order.order_items?.length || 0,
      order_total: order.total_amount,
      seller_ids_found: sellerUserIds
    })

  } catch (error: any) {
    console.error('💥 Email API Error:', error)
    return NextResponse.json({ error: 'Failed to send emails', details: error.message }, { status: 500 })
  }
}
