import { Star } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FadeIn } from '@/components/FadeIn'

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'Paciente há 2 anos',
    content:
      'Excelente atendimento! Minha família toda se trata na Sorriso Perfeito. Recomendo de olhos fechados. O ambiente é super acolhedor e os dentistas são muito atenciosos.',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1',
    initials: 'MS',
    delay: 100,
  },
  {
    name: 'João Pedro',
    role: 'Tratamento Ortodôntico',
    content:
      'Profissionais muito capacitados e ambiente acolhedor. Meu tratamento ortodôntico foi um sucesso e terminou antes do previsto. Estou muito feliz com meu novo sorriso!',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2',
    initials: 'JP',
    delay: 200,
  },
]

export function Testimonials() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que dizem nossos pacientes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A satisfação de quem confia em nosso trabalho é a nossa maior recompensa.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <FadeIn key={index} delay={testimonial.delay}>
              <Card className="h-full border-none shadow-subtle hover:shadow-md transition-shadow duration-300 bg-white">
                <CardContent className="pt-8">
                  <div className="flex gap-1 mb-6 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-lg text-foreground/80 italic leading-relaxed mb-6">
                    "{testimonial.content}"
                  </p>
                </CardContent>
                <CardFooter className="pb-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
