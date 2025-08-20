'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/product'
import { Edit3, Trash2, PlusCircle, ImageOff } from 'lucide-react'

export default function ProductsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = async (uid: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (!error && data) setProducts(data as Product[])
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const id = data?.user?.id ?? null
      setUserId(id)
      if (id) fetchProducts(id)
      else setLoading(false)
    }
    init()
  }, [])

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id).eq('user_id', userId!)
    if (userId) fetchProducts(userId)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Products</h2>
        <Link
          href="/dashboard/seller/products/add"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border rounded-lg p-10 text-center text-gray-500">
          No products yet. Click “Add Product” to create one.
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="bg-white border rounded-lg overflow-hidden">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-gray-100">
                  <ImageOff className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{p.name}</h4>
                  <span className="font-bold">${Number(p.price).toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between pt-3">
                  <Link
                    href={`/dashboard/seller/products/${p.id}/edit`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="inline-flex items-center gap-1 text-red-600 hover:underline"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
