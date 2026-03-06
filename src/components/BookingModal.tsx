import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface BookingModalProps {
  children: React.ReactNode
}

export function BookingModal({ children }: BookingModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setOpen(false)
      toast({
        title: 'Agendamento Solicitado!',
        description: 'Nossa equipe entrará em contato em breve para confirmar seu horário.',
      })
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Agendar Consulta</DialogTitle>
          <DialogDescription>
            Preencha seus dados abaixo e escolheremos o melhor horário para você.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" placeholder="Ex: Maria Silva" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input id="phone" type="tel" placeholder="(11) 99999-9999" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data Preferencial</Label>
              <Input id="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input id="time" type="time" required />
            </div>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full duration-300" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
