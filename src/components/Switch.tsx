import React from 'react'
import { motion } from 'framer-motion'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  const toggleSwitch = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const bgColor = checked
    ? 'bg-blue-500 dark:bg-blue-600'
    : 'bg-gray-300 dark:bg-gray-600'

  return (
    <div
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ease-in-out duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${bgColor} ${className}`}
      onClick={toggleSwitch}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleSwitch()
          e.preventDefault()
        }
      }}
    >
      <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      <motion.span
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0"
        initial={false}
        animate={{
          x: checked ? '100%' : '2px',
          translateX: checked ? '-100%' : '0%',
          translateY: '2px'
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  )
}
