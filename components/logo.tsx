import Image from 'next/image'

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 200, className = '' }: LogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src="/logo.svg"
        alt="Roon Wrapped Logo"
        width={size}
        height={size}
        priority
        className="drop-shadow-2xl"
      />
    </div>
  )
}

export function LogoWithText({ size = 150, className = '' }: LogoProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <Logo size={size} />
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
        Roon Wrapped
      </h1>
    </div>
  )
}