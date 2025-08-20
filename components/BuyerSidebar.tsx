'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShoppingBag, ShoppingCart, ListOrdered, LogOut } from 'lucide-react'

const nav = [
  { href: '/dashboard/buyer/products', label: 'Products', Icon: ShoppingBag },
  { href: '/dashboard/buyer/cart', label: 'My Cart', Icon: ShoppingCart },
  { href: '/dashboard/buyer/orders', label: 'Orders', Icon: ListOrdered }
]

export default function BuyerSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('auth/login')
  }

  return (
    <aside className="h-screen sticky top-0 w-72 bg-white border-r flex flex-col">
      <div className="p-6 border-b flex items-center gap-2">
        <ShoppingBag className="h-6 w-6" />
        <Link href="/dashboard/buyer" className="text-xl font-semibold hover:underline">
          Buyer Panel
        </Link>
      </div>

      <nav className="p-4 space-y-1 flex-1">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
                ${active ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
