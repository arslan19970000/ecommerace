'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface RoleProtectedProps {
  children: React.ReactNode
  allowedRole: 'buyer' | 'seller' | 'admin'
  redirectPath?: string
  fallbackComponent?: React.ReactNode
}

export default function RoleProtected({ 
  children, 
  allowedRole, 
  redirectPath,
  fallbackComponent
}: RoleProtectedProps) {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkRole = async () => {
      try {
        setError(null)
        
        // 1. Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError.message)
          toast.error('Authentication error. Please log in again.')
          router.replace('/auth/login')
          return
        }

        const user = session?.user
        if (!user) {
          router.replace('/auth/login')
          return
        }

        // 2. Fetch user profile with role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError.message)
          
          if (profileError.code === 'PGRST116') {
            // Profile doesn't exist - this shouldn't happen with your signup flow
            setError('Profile not found. Please contact support.')
            toast.error('Profile not found. Please contact support.')
          } else {
            setError('Failed to load user profile.')
            toast.error('Failed to load profile. Please try again.')
          }
          return
        }

        if (!profile) {
          setError('No profile data found.')
          router.replace('/auth/login')
          return
        }

        const currentUserRole = profile.role
        setUserRole(currentUserRole)

        console.log('User role:', currentUserRole, 'Required role:', allowedRole)

        // 3. Check if user has the required role
        if (currentUserRole === allowedRole) {
          setAllowed(true)
        } else {
          console.warn(`Access denied. User role: ${currentUserRole}, Required: ${allowedRole}`)
          
          // Redirect based on user's actual role if no custom redirect path
          if (!redirectPath) {
            switch (currentUserRole) {
              case 'buyer':
                router.replace('buyer/')
                break
              case 'seller':
                router.replace('dashboard/seller/')
                break
              case 'admin':
                router.replace('dashboard/admin/')
                break
              default:
                router.replace('/auth/login')
            }
          } else {
            router.replace(redirectPath)
          }
          
          toast.error(`Access denied. This page is for ${allowedRole}s only.`)
        }
        
      } catch (err) {
        console.error('Unexpected error in RoleProtected:', err)
        setError('An unexpected error occurred.')
        toast.error('Something went wrong. Please try again.')
        router.replace('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkRole()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.replace('/auth/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [allowedRole, router, redirectPath])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-200 max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Error</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={() => router.replace('/auth/login')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Access denied state (when user has wrong role)
  if (!allowed && userRole) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-200 max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-4">
            This page is only accessible to <span className="font-semibold">{allowedRole}s</span>.
            <br />
            Your account type: <span className="font-semibold">{userRole}</span>
          </p>
          <button 
            onClick={() => {
              switch (userRole) {
                case 'buyer':
                  router.replace('/dashboard/buyer')
                  break
                case 'seller':
                  router.replace('dashboard/seller/')
                  break
                case 'admin':
                  router.replace('dashboard/admin/')
                  break
                default:
                  router.replace('/auth/login')
              }
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Go to Your Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Render children if user has correct role
  return allowed ? <>{children}</> : null
}