export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/background.png')",
          filter: 'blur(14px)',
        }}
      />
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-white/20" />
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  )
}
