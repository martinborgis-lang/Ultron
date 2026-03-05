'use client'

import React from 'react'
import Link from 'next/link'

interface CtaButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export const CtaButton: React.FC<CtaButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  href,
  onClick,
  className = '',
  icon,
  disabled = false,
  type = 'button'
}) => {
  // Classes de base communes
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed'

  // Classes de taille
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3'
  }

  // Classes de variant
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500
      text-white rounded-full
      hover:scale-105 hover:brightness-110
      hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]
      active:scale-95
      border border-transparent
    `,
    secondary: `
      bg-slate-900/80 backdrop-blur-sm
      border border-blue-400/40 text-white rounded-full
      hover:bg-white/10 hover:border-blue-400/80
      active:scale-95
    `,
    ghost: `
      bg-transparent text-slate-300 rounded-md
      hover:text-blue-400 hover:underline hover:underline-offset-4
      active:text-blue-300
    `
  }

  // Construction des classes finales
  const classes = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  // Contenu avec icône optionnelle
  const content = (
    <>
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </>
  )

  // Si href est fourni, utiliser Link
  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        onClick={disabled ? undefined : onClick}
      >
        {content}
      </Link>
    )
  }

  // Sinon, utiliser button
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  )
}

export default CtaButton