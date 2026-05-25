import React from 'react'
import { Colors } from '../constants/theme'

interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'outline' | 'ghost'
  loading?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}

export function Button({
  label,
  onClick,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const isDisabled = disabled || loading

  const base: React.CSSProperties = {
    height: 52,
    borderRadius: 12,
    paddingLeft: 24,
    paddingRight: 24,
    fontWeight: 600,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    border: 'none',
    fontFamily: 'inherit',
  }

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      ...base,
      backgroundColor: Colors.primary,
      color: Colors.white,
    },
    outline: {
      ...base,
      backgroundColor: 'transparent',
      border: `1.5px solid ${Colors.primary}`,
      color: Colors.primary,
    },
    ghost: {
      ...base,
      backgroundColor: 'transparent',
      color: Colors.textSecondary,
    },
  }

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={styles[variant]}
      className={className}
    >
      {loading ? (
        <span
          style={{
            display: 'inline-block',
            width: 20,
            height: 20,
            border: `2px solid ${variant === 'primary' ? Colors.white : Colors.primary}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      ) : (
        label
      )}
    </button>
  )
}
