'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProductForm from '@/components/ProductForm'

export default function AddProductPage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  if (!userId) return <p>Loading...</p>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Add Product</h2>
      <ProductForm userId={userId} />
    </div>
  )
}
