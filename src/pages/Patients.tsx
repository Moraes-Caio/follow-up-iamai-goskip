import { useState, useMemo, useRef } from 'react';
import { usePatients, type PatientRow } from '@/hooks/usePatients';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { toast } from '@/hooks/use-toast';
import { calculateAge, formatDate, cn } from '@/lib/utils';
import { relationLabels, genderLabels, type RelationType, type Gender } from '@/types';
import { Plus, Search, Pencil, Trash2, Users, Filter, Loader2 } from 'lucide-react';

function HighlightText({ text, query, active }: { text: string; query: string; active: boolean }) {
  if (!active || !query.trim()) return <>{text}</>;
  const normalizedText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const index = normalizedText.indexOf(normalizedQuery);
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm px-0.5" style={{ backgroundColor: '#FFFF00', color: 'inherit' }}>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}
import { format, subYears, parseISO } from 'date-fns';
import { PatientHistoryDialog } from '@/components/patients/PatientHistoryDialog';

type SearchFilter = 'patient' | 'responsible' | 'age' | 'phone';

const filterLabels: Record<SearchFilter, string> = {
  patient: 'Paciente',
  responsible: 'Responsável',
  age: 'Idade',
  phone: 'Telefone',
};

export default function Patients() {
  const { patients, addPatient, updatePatient, deletePatient, isLoading } = usePatients();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDuplicateNameDialogOpen, setIsDuplicateNameDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<PatientRow | null>(null);
  const [historyPatient, setHistoryPatient] = useState<PatientRow | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<SearchFilter>>(new Set(['patient', 'responsible', 'age', 'phone']));

  // Date constraints for birth date
  const today = new Date();
  const maxBirthDate = new Date(today);
  maxBirthDate.setDate(maxBirthDate.getDate() - 1);
  const minBirthDate = subYears(today, 100);

  // Form state
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

  // Phone input refs for cursor management
  const phoneRef = useRef<HTMLInputElement>(null);
  const responsiblePhoneRef = useRef<HTMLInputElement>(null);

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const toggleFilter = (filter: SearchFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery.trim()) return true;
    const query = normalize(searchQuery);
    const cleanedQuery = query.replace(/[()-\s]/g, '');

    const matches: boolean[] = [];

    if (activeFilters.has('patient')) {
      matches.push(normalize(patient.full_name).includes(query));
    }
    if (activeFilters.has('responsible')) {
      matches.push(normalize(patient.responsible_name || '').includes(query));
    }
    if (activeFilters.has('age')) {
      const age = calculateAge(patient.birth_date).toString();
      matches.push(age.includes(cleanedQuery));
    }
    if (activeFilters.has('phone')) {
      const cleanedPatientPhone = patient.phone.replace(/[()-\s]/g, '');
      const cleanedResponsiblePhone = patient.responsible_phone?.replace(/[()-\s]/g, '') || '';
      matches.push(cleanedPatientPhone.includes(cleanedQuery) || cleanedResponsiblePhone.includes(cleanedQuery));
    }

    return matches.some(Boolean);
  });

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
    setFormData({ ...formData, [field]: formatted });

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
      fullName: '',
      birthDate: undefined,
      phone: '',
      gender: '',
      hasResponsible: false,
      responsibleName: '',
      responsibleRelation: '',
      responsiblePhone: '',
      responsibleGender: '',
      responsibleBirthDate: undefined,
    });
    setSelectedPatient(null);
  };

  const handleOpenDialog = (patient?: PatientRow) => {
    if (patient) {
      setSelectedPatient(patient);
      setFormData({
        fullName: patient.full_name,
        birthDate: patient.birth_date ? parseISO(patient.birth_date) : undefined,
        phone: patient.phone,
        gender: (patient.gender as Gender) || '',
        hasResponsible: patient.has_responsible || false,
        responsibleName: patient.responsible_name || '',
        responsibleRelation: (patient.responsible_relation as RelationType) || '',
        responsiblePhone: patient.responsible_phone || '',
        responsibleGender: (patient.responsible_gender as Gender) || '',
        responsibleBirthDate: patient.responsible_birth_date ? parseISO(patient.responsible_birth_date) : undefined,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const getPhoneForPatient = (): string => {
    return formData.hasResponsible ? formData.responsiblePhone : formData.phone;
  };

  const checkDuplicatePhone = (): PatientRow | null => {
    const phone = getPhoneForPatient().replace(/\D/g, '');
    if (!phone) return null;

    return patients.find((p) => {
      if (selectedPatient && p.id === selectedPatient.id) return false;
      const pPhone = p.phone.replace(/\D/g, '');
      const pResponsiblePhone = p.responsible_phone?.replace(/\D/g, '') || '';
      
      if (pPhone === phone || pResponsiblePhone === phone) {
        if (formData.hasResponsible) {
          const responsiblePhone = formData.responsiblePhone.replace(/\D/g, '');
          if (pPhone === responsiblePhone || pResponsiblePhone === responsiblePhone) {
            const responsibleAsPatient = patients.find(
              (rp) => rp.phone.replace(/\D/g, '') === responsiblePhone && rp.id !== selectedPatient?.id
            );
            if (
              responsibleAsPatient &&
              normalize(responsibleAsPatient.full_name) === normalize(formData.responsibleName) &&
              responsibleAsPatient.gender === formData.responsibleGender &&
              (responsibleAsPatient.birth_date === (formData.responsibleBirthDate ? format(formData.responsibleBirthDate, 'yyyy-MM-dd') : ''))
            ) {
              return false;
            }
          }
        }
        if (!formData.hasResponsible) {
          const patientPhone = formData.phone.replace(/\D/g, '');
          const asResponsible = patients.find(
            (rp) => rp.responsible_phone?.replace(/\D/g, '') === patientPhone && rp.id !== selectedPatient?.id
          );
          if (asResponsible && normalize(asResponsible.responsible_name || '') === normalize(formData.fullName)) {
            return false;
          }
        }
        return true;
      }
      return false;
    }) || null;
  };

  const checkDuplicateName = (): PatientRow | null => {
    return patients.find((p) => {
      if (selectedPatient && p.id === selectedPatient.id) return false;
      return normalize(p.full_name) === normalize(formData.fullName);
    }) || null;
  };

  const handleSubmit = (skipNameCheck = false) => {
    const missingBase = !formData.fullName || !formData.birthDate || !formData.gender;
    const missingPhone = formData.hasResponsible ? !formData.responsiblePhone : !formData.phone;
    const missingResponsible = formData.hasResponsible && (!formData.responsibleName || !formData.responsiblePhone || !formData.responsibleGender || !formData.responsibleBirthDate);

    if (missingBase || missingPhone || missingResponsible) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    const duplicatePhone = checkDuplicatePhone();
    if (duplicatePhone) {
      toast({ title: 'Telefone já cadastrado', description: `O número informado já pertence ao paciente "${duplicatePhone.full_name}".`, variant: 'destructive' });
      return;
    }

    if (!skipNameCheck && !selectedPatient) {
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
      if (selectedPatient) {
        await updatePatient({ id: selectedPatient.id, ...patientData });
        toast({ title: 'Sucesso', description: 'Paciente atualizado com sucesso!' });
      } else {
        await addPatient(patientData);
        toast({ title: 'Sucesso', description: 'Paciente cadastrado com sucesso!' });
      }
      handleCloseDialog();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao salvar paciente.', variant: 'destructive' });
    }
  };

  const handleDeletePatient = async () => {
    if (patientToDelete) {
      try {
        await deletePatient(patientToDelete.id);
        toast({ title: 'Sucesso', description: 'Paciente excluído com sucesso!' });
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      }
      setPatientToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Adapt PatientRow to the shape PatientHistoryDialog expects
  const historyPatientAdapted = historyPatient ? {
    id: historyPatient.id,
    fullName: historyPatient.full_name,
    birthDate: historyPatient.birth_date,
    phone: historyPatient.phone,
    gender: historyPatient.gender as Gender | undefined,
    hasResponsible: historyPatient.has_responsible || false,
    responsible: historyPatient.has_responsible && historyPatient.responsible_name ? {
      fullName: historyPatient.responsible_name,
      relation: historyPatient.responsible_relation as RelationType,
      phone: historyPatient.responsible_phone || '',
      gender: historyPatient.responsible_gender as Gender | undefined,
      birthDate: historyPatient.responsible_birth_date || undefined,
    } : undefined,
    createdAt: historyPatient.created_at,
    updatedAt: historyPatient.updated_at,
  } : null;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Pacientes</h1>
            <p className="text-muted-foreground">Gerencie os pacientes da sua clínica</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        {/* Search + Filters */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                Pesquisar por:
              </span>
              {(Object.keys(filterLabels) as SearchFilter[]).map((filter) => (
                <Badge
                  key={filter}
                  variant={activeFilters.has(filter) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer select-none transition-colors',
                    activeFilters.has(filter)
                      ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => toggleFilter(filter)}
                >
                  {filterLabels[filter]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-3 text-lg font-medium text-foreground">Nenhum paciente encontrado</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Tente uma busca diferente' : 'Comece adicionando seu primeiro paciente'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Responsável</TableHead>
                      
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...filteredPatients].sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR')).map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {patient.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <button
                              className="font-medium hover:underline text-primary cursor-pointer text-left"
                              onClick={() => setHistoryPatient(patient)}
                            >
                              <HighlightText text={patient.full_name} query={searchQuery} active={activeFilters.has('patient') && !!searchQuery} />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>{calculateAge(patient.birth_date)} anos</TableCell>
                        <TableCell>{patient.has_responsible && patient.responsible_phone ? patient.responsible_phone : patient.phone}</TableCell>
                        <TableCell>
                          {patient.has_responsible && patient.responsible_name ? (
                            <div>
                              <p className="font-medium">
                                <HighlightText text={patient.responsible_name} query={searchQuery} active={activeFilters.has('responsible') && !!searchQuery} />
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {patient.responsible_relation ? relationLabels[patient.responsible_relation as RelationType] : ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(patient)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPatientToDelete(patient);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto top-[2rem] translate-y-0">
          <DialogHeader>
            <DialogTitle>{selectedPatient ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
            <DialogDescription>
              {selectedPatient ? 'Atualize as informações do paciente' : 'Preencha os dados do novo paciente'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ex: Maria Silva Santos"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Nascimento *</Label>
                <ProfessionalDatePicker
                  value={formData.birthDate}
                  onChange={(date) => setFormData({ ...formData, birthDate: date })}
                  placeholder="Selecione"
                  minDate={minBirthDate}
                  maxDate={maxBirthDate}
                  yearRange={{ from: today.getFullYear() - 100, to: today.getFullYear() }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero *</Label>
                <Select
                  value={formData.gender === 'male' || formData.gender === 'female' || formData.gender === 'other' ? formData.gender : formData.gender ? 'other' : ''}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(genderLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.gender === 'other' && (
                  <Input
                    placeholder="Informe o gênero"
                    value=""
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value || 'other' })}
                    className="mt-1"
                  />
                )}
                {formData.gender && formData.gender !== 'male' && formData.gender !== 'female' && formData.gender !== 'other' && (
                  <Input
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value || 'other' })}
                    className="mt-1"
                  />
                )}
              </div>
            </div>

            {!formData.hasResponsible && (
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  ref={phoneRef}
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value, 'phone', phoneRef)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="hasResponsible" className="font-medium">Este paciente tem um responsável?</Label>
                <p className="text-sm text-muted-foreground">Ative se o paciente for menor ou dependente</p>
              </div>
              <Switch
                id="hasResponsible"
                checked={formData.hasResponsible}
                onCheckedChange={(checked) => setFormData({ ...formData, hasResponsible: checked })}
              />
            </div>

            {formData.hasResponsible && (
              <div className="space-y-4 rounded-lg border border-border p-4 animate-fade-in">
                <h4 className="font-medium text-foreground">Dados do Responsável</h4>
                <div className="space-y-2">
                  <Label htmlFor="responsibleName">Nome do Responsável *</Label>
                  <Input
                    id="responsibleName"
                    value={formData.responsibleName}
                    onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                    placeholder="Ex: Ana Carolina Santos"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsibleRelation">Relação *</Label>
                    <Select
                      value={formData.responsibleRelation}
                      onValueChange={(value) => setFormData({ ...formData, responsibleRelation: value as RelationType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(relationLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsiblePhone">Telefone *</Label>
                    <Input
                      id="responsiblePhone"
                      ref={responsiblePhoneRef}
                      value={formData.responsiblePhone}
                      onChange={(e) => handlePhoneChange(e.target.value, 'responsiblePhone', responsiblePhoneRef)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsibleGender">Gênero *</Label>
                    <Select
                      value={formData.responsibleGender === 'male' || formData.responsibleGender === 'female' || formData.responsibleGender === 'other' ? formData.responsibleGender : formData.responsibleGender ? 'other' : ''}
                      onValueChange={(value) => setFormData({ ...formData, responsibleGender: value as Gender })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(genderLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.responsibleGender === 'other' && (
                      <Input
                        placeholder="Informe o gênero"
                        value=""
                        onChange={(e) => setFormData({ ...formData, responsibleGender: e.target.value || 'other' })}
                        className="mt-1"
                      />
                    )}
                    {formData.responsibleGender && formData.responsibleGender !== 'male' && formData.responsibleGender !== 'female' && formData.responsibleGender !== 'other' && (
                      <Input
                        value={formData.responsibleGender}
                        onChange={(e) => setFormData({ ...formData, responsibleGender: e.target.value || 'other' })}
                        className="mt-1"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Nascimento *</Label>
                    <ProfessionalDatePicker
                      value={formData.responsibleBirthDate}
                      onChange={(date) => setFormData({ ...formData, responsibleBirthDate: date })}
                      placeholder="Selecione"
                      minDate={minBirthDate}
                      maxDate={maxBirthDate}
                      yearRange={{ from: today.getFullYear() - 100, to: today.getFullYear() }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={() => handleSubmit()}>{selectedPatient ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente "{patientToDelete?.full_name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Name Warning */}
      <AlertDialog open={isDuplicateNameDialogOpen} onOpenChange={setIsDuplicateNameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paciente com nome idêntico</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe um paciente cadastrado com o nome "{formData.fullName}". Deseja prosseguir com o cadastro mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsDuplicateNameDialogOpen(false);
              handleSubmit(true);
            }}>
              Cadastrar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PatientHistoryDialog
        patient={historyPatientAdapted}
        open={!!historyPatient}
        onOpenChange={(open) => !open && setHistoryPatient(null)}
        onEdit={() => {
          const p = historyPatient;
          setHistoryPatient(null);
          if (p) handleOpenDialog(p);
        }}
        onDelete={() => {
          const p = historyPatient;
          setHistoryPatient(null);
          if (p) {
            setPatientToDelete(p);
            setIsDeleteDialogOpen(true);
          }
        }}
      />
    </MainLayout>
  );
}
