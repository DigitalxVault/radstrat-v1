import { SettingsProfileForm } from '@/components/settings-profile-form'
import { SettingsPasswordForm } from '@/components/settings-password-form'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>
      <div className="grid gap-6 max-w-2xl">
        <SettingsProfileForm />
        <SettingsPasswordForm />
      </div>
    </div>
  )
}
