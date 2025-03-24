import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button, ButtonProps } from './Button'

interface AnimatedButtonProps extends ButtonProps {
  animation?: 'scale' | 'pulse' | 'bounce' | 'none'
  children: ReactNode
}

const animations = {
  scale: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  },
  pulse: {
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.97 },
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10
    }
  },
  bounce: {
    whileHover: { y: -3 },
    whileTap: { y: 1 },
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 15
    }
  },
  none: {}
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  animation = 'scale',
  onClick,
  className = '',
  isLoading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = false,
  ...props
}) => {
  const animationProps = animations[animation] || animations.none

  return (
    <motion.div
      {...animationProps}
      style={{ width: fullWidth ? '100%' : 'auto', display: 'inline-block' }}
    >
      <Button
        onClick={onClick}
        className={className}
        isLoading={isLoading}
        disabled={disabled}
        variant={variant}
        fullWidth={fullWidth}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
}
