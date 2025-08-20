'use client'

import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, List, PlusCircle } from 'lucide-react'

export default function SellerPanelPage() {
  return (
    <div className="min-h-screen flex bg-gray-500">
      {/* Sidebar */}
      

      {/* Main content */}
      <main className="flex-1 p-8">
        <h2 className="text-3xl font-semibold mb-6">Welcome to buyer  Dashboard</h2>
        <p className="text-gray-600">
          Use the menu on the left to manage your products, view sales data, and update your store settings.
        </p>
      </main>
    </div>
  )
}
