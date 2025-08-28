'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function CheckoutSuccessPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const session_id = params.get('session_id')
    if (!session_id) {
      setStatus('error')
      return
    }

    const go = async () => {
      try {
        setStatus('processing')

        // 1️⃣ Call checkout/success → order create
        const res = await fetch('/api/checkout/success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id }),
        })

        if (!res.ok) {
          setStatus('error')
          return
        }

        const data = await res.json()
        setOrderId(data.order_id || null)

        // 2️⃣ Call send-email → confirmation email
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data.order_id, user_id: data.user_id }),
        })

        setStatus('done')
      } catch (err) {
        console.error(err)
        setStatus('error')
      }
    }

    go()
  }, [params])

  return (
    <div className="max-w-lg mx-auto mt-16 p-8 border rounded-2xl bg-white shadow-lg space-y-6 text-center">
      {status === 'processing' && (
        <div className="space-y-3">
          <div className="animate-spin mx-auto w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">Finalizing your order…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-red-600">loading</h1>
          <button
            onClick={() => router.push('/dashboard/buyer/cart')}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow"
          >
            Back to Cart
          </button>
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-6">
          {/* ✅ Success Icon */}
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <svg
                className="w-14 h-14 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* 🎉 Heading */}
          <h1 className="text-3xl font-bold text-gray-800">Payment Successful 🎉</h1>

          {/* 📦 Order ID */}
          {orderId && (
            <p className="text-gray-600">
              Your order ID:{" "}
              <span className="font-mono font-semibold text-gray-900">{orderId}</span>
            </p>
          )}

          {/* 📧 Confirmation message */}
          <p className="text-gray-500">We’ve sent a confirmation email with your order details.</p>

          {/* 🔘 Action buttons */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => router.push('/dashboard/buyer/orders')}
              className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow"
            >
              View My Orders
            </button>
            <button
              onClick={() => router.push('/dashboard/buyer/products')}
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl border rounded-xl"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <p className="text-gray-500 animate-pulse">Preparing your order…</p>
      )}
    </div>
  )
}
