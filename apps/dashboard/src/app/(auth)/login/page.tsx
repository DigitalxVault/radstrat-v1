import Image from 'next/image'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/images/RADStrat_logo_v1.png"
          alt="RADSTRAT"
          width={140}
          height={140}
          priority
        />
        <p className="text-sm tracking-widest text-gray-700/80 uppercase">
          Speak With Precision. Move With Confidence.
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
