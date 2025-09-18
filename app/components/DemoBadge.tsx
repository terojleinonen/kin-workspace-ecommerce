'use client'

interface DemoBadgeProps {
  variant?: 'default' | 'small' | 'large' | 'inline'
  className?: string
  showIcon?: boolean
}

export default function DemoBadge({ 
  variant = 'default', 
  className = '',
  showIcon = true 
}: DemoBadgeProps) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  
  if (!isDemoMode) {
    return null
  }

  const baseClasses = "inline-flex items-center font-bold bg-blue-600 text-white rounded-full"
  
  const variantClasses = {
    default: "px-3 py-1 text-xs",
    small: "px-2 py-0.5 text-xs",
    large: "px-4 py-2 text-sm",
    inline: "px-2 py-0.5 text-xs"
  }

  const iconClasses = {
    default: "w-3 h-3",
    small: "w-2.5 h-2.5", 
    large: "w-4 h-4",
    inline: "w-2.5 h-2.5"
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {showIcon && (
        <span className={`mr-1 ${iconClasses[variant]}`}>
          🎭
        </span>
      )}
      DEMO
    </span>
  )
}