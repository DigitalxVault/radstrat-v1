'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/providers/auth-provider'
import { useUpdateProfile } from '@/hooks/use-profile'

export function SettingsProfileForm() {
  const { user, refetchUser } = useAuth()
  const updateProfile = useUpdateProfile()
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')

  // Sync state when user data loads asynchronously
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
    }
  }, [user])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required')
      return
    }
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }
    updateProfile.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully')
          refetchUser()
        },
        onError: (error) => {
          if ('status' in error && (error as { status: number }).status === 409) {
            toast.error('Email is already in use')
          } else {
            toast.error('Failed to update profile')
          }
        },
      },
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="size-5" />
          Profile
        </CardTitle>
        <CardDescription>Update your name and email</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
            />
          </div>
          <Button
            type="submit"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
