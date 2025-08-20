'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: user } = await supabase.auth.getUser()
      const uid = user.user?.id ?? null

      if (uid) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            total_amount,
            created_at,
            order_items (
              quantity,
              price,
              products(name)
            )
          `)
          .eq('user_id', uid)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Order fetch error:', error.message)
        }

        // Deduplicate orders (avoid showing same order multiple times)
        const uniqueOrders = Object.values(
          (data || []).reduce((acc: any, order: any) => {
            if (!acc[order.id]) acc[order.id] = order
            return acc
          }, {})
        )

        setOrders(uniqueOrders)
      }
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    // Delete child items first
    await supabase.from('order_items').delete().eq('order_id', orderId)

    // Then delete parent order
    const { error } = await supabase.from('orders').delete().eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== orderId))
      alert('Order cancelled and deleted successfully')
    }
  }

  if (loading) return <p>Loading orders...</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Orders</h1>
      {orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className="mb-6 border p-4 rounded bg-white">
            <h2 className="font-semibold">Order #{order.id}</h2>
            <p>Total: ${order.total_amount}</p>
            <p>Date: {new Date(order.created_at).toLocaleString()}</p>

            <h3 className="mt-2 font-medium">Items:</h3>
            <ul>
              {order.order_items.map((item: any, idx: number) => (
                <li key={idx}>
                  {item.products.name} - {item.quantity} × ${item.price}
                </li>
              ))}
            </ul>

            <button
              onClick={() => cancelOrder(order.id)}
              className="mt-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel Order
            </button>
          </div>
        ))
      )}
    </div>
  )
}
