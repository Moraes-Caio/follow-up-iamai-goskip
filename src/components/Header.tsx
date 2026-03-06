import { useState, useEffect } from 'react'
import { Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookingModal } from './BookingModal'
import { cn } from '@/lib/utils'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4',
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent',
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors duration-300">
              <Smile className="h-6 w-6" strokeWidth={2} />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Sorriso <span className="text-primary">Perfeito</span>
            </span>
          </div>

          <nav className="flex items-center">
            <BookingModal>
              <Button
                className={cn(
                  'hidden sm:flex transition-all duration-300 hover:scale-105 shadow-sm',
                  isScrolled ? 'bg-primary' : 'bg-primary/90 hover:bg-primary',
                )}
              >
                Agendar Consulta
              </Button>
            </BookingModal>

            {/* Mobile icon button */}
            <BookingModal>
              <Button size="sm" className="sm:hidden transition-all duration-300">
                Agendar
              </Button>
            </BookingModal>
          </nav>
        </div>
      </div>
    </header>
  )
}
