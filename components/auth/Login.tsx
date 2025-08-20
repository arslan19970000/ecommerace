'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    // ✅ Get user ID from auth
    const userId = loginData.user?.id

    // ✅ Fetch user profile to get role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      setError('Failed to fetch user role')
      setLoading(false)
      return
    }

    setSuccess('Login successful!')
    setEmail('')
    setPassword('')

    // ✅ Redirect based on role
    if (profile.role === 'seller') {
      router.push('/dashboard/seller')
    } else {
      router.push('/dashboard/buyer')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-200"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Log In</h2>
        <p className="text-gray-600 mb-2">Continue to ThriftHive</p>

        <div className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-4 border rounded-md text-sm bg-transparent focus:outline-none focus:ring-2"
          />

          <div>
            <p className="text-sm text-right text-gray-500 mt-4">
              <Link href="/password">Forgot password?</Link>
            </p>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-4 border rounded-md text-sm focus:outline-none focus:ring-2"
            />
          </div>

          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
          {success && <p className="text-green-600 text-sm font-medium">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-md hover:bg-blue-700 transition text-sm font-semibold"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <p className="text-sm text-center text-gray-600 mt-4">
            New to ThriftHive?{' '}
            <Link href="/auth/signUp" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>

          <hr className="border-t-2 border-b-rose-200 border-red-400 my-4" />

          <p className="text-gray-500 text-center mt-2 text-sm">
            By proceeding, you agree to our{' '}
            <Link href="/privacy" className="underline hover:text-blue-600">Privacy Policy</Link>{' '}
            and{' '}
            <Link href="/terms" className="underline hover:text-blue-600">Terms of Service</Link>.
          </p>
        </div>
      </form>
    </div>
  )
}
