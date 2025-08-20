'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function Signup() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [role, setRole] = useState('buyer')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const validatePassword = (password: string) => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  })

  const passwordRules = validatePassword(password)
  const allValid = Object.values(passwordRules).every(Boolean)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!allValid) {
      toast.error('Password does not meet the requirements.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      toast.error(signUpError.message)
      setLoading(false)
      return
    }

    const user = data.user

    if (!user) {
      toast.error('Signup failed: No user returned.')
      setLoading(false)
      return
    }

    // Insert user data manually into `profiles` table
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      email: email,
      zip_code: zipCode,
      role: role,
    })

    if (profileError) {
      toast.error('Error saving profile: ' + profileError.message)
      setLoading(false)
      return
    }

    toast.success('Signup successful! Please confirm your email.')

    // Reset form
    setFullName('')
    setEmail('')
    setPassword('')
    setZipCode('')
    setRole('buyer')

    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-200"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create Account</h2>
        <p className="text-gray-600 mb-4">Join ThriftHive today</p>

        <div className="space-y-4">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full px-4 py-4 rounded-md text-sm bg-transparent border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-4 rounded-md text-sm bg-transparent border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-4 pr-12 rounded-md text-sm border border-gray-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
              <RuleItem valid={passwordRules.length} text="8+ characters" />
              <RuleItem valid={passwordRules.uppercase} text="1 uppercase" />
              <RuleItem valid={passwordRules.number} text="1 number" />
              <RuleItem valid={passwordRules.special} text="1 special char" />
            </div>
          </div>

          <input
            type="text"
            required
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="ZIP Code"
            maxLength={10}
            className="w-full px-4 py-4 rounded-md text-sm bg-transparent border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-md hover:bg-blue-700 transition text-sm font-bold"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-2">
            By signing up, you agree to our{' '}
            <Link href="/privacy" className="underline hover:text-blue-600">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="underline hover:text-blue-600">
              Terms of Service
            </Link>
            .
          </p>

          <p className="text-sm text-center text-gray-600 mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

const RuleItem = ({ valid, text }: { valid: boolean; text: string }) => (
  <p className={`flex items-center gap-1 ${valid ? 'text-green-600' : 'text-gray-500'}`}>
    <svg
      className={`w-4 h-4 ${valid ? 'text-green-600' : 'text-gray-400'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    {text}
  </p>
)
