import { BookingModal } from '@/components/BookingModal'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/FadeIn'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-gradient-to-br from-secondary/20 via-white to-white">
      {/* Decorative background blur circles */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" />
      <div
        className="absolute top-40 right-10 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float"
        style={{ animationDelay: '2s' }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <FadeIn delay={100}>
            <span className="inline-block py-1 px-3 rounded-full bg-secondary/30 text-primary text-sm font-semibold tracking-wide mb-4">
              Referência em Odontologia
            </span>
          </FadeIn>

          <FadeIn delay={200}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance">
              Transforme seu{' '}
              <span className="text-primary relative whitespace-nowrap">
                sorriso
                <svg
                  className="absolute w-full h-3 -bottom-1 left-0 text-secondary"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
              </span>{' '}
              com a Sorriso Perfeito
            </h1>
          </FadeIn>

          <FadeIn delay={400}>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Atendimento humanizado e tecnologia de ponta para a saúde bucal da sua família.
            </p>
          </FadeIn>

          <FadeIn delay={600} className="pt-4">
            <BookingModal>
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-elevation hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                Agendar Consulta
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </BookingModal>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
