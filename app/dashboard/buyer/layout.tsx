'use client'
import RoleProtected from '@/components/RoleProtected'
import BuyerSidebar from '@/components/BuyerSidebar'

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProtected allowedRole="buyer">
      <div className="flex">
        <BuyerSidebar />
        <main className="flex-1 p-6 bg-gray-50 min-h-screen">
          {children}
        </main>
      </div>
    </RoleProtected>
  )
}
