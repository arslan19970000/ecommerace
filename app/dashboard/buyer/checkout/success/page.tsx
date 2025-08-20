// app/checkout/success/page.tsx
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
      setStatus('processing')
      const res = await fetch('/api/checkout/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      const data = await res.json()
      setOrderId(data.order_id || null)
      setStatus('done')
    }
    go()
  }, [params])

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg bg-white space-y-3">
      {status === 'processing' && <p>Finalizing your order…</p>}
      {status === 'error' && (
        <>
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <button onClick={() => router.push('dashboard/buyer/cart')} className="px-3 py-2 bg-blue-600 text-white rounded">
            Back to Cart
          </button>
        </>
      )}
      {status === 'done' && (
        <>
          <h1 className="text-2xl font-semibold">Payment successful 🎉</h1>
          {orderId && <p>Your order ID: <span className="font-mono">{orderId}</span></p>}
          <div className="flex gap-3 mt-3">
            <button onClick={() => router.push('/dashboard/buyer/orders')} className="px-3 py-2 bg-green-600 text-white rounded">
              View My Orders
            </button>
            <button onClick={() => router.push('/dashboard/buyer/products')} className="px-3 py-2 border rounded">
              Continue Shopping
            </button>
          </div>
        </>
      )}
      {status === 'idle' && <p>Preparing your order…</p>}
    </div>
  )
}
