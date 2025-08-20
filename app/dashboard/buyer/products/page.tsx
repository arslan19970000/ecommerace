'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function BuyerProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: user } = await supabase.auth.getUser()
      setUserId(user.user?.id ?? null)

      const { data: productsData } = await supabase
        .from('products')
        .select('*') // ensure image_url is included
        .order('created_at', { ascending: false })

      setProducts(productsData || [])
      setLoading(false)
    }

    fetchProducts()
  }, [])

  const addToCart = async (productId: string) => {
    if (!userId) {
      alert('Please login to add to cart')
      return
    }

    // Check if already in cart
    const { data: existing } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    if (existing) {
      await supabase
        .from('carts')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id)
      alert('Quantity updated in cart')
    } else {
      await supabase.from('carts').insert({
        user_id: userId,
        product_id: productId,
        quantity: 1
      })
      alert('Added to cart')
    }
  }

  if (loading) return <p>Loading products...</p>

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="border p-4 rounded bg-white shadow-sm">
            {/* Product Image */}
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-48 object-cover rounded mb-3"
              />
            )}

            <h2 className="font-semibold">{product.name}</h2>
            <p className="text-gray-600">${product.price}</p>
            <p className="text-sm text-gray-500">Stock: {product.stock}</p>
            
            <button
              onClick={() => addToCart(product.id)}
              className="mt-3 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
