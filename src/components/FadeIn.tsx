import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function FadeIn({ children, className, delay = 0, direction = 'up' }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const getDirectionClasses = () => {
    switch (direction) {
      case 'up':
        return 'translate-y-8'
      case 'down':
        return '-translate-y-8'
      case 'left':
        return 'translate-x-8'
      case 'right':
        return '-translate-x-8'
      case 'none':
        return ''
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out opacity-0',
        getDirectionClasses(),
        isVisible && 'opacity-100 translate-y-0 translate-x-0',
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
