'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart3, DollarSign, AlertTriangle } from 'lucide-react'

export default function OverviewPage() {
  const [count, setCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [totalSales, setTotalSales] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const id = data?.user?.id ?? null

      if (id) {
        // ✅ Total products count
        const { count: totalCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id)
        setCount(totalCount ?? 0)

        // ✅ Low stock count (quantity < 5)
        const { count: lowStock } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id)
          .lt('quantity', 5)
        setLowStockCount(lowStock ?? 0)

        // ✅ Total sales (via RPC)
        const { data: salesData, error } = await supabase.rpc('get_total_sales', {
          seller_id: id
        })
        if (!error && salesData !== null) {
          setTotalSales(Number(salesData))
        }
      }
    }
    init()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ✅ Total Products */}
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-3xl font-bold mt-2">{count}</p>
        </div>

        {/* ✅ Low Stock */}
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-yellow-500" /> Low Stock
          </p>
          <p className="text-3xl font-bold mt-2">{lowStockCount}</p>
        </div>

        {/* ✅ Total Sales */}
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-green-500" /> Total Sales
          </p>
          <p className="text-3xl font-bold mt-2">${totalSales}</p>
        </div>
      </div>
    </div>
  )
}
