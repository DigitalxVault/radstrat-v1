'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please enter your email and password')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Invalid credentials')
        return
      }

      if (data.mustChangePassword) {
        toast.info('Please change your temporary password')
        // TODO: redirect to change-password page
      }

      toast.success(`Welcome, ${data.user.firstName}`)
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full rounded-2xl border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-5 text-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Admin Sign In
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-gray-700">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@radstrat.mil"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isLoading}
            className="border-white/50 bg-white/40 text-gray-800 placeholder:text-gray-400 focus-visible:ring-[#586888]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-gray-700">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isLoading}
            className="border-white/50 bg-white/40 text-gray-800 placeholder:text-gray-400 focus-visible:ring-[#586888]"
          />
        </div>
        <Button
          type="submit"
          className="mt-2 w-full bg-[#586888] text-white hover:bg-[#485868]"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  )
}
