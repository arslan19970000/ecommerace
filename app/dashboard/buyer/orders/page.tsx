'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'


export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  

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
   <div className="max-w-3xl mx-auto mt-8 space-y-6">
  <h1 className="text-3xl font-bold mb-6">My Orders</h1>

  {orders.length === 0 ? (
    <div className="p-6 text-center bg-gray-50 rounded-lg shadow">
      <p className="text-gray-600">😕 You don’t have any orders yet.</p>
    </div>
  ) : (
    orders.map(order => (
      <div
        key={order.id}
        className="border rounded-xl shadow-sm bg-white p-6 hover:shadow-md transition"
      >
        {/* Order header */}
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <div>
            <h2 className="text-lg font-semibold">Order #{order.id}</h2>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full">
            Completed
          </span>
        </div>

        {/* Order summary */}
        <p className="text-gray-700 mb-2">
          <span className="font-medium">Total:</span> ${order.total_amount}
        </p>

        {/* Items */}
        <h3 className="text-md font-medium mb-2">Items:</h3>
        <ul className="divide-y divide-gray-200">
          {order.order_items.map((item: any, idx: number) => (
            <li key={idx} className="py-2 flex justify-between">
              <span className="text-gray-700">
                {item.products.name} × {item.quantity}
              </span>
              <span className="text-gray-900 font-medium">${item.price}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={() => cancelOrder(order.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Cancel Order
          </button>
          <button
            onClick={() => router.push(`/dashboard/buyer/orders/${order.id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Details
          </button>
        </div>
      </div>
    ))
  )}
</div>

    
  )
}
