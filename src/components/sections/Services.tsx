import { Smile, Sparkles, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/FadeIn'

const services = [
  {
    title: 'Limpeza',
    description:
      'Remoção de placa e tártaro para gengivas saudáveis e dentes brilhantes. Prevenção é o melhor cuidado.',
    icon: Smile,
    delay: 100,
  },
  {
    title: 'Clareamento',
    description:
      'Sorriso mais branco e iluminado com técnicas seguras e eficientes. Recupere sua autoestima e brilho.',
    icon: Sparkles,
    delay: 200,
  },
  {
    title: 'Ortodontia',
    description:
      'Alinhamento perfeito com aparelhos modernos e discretos. Um sorriso bonito e muito mais funcional.',
    icon: Activity,
    delay: 300,
  },
]

export function Services() {
  return (
    <section className="py-24 bg-white" id="servicos">
      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nossos Tratamentos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Oferecemos uma gama completa de serviços odontológicos para garantir que você tenha
            sempre o melhor motivo para sorrir.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <FadeIn key={index} delay={service.delay}>
              <Card className="group h-full border-border/50 hover:border-secondary/50 shadow-sm hover:shadow-elevation transition-all duration-300 hover:-translate-y-2 bg-gradient-to-b from-white to-secondary/5">
                <CardHeader>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-300">
                    <service.icon
                      className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-300"
                      strokeWidth={1.5}
                    />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
