import { useState, useRef } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { toast } from '@/hooks/use-toast';
import { relationLabels, genderLabels, type RelationType, type Gender } from '@/types';
import { format, subYears } from 'date-fns';

interface CreatePatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientCreated?: (patientId: string) => void;
}

export function CreatePatientDialog({ open, onOpenChange, onPatientCreated }: CreatePatientDialogProps) {
  const { patients, addPatient, isAdding } = usePatients();
  const [isDuplicateNameDialogOpen, setIsDuplicateNameDialogOpen] = useState(false);

  const today = new Date();
  const maxBirthDate = new Date(today);
  maxBirthDate.setDate(maxBirthDate.getDate() - 1);
  const minBirthDate = subYears(today, 100);

  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: undefined as Date | undefined,
    phone: '',
    gender: '' as Gender | '',
    hasResponsible: false,
    responsibleName: '',
    responsibleRelation: '' as RelationType | '',
    responsiblePhone: '',
    responsibleGender: '' as Gender | '',
    responsibleBirthDate: undefined as Date | undefined,
  });

  const phoneRef = useRef<HTMLInputElement>(null);
  const responsiblePhoneRef = useRef<HTMLInputElement>(null);

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const formatPhoneFromDigits = (digits: string): string => {
    let formatted = '';
    if (digits.length > 0) formatted = '(' + digits.slice(0, 2);
    if (digits.length >= 2) formatted += ') ';
    if (digits.length > 2) formatted += digits.slice(2, 7);
    if (digits.length > 7) formatted += '-' + digits.slice(7);
    return formatted;
  };

  const handlePhoneChange = (value: string, field: 'phone' | 'responsiblePhone', inputRef: React.RefObject<HTMLInputElement>) => {
    const newDigits = value.replace(/\D/g, '').slice(0, 11);
    const formatted = formatPhoneFromDigits(newDigits);
    setFormData((prev) => ({ ...prev, [field]: formatted }));

    requestAnimationFrame(() => {
      if (inputRef.current) {
        const digitCount = newDigits.length;
        let cursorPos = formatted.length;
        if (digitCount <= 2) cursorPos = digitCount + 1;
        else if (digitCount <= 7) cursorPos = digitCount + 3;
        else cursorPos = digitCount + 4;
        inputRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    });
  };

  const resetForm = () => {
    setFormData({
      fullName: '', birthDate: undefined, phone: '', gender: '',
      hasResponsible: false, responsibleName: '', responsibleRelation: '',
      responsiblePhone: '', responsibleGender: '', responsibleBirthDate: undefined,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const checkDuplicatePhone = () => {
    const phone = (formData.hasResponsible ? formData.responsiblePhone : formData.phone).replace(/\D/g, '');
    if (!phone) return null;
    return patients.find((p) => {
      const pPhone = p.phone.replace(/\D/g, '');
      const pResponsiblePhone = p.responsible_phone?.replace(/\D/g, '') || '';
      return pPhone === phone || pResponsiblePhone === phone;
    }) || null;
  };

  const checkDuplicateName = () => {
    return patients.find((p) => normalize(p.full_name) === normalize(formData.fullName)) || null;
  };

  const handleSubmit = (skipNameCheck = false) => {
    const missingBase = !formData.fullName || !formData.birthDate || !formData.gender;
    const missingPhone = formData.hasResponsible ? !formData.responsiblePhone : !formData.phone;
    const missingResponsible = formData.hasResponsible && (!formData.responsibleName || !formData.responsiblePhone || !formData.responsibleGender || !formData.responsibleBirthDate || !formData.responsibleRelation);

    if (missingBase || missingPhone || missingResponsible) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    const duplicatePhone = checkDuplicatePhone();
    if (duplicatePhone) {
      toast({ title: 'Telefone já cadastrado', description: `O número informado já pertence ao paciente "${duplicatePhone.full_name}".`, variant: 'destructive' });
      return;
    }

    if (!skipNameCheck) {
      const duplicateName = checkDuplicateName();
      if (duplicateName) {
        setIsDuplicateNameDialogOpen(true);
        return;
      }
    }

    savePatient();
  };

  const savePatient = async () => {
    const patientData = {
      full_name: formData.fullName,
      birth_date: format(formData.birthDate!, 'yyyy-MM-dd'),
      phone: formData.hasResponsible ? formData.responsiblePhone : formData.phone,
      gender: (formData.gender as Gender) || null,
      has_responsible: formData.hasResponsible,
      responsible_name: formData.hasResponsible ? formData.responsibleName : null,
      responsible_relation: formData.hasResponsible ? (formData.responsibleRelation as RelationType) : null,
      responsible_phone: formData.hasResponsible ? formData.responsiblePhone : null,
      responsible_gender: formData.hasResponsible ? (formData.responsibleGender as Gender) : null,
      responsible_birth_date: formData.hasResponsible && formData.responsibleBirthDate ? format(formData.responsibleBirthDate, 'yyyy-MM-dd') : null,
    };

    try {
      const newId = await addPatient(patientData);
      toast({ title: 'Sucesso', description: 'Paciente cadastrado com sucesso!' });
      resetForm();
      onOpenChange(false);
      onPatientCreated?.(newId);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao salvar paciente.', variant: 'destructive' });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto top-[2rem] translate-y-0">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
            <DialogDescription>Preencha os dados do novo paciente</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpd-fullName">Nome Completo *</Label>
              <Input id="cpd-fullName" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Ex: Maria Silva Santos" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Nascimento *</Label>
                <ProfessionalDatePicker value={formData.birthDate} onChange={(date) => setFormData({ ...formData, birthDate: date })} placeholder="Selecione" minDate={minBirthDate} maxDate={maxBirthDate} yearRange={{ from: today.getFullYear() - 100, to: today.getFullYear() }} />
              </div>
              <div className="space-y-2">
                <Label>Gênero *</Label>
                <Select
                  value={formData.gender === 'male' || formData.gender === 'female' || formData.gender === 'other' ? formData.gender : formData.gender ? 'other' : ''}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{Object.entries(genderLabels).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
                </Select>
                {formData.gender === 'other' && (
                  <Input placeholder="Informe o gênero" value="" onChange={(e) => setFormData({ ...formData, gender: e.target.value || 'other' })} className="mt-1" />
                )}
                {formData.gender && formData.gender !== 'male' && formData.gender !== 'female' && formData.gender !== 'other' && (
                  <Input value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value || 'other' })} className="mt-1" />
                )}
              </div>
            </div>

            {!formData.hasResponsible && (
              <div className="space-y-2">
                <Label htmlFor="cpd-phone">Telefone *</Label>
                <Input id="cpd-phone" ref={phoneRef} value={formData.phone} onChange={(e) => handlePhoneChange(e.target.value, 'phone', phoneRef)} placeholder="(11) 99999-9999" />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="cpd-hasResponsible" className="font-medium">Este paciente tem um responsável?</Label>
                <p className="text-sm text-muted-foreground">Ative se o paciente for menor ou dependente</p>
              </div>
              <Switch id="cpd-hasResponsible" checked={formData.hasResponsible} onCheckedChange={(checked) => setFormData({ ...formData, hasResponsible: checked })} />
            </div>

            {formData.hasResponsible && (
              <div className="space-y-4 rounded-lg border border-border p-4 animate-fade-in">
                <h4 className="font-medium text-foreground">Dados do Responsável</h4>
                <div className="space-y-2">
                  <Label htmlFor="cpd-responsibleName">Nome do Responsável *</Label>
                  <Input id="cpd-responsibleName" value={formData.responsibleName} onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })} placeholder="Ex: Ana Carolina Santos" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Relação *</Label>
                    <Select value={formData.responsibleRelation} onValueChange={(value) => setFormData({ ...formData, responsibleRelation: value as RelationType })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{Object.entries(relationLabels).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpd-responsiblePhone">Telefone *</Label>
                    <Input id="cpd-responsiblePhone" ref={responsiblePhoneRef} value={formData.responsiblePhone} onChange={(e) => handlePhoneChange(e.target.value, 'responsiblePhone', responsiblePhoneRef)} placeholder="(11) 99999-9999" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gênero *</Label>
                    <Select
                      value={formData.responsibleGender === 'male' || formData.responsibleGender === 'female' || formData.responsibleGender === 'other' ? formData.responsibleGender : formData.responsibleGender ? 'other' : ''}
                      onValueChange={(value) => setFormData({ ...formData, responsibleGender: value as Gender })}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{Object.entries(genderLabels).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent>
                    </Select>
                    {formData.responsibleGender === 'other' && (
                      <Input placeholder="Informe o gênero" value="" onChange={(e) => setFormData({ ...formData, responsibleGender: e.target.value || 'other' })} className="mt-1" />
                    )}
                    {formData.responsibleGender && formData.responsibleGender !== 'male' && formData.responsibleGender !== 'female' && formData.responsibleGender !== 'other' && (
                      <Input value={formData.responsibleGender} onChange={(e) => setFormData({ ...formData, responsibleGender: e.target.value || 'other' })} className="mt-1" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Nascimento *</Label>
                    <ProfessionalDatePicker value={formData.responsibleBirthDate} onChange={(date) => setFormData({ ...formData, responsibleBirthDate: date })} placeholder="Selecione" minDate={minBirthDate} maxDate={maxBirthDate} yearRange={{ from: today.getFullYear() - 100, to: today.getFullYear() }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button onClick={() => handleSubmit()} disabled={isAdding}>{isAdding ? 'Salvando...' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDuplicateNameDialogOpen} onOpenChange={setIsDuplicateNameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paciente com nome idêntico</AlertDialogTitle>
            <AlertDialogDescription>Já existe um paciente cadastrado com o nome "{formData.fullName}". Deseja prosseguir com o cadastro mesmo assim?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setIsDuplicateNameDialogOpen(false); handleSubmit(true); }}>Cadastrar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
