'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProductForm from '@/components/ProductForm'
import type { Product } from '@/types/product'

export default function EditProductPage() {
  const params = useParams<{ id: string }>()
  const [userId, setUserId] = useState<string | null>(null)
  const [initial, setInitial] = useState<Partial<Product> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id ?? null
      setUserId(uid)
      if (uid && params?.id) {
        const { data: prod } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', uid)
          .single()
        setInitial(prod ?? null)
      }
      setLoading(false)
    }
    init()
  }, [params?.id])

  if (loading) return <p>Loading...</p>
  if (!userId) return <p>Not authenticated.</p>
  if (!initial) return <p>Product not found.</p>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Edit Product</h2>
      <ProductForm userId={userId} initial={initial} productId={params.id} />
    </div>
  )
}
