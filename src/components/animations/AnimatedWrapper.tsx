import React, { ReactNode } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'

interface AnimatedWrapperProps {
  children: ReactNode
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'bounce'
  duration?: number
  delay?: number
  className?: string
  onClick?: () => void
}

const animations: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  slideUp: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  },
  slideDown: {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  },
  slideLeft: {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  },
  slideRight: {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  },
  scale: {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  },
  bounce: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 10
      }
    }
  }
}

export const AnimatedWrapper: React.FC<AnimatedWrapperProps> = ({
  children,
  animation = 'fadeIn',
  duration = 0.5,
  delay = 0,
  className = '',
  onClick
}) => {
  const selectedAnimation = animations[animation]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={selectedAnimation}
      transition={{ duration, delay }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

export const AnimatedList: React.FC<{
  children: ReactNode[]
  staggerDelay?: number
  animation?: keyof typeof animations
  className?: string
}> = ({
  children,
  staggerDelay = 0.1,
  animation = 'slideUp',
  className = ''
}) => {
  return (
    <div className={className}>
      <AnimatePresence>
        {React.Children.map(children, (child, i) => (
          <motion.div
            key={i}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={animations[animation]}
            transition={{ duration: 0.3, delay: i * staggerDelay }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export const AnimatedPage: React.FC<{
  children: ReactNode
  animation?: keyof typeof animations
  className?: string
}> = ({
  children,
  animation = 'fadeIn',
  className = ''
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={animations[animation]}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const AnimatedButton: React.FC<{
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}> = ({
  children,
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  )
}

export const AnimatedCard: React.FC<{
  children: ReactNode
  className?: string
  onClick?: () => void
}> = ({
  children,
  className = '',
  onClick
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

export const AnimateOnScroll: React.FC<{
  children: ReactNode
  animation?: keyof typeof animations
  className?: string
}> = ({
  children,
  animation = 'fadeIn',
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={animations[animation]}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}
