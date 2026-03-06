import { MapPin, Phone, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-secondary" />
              Sorriso Perfeito
            </h3>
            <p className="text-primary-foreground/80 max-w-xs">
              Atendimento humanizado e tecnologia de ponta para a saúde bucal da sua família.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start space-y-4">
            <h4 className="text-lg font-semibold text-secondary">Contato</h4>
            <div className="flex flex-col space-y-2">
              <a
                href="tel:+5511999998888"
                className="flex items-center gap-2 hover:text-secondary transition-colors duration-300"
              >
                <Phone className="h-4 w-4" />
                (11) 99999-8888
              </a>
              <div className="flex items-center gap-2 text-primary-foreground/90">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Rua da Alegria, 123 - Centro</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start space-y-4">
            <h4 className="text-lg font-semibold text-secondary">Horário de Funcionamento</h4>
            <div className="text-primary-foreground/90 space-y-1">
              <p>Segunda a Sexta: 08h às 18h</p>
              <p>Sábado: 08h às 12h</p>
              <p>Domingo: Fechado</p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col items-center justify-center space-y-2 text-sm text-primary-foreground/60">
          <p>
            © {new Date().getFullYear()} Clínica Sorriso Perfeito. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
