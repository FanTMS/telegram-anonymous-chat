import React, { ReactNode, useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'

interface ParallaxEffectProps {
  children: ReactNode
  className?: string
  strength?: number
  inverted?: boolean
}

export const ParallaxEffect: React.FC<ParallaxEffectProps> = ({
  children,
  className = '',
  strength = 20,
  inverted = false
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  // Initialize with center position
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    // Set initial values
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      })
    }

    // Touch move handler
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        setMousePosition({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  // Calculate the relative position (-0.5 to 0.5)
  const relativeX = mousePosition.x / windowSize.width - 0.5
  const relativeY = mousePosition.y / windowSize.height - 0.5

  // Motion value transformation
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Set motion values based on mouse position
  useEffect(() => {
    const invertFactor = inverted ? -1 : 1
    x.set(relativeX * strength * invertFactor)
    y.set(relativeY * strength * invertFactor)
  }, [relativeX, relativeY, strength, inverted, x, y])

  // Spring effect for smooth motion
  const springX = useSpring(x, { stiffness: 50, damping: 20 })
  const springY = useSpring(y, { stiffness: 50, damping: 20 })

  return (
    <motion.div
      className={className}
      style={{
        x: springX,
        y: springY
      }}
    >
      {children}
    </motion.div>
  )
}

export const ParallaxCard: React.FC<{
  children: ReactNode
  className?: string
  depth?: number
}> = ({
  children,
  className = '',
  depth = 1
}) => {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [scale, setScale] = useState(1)

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = event.clientX
    const mouseY = event.clientY

    // Calculate rotation based on mouse position relative to card center
    const rotateYValue = ((mouseX - centerX) / (rect.width / 2)) * 5 * depth
    const rotateXValue = ((centerY - mouseY) / (rect.height / 2)) * 5 * depth

    setRotateX(rotateXValue)
    setRotateY(rotateYValue)
    setScale(1.02)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setScale(1)
  }

  return (
    <motion.div
      className={`transition-transform ${className}`}
      style={{
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.02 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
        scale
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
    >
      {children}
    </motion.div>
  )
}
