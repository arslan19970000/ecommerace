'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/navigation'
import type { Product } from '@/types/product'
import { Loader2 } from 'lucide-react'

type Props = {
  userId: string
  initial?: Partial<Product>
  productId?: string
}

export default function ProductForm({ userId, initial, productId }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(
    initial?.price != null ? String(initial.price) : ''
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initial?.name) setName(initial.name)
    if (initial?.description) setDescription(initial.description ?? '')
    if (initial?.price != null) setPrice(String(initial.price))
  }, [initial])

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return initial?.image_url ?? null
    const ext = imageFile.name.split('.').pop() || 'jpg'
    const fileName = `${userId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile, { upsert: false })
    if (error) {
      setError('Image upload failed.')
      return null
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Required validation
    if (!name.trim()) {
      setError('Product name is required.')
      return
    }
    if (!price || Number(price) <= 0) {
      setError('Price must be greater than 0.')
      return
    }
    if (!productId && !imageFile) {
      // Only required if creating new product
      setError('Product image is required.')
      return
    }

    setLoading(true)
    setError(null)

    const image_url = await uploadImage()
    if (image_url === null && imageFile) {
      setLoading(false)
      return
    }

    if (productId) {
      // Update existing product
      const { error } = await supabase
        .from('products')
        .update({
          name,
          description,
          price: Number(price),
          image_url
        })
        .eq('id', productId)
        .eq('user_id', userId)
      if (error) setError(error.message)
      else router.push('/dashboard/seller/products')
    } else {
      // Create new product
      const { error } = await supabase.from('products').insert([
        {
          id: uuidv4(),
          user_id: userId,
          name,
          description,
          price: Number(price),
          image_url
        }
      ])
      if (error) setError(error.message)
      else router.push('/dashboard/seller/products')
    }

    setLoading(false)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 bg-white p-6 rounded-lg border"
    >
      <div className="grid gap-3">
        <input
          type="text"
          placeholder="Product Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
          required
        />
        <textarea
          placeholder="Description"
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
        />
        <input
          type="number"
          placeholder="Price *"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
          step="0.01"
          min="0"
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="w-full"
          // only required for new product
          required={!productId}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {productId ? 'Update Product' : 'Add Product'}
      </button>
    </form>
  )
}
