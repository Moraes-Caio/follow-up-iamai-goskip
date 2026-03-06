import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Patient, Appointment, ReminderTemplate, PeriodicReturn, Message, TeamMember, ClinicSettings, Notification, Role, RolePermissions, Procedure } from '@/types';
import { allPermissionsEnabled } from '@/types';

interface AppState {
  patients: Patient[];
  appointments: Appointment[];
  reminderTemplates: ReminderTemplate[];
  periodicReturns: PeriodicReturn[];
  messages: Message[];
  teamMembers: TeamMember[];
  roles: Role[];
  clinicSettings: ClinicSettings;
  notifications: Notification[];
  procedures: Procedure[];
  _initializedForEmail: string | null;
  
  // Initialize store for a specific user
  initializeForUser: (email: string, name: string, clinicName: string) => void;
  
  // Patient actions
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  
  // Appointment actions
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  
  // Reminder Template actions
  addReminderTemplate: (template: ReminderTemplate) => void;
  updateReminderTemplate: (id: string, template: Partial<ReminderTemplate>) => void;
  deleteReminderTemplate: (id: string) => void;
  
  // Periodic Return actions
  addPeriodicReturn: (periodicReturn: PeriodicReturn) => void;
  updatePeriodicReturn: (id: string, periodicReturn: Partial<PeriodicReturn>) => void;
  
  // Message actions
  addMessage: (message: Message) => void;
  
  // Team Member actions
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, member: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  
  // Role actions
  addRole: (role: Role) => void;
  updateRole: (id: string, role: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  
  // Settings actions
  updateClinicSettings: (settings: Partial<ClinicSettings>) => void;
  
  // Notification actions
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteMultipleNotifications: (ids: string[]) => void;
  archiveNotification: (id: string) => void;
  archiveMultipleNotifications: (ids: string[]) => void;
  unarchiveNotification: (id: string) => void;
  
  // Procedure actions
  addProcedure: (procedure: Procedure) => void;
  updateProcedure: (id: string, procedure: Partial<Procedure>) => void;
  deleteProcedure: (id: string) => void;
}

// ============= MOCK DATA (only for dmcaio.24@gmail.com) =============

const MOCK_EMAIL = 'dmcaio.24@gmail.com';

const mockPatients: Patient[] = [
  {
    id: '1',
    fullName: 'Maria Silva Santos',
    birthDate: '1985-03-15',
    phone: '(11) 99999-1234',
    gender: 'female',
    hasResponsible: false,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    fullName: 'João Pedro Oliveira',
    birthDate: '2015-07-22',
    phone: '(11) 98888-5678',
    gender: 'male',
    hasResponsible: true,
    responsible: {
      fullName: 'Ana Carolina Oliveira',
      relation: 'mother',
      phone: '(11) 98888-5678',
      gender: 'female',
      birthDate: '1985-05-10',
    },
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
  },
  {
    id: '3',
    fullName: 'Carlos Eduardo Ferreira',
    birthDate: '1970-11-08',
    phone: '(11) 97777-9012',
    gender: 'male',
    hasResponsible: false,
    createdAt: '2024-01-15T09:15:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
  },
];

const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    date: '2026-01-29',
    time: '09:00',
    procedureName: 'Limpeza',
    professionalId: '1',
    status: 'confirmed',
    confirmationSent: true,
    confirmationSentAt: '2026-01-27T08:00:00Z',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: '2',
    patientId: '2',
    date: '2026-01-30',
    time: '14:30',
    procedureName: 'Consulta de Rotina',
    professionalId: '1',
    status: 'pending',
    confirmationSent: false,
    createdAt: '2026-01-22T11:00:00Z',
  },
];

const mockReminderTemplates: ReminderTemplate[] = [
  {
    id: '1',
    name: 'Retorno Limpeza Semestral',
    type: 'periodic_return',
    procedureName: 'Limpeza',
    returnInterval: 6,
    returnIntervalUnit: 'months',
    sendBefore: 7,
    messageTemplate: 'Olá {nome_paciente}! 👋\n\nEste é um lembrete carinhoso da {clinica}.\n\nJá faz 6 meses desde sua última limpeza dental. Que tal agendar seu retorno para manter seu sorriso saudável? 😁\n\nAguardamos seu contato!',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Confirmação de Consulta',
    type: 'appointment_confirmation',
    daysBeforeAppointment: 1,
    messageTemplate: 'Olá {nome_paciente}! 👋\n\nLembramos que você tem uma consulta agendada:\n\n📅 Data: {data}\n🕐 Horário: {horario}\n🏥 {clinica}\n\nPor favor, confirme sua presença respondendo esta mensagem.\n\nAté breve!',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    patientId: '1',
    appointmentId: '1',
    type: 'appointment_confirmation',
    recipientPhone: '(11) 99999-1234',
    recipientName: 'Maria Silva Santos',
    messageContent: 'Olá Maria Silva Santos! 👋\n\nLembramos que você tem uma consulta agendada:\n\n📅 Data: 27/01/2025\n🕐 Horário: 09:00\n🏥 Clínica Odonto Saúde\n\nPor favor, confirme sua presença respondendo esta mensagem.\n\nAté breve!',
    status: 'read',
    sentAt: '2025-01-25T08:00:00Z',
    deliveredAt: '2025-01-25T08:00:30Z',
    readAt: '2025-01-25T08:15:00Z',
  },
  {
    id: '2',
    patientId: '3',
    type: 'periodic_return',
    recipientPhone: '(11) 97777-9012',
    recipientName: 'Carlos Eduardo Ferreira',
    messageContent: 'Olá Carlos Eduardo Ferreira! 👋\n\nEste é um lembrete carinhoso da Clínica Odonto Saúde.\n\nJá faz 6 meses desde sua última limpeza dental. Que tal agendar seu retorno para manter seu sorriso saudável? 😁\n\nAguardamos seu contato!',
    status: 'delivered',
    sentAt: '2025-01-23T10:00:00Z',
    deliveredAt: '2025-01-23T10:00:45Z',
  },
  {
    id: '3',
    patientId: '2',
    type: 'periodic_return',
    recipientPhone: '(11) 98888-5678',
    recipientName: 'Ana Carolina Oliveira',
    messageContent: 'Olá Ana Carolina Oliveira! 👋\n\nEste é um lembrete carinhoso da Clínica Odonto Saúde.\n\nEstá na hora do retorno do João Pedro Oliveira para a consulta odontológica. Que tal agendar um horário?\n\nAguardamos seu contato!',
    status: 'sent',
    sentAt: '2025-01-24T14:00:00Z',
  },
  {
    id: '4',
    patientId: '1',
    type: 'periodic_return',
    recipientPhone: '(11) 99999-1234',
    recipientName: 'Maria Silva Santos',
    messageContent: 'Olá Maria Silva Santos! 👋\n\nEste é um lembrete da Clínica Odonto Saúde.\n\nJá faz 1 ano desde sua última consulta oftalmológica. Agende seu retorno!',
    status: 'failed',
    sentAt: '2025-01-20T09:00:00Z',
  },
  {
    id: '5',
    patientId: '3',
    appointmentId: '3',
    type: 'appointment_confirmation',
    recipientPhone: '(11) 97777-9012',
    recipientName: 'Carlos Eduardo Ferreira',
    messageContent: 'Olá Carlos Eduardo Ferreira! 👋\n\nLembramos que você tem uma consulta agendada para amanhã.\n\nPor favor, confirme sua presença.',
    status: 'read',
    sentAt: '2025-01-19T16:00:00Z',
    deliveredAt: '2025-01-19T16:01:00Z',
    readAt: '2025-01-19T18:30:00Z',
  },
];

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'upcoming_appointment',
    appointmentId: '1',
    title: 'Consulta Próxima',
    description: 'Maria Silva Santos tem consulta amanhã às 09:00',
    isRead: false,
    isArchived: false,
    priority: 'high',
    category: 'Consultas Próximas',
    createdAt: '2026-01-28T08:00:00Z',
  },
  {
    id: '2',
    type: 'completed_appointment',
    appointmentId: '3',
    title: 'Consulta Concluída',
    description: 'Carlos Eduardo Ferreira compareceu à consulta de Limpeza',
    isRead: true,
    isArchived: false,
    priority: 'normal',
    category: 'Consultas Concluídas',
    createdAt: '2026-01-27T15:00:00Z',
  },
  {
    id: '3',
    type: 'upcoming_appointment',
    appointmentId: '2',
    title: 'Consulta Próxima',
    description: 'João Pedro Oliveira tem consulta em 2 dias às 14:30',
    isRead: false,
    isArchived: false,
    priority: 'normal',
    category: 'Consultas Próximas',
    createdAt: '2026-01-28T10:00:00Z',
  },
  {
    id: '4',
    type: 'completed_appointment',
    appointmentId: '4',
    title: 'Consulta Não Realizada',
    description: 'Ana Paula Costa não compareceu à consulta de Ortodontia',
    isRead: false,
    isArchived: false,
    priority: 'high',
    category: 'Consultas Concluídas',
    createdAt: '2026-01-26T18:00:00Z',
  },
  {
    id: '5',
    type: 'upcoming_appointment',
    appointmentId: '5',
    title: 'Consulta Próxima',
    description: 'Roberto Mendes tem consulta na próxima semana',
    isRead: true,
    isArchived: true,
    priority: 'low',
    category: 'Consultas Próximas',
    createdAt: '2026-01-25T12:00:00Z',
  },
];

const mockProcedures: Procedure[] = [
  { id: 'proc1', title: 'Limpeza', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'proc2', title: 'Consulta de Rotina', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'proc3', title: 'Restauração', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'proc4', title: 'Extração', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'proc5', title: 'Canal', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'proc6', title: 'Clareamento', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'proc7', title: 'Ortodontia', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'proc8', title: 'Implante', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'proc9', title: 'Prótese', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'proc10', title: 'Outros', createdAt: '2024-01-01T00:00:00Z' },
];

// ============= DEFAULT ROLES (always present) =============

const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso completo ao sistema',
    icon: '👨‍💼',
    permissions: { ...allPermissionsEnabled },
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dentist',
    name: 'Dentista',
    description: 'Profissional de saúde',
    icon: '👨‍⚕️',
    permissions: {
      viewAppointments: true,
      createAppointments: true,
      editAppointments: true,
      cancelAppointments: true,
      confirmAppointments: true,
      viewPatients: true,
      createPatients: true,
      editPatients: true,
      deletePatients: false,
      viewSensitiveData: true,
      viewReminders: true,
      manageReminders: true,
      viewMessages: true,
      sendMessages: true,
      viewTeam: true,
      addTeamMembers: false,
      removeTeamMembers: false,
      manageRoles: false,
      viewSettings: true,
      editSettings: false,
      manageIntegrations: false,
      viewDashboard: true,
      viewReports: true,
      exportData: true,
      viewNotifications: true,
      manageNotifications: true,
    },
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'receptionist',
    name: 'Recepcionista',
    description: 'Atendimento e agendamentos',
    icon: '📋',
    permissions: {
      viewAppointments: true,
      createAppointments: true,
      editAppointments: true,
      cancelAppointments: false,
      confirmAppointments: true,
      viewPatients: true,
      createPatients: true,
      editPatients: true,
      deletePatients: false,
      viewSensitiveData: false,
      viewReminders: true,
      manageReminders: false,
      viewMessages: true,
      sendMessages: true,
      viewTeam: true,
      addTeamMembers: false,
      removeTeamMembers: false,
      manageRoles: false,
      viewSettings: false,
      editSettings: false,
      manageIntegrations: false,
      viewDashboard: true,
      viewReports: false,
      exportData: false,
      viewNotifications: true,
      manageNotifications: true,
    },
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

// ============= EMPTY DEFAULTS =============

const emptyClinicSettings = (clinicName: string): ClinicSettings => ({
  clinicName: clinicName || 'Minha Clínica',
  specialty: '',
  phone: '',
  address: '',
  whatsappConnected: false,
  whatsappNumber: undefined,
  emailNotifications: true,
  alertUnconfirmed: true,
});

const mockClinicSettings: ClinicSettings = {
  clinicName: 'Clínica Odonto Saúde',
  specialty: 'Odontologia Geral',
  phone: '(11) 3333-4444',
  address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
  whatsappConnected: true,
  whatsappNumber: '(11) 99999-0000',
  emailNotifications: true,
  alertUnconfirmed: true,
};

const getMockTeamMembers = (userName: string, userEmail: string): TeamMember[] => [
  {
    id: '1',
    fullName: 'Dr. Roberto Almeida',
    email: 'roberto@clinica.com',
    roleId: 'dentist',
    specialty: 'Ortodontia',
    isActive: true,
    isOwner: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    fullName: 'Paula Mendes',
    email: 'paula@clinica.com',
    roleId: 'receptionist',
    isActive: true,
    isOwner: false,
    createdAt: '2024-01-05T00:00:00Z',
  },
];

const getOwnerTeamMember = (userName: string, userEmail: string): TeamMember[] => [
  {
    id: 'owner-1',
    fullName: userName,
    email: userEmail,
    roleId: 'admin',
    isActive: true,
    isOwner: true,
    createdAt: new Date().toISOString(),
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      patients: [],
      appointments: [],
      reminderTemplates: [],
      periodicReturns: [],
      messages: [],
      teamMembers: [],
      roles: [...defaultRoles],
      clinicSettings: emptyClinicSettings(''),
      notifications: [],
      procedures: [],
      _initializedForEmail: null,

      initializeForUser: (email: string, name: string, clinicName: string) => {
        const current = get()._initializedForEmail;
        if (current === email) return; // already initialized for this user

        const isMockUser = email === MOCK_EMAIL;

        set({
          _initializedForEmail: email,
          patients: isMockUser ? mockPatients : [],
          appointments: isMockUser ? mockAppointments : [],
          reminderTemplates: isMockUser ? mockReminderTemplates : [],
          periodicReturns: [],
          messages: isMockUser ? mockMessages : [],
          teamMembers: isMockUser ? getMockTeamMembers(name, email) : getOwnerTeamMember(name, email),
          roles: [...defaultRoles],
          clinicSettings: isMockUser ? mockClinicSettings : emptyClinicSettings(clinicName),
          notifications: isMockUser ? mockNotifications : [],
          procedures: isMockUser ? mockProcedures : [],
        });
      },
      
      addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),
      updatePatient: (id, patient) => set((state) => ({
        patients: state.patients.map((p) => p.id === id ? { ...p, ...patient, updatedAt: new Date().toISOString() } : p),
      })),
      deletePatient: (id) => set((state) => ({ patients: state.patients.filter((p) => p.id !== id) })),
      
      addAppointment: (appointment) => set((state) => ({ appointments: [...state.appointments, appointment] })),
      updateAppointment: (id, appointment) => set((state) => ({
        appointments: state.appointments.map((a) => a.id === id ? { ...a, ...appointment } : a),
      })),
      deleteAppointment: (id) => set((state) => ({ appointments: state.appointments.filter((a) => a.id !== id) })),
      
      addReminderTemplate: (template) => set((state) => ({ reminderTemplates: [...state.reminderTemplates, template] })),
      updateReminderTemplate: (id, template) => set((state) => ({
        reminderTemplates: state.reminderTemplates.map((t) => t.id === id ? { ...t, ...template } : t),
      })),
      deleteReminderTemplate: (id) => set((state) => ({ reminderTemplates: state.reminderTemplates.filter((t) => t.id !== id) })),
      
      addPeriodicReturn: (periodicReturn) => set((state) => ({ periodicReturns: [...state.periodicReturns, periodicReturn] })),
      updatePeriodicReturn: (id, periodicReturn) => set((state) => ({
        periodicReturns: state.periodicReturns.map((pr) => pr.id === id ? { ...pr, ...periodicReturn } : pr),
      })),
      
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      
      addTeamMember: (member) => set((state) => ({ teamMembers: [...state.teamMembers, member] })),
      updateTeamMember: (id, member) => set((state) => ({
        teamMembers: state.teamMembers.map((m) => m.id === id ? { ...m, ...member } : m),
      })),
      deleteTeamMember: (id) => set((state) => ({ teamMembers: state.teamMembers.filter((m) => m.id !== id) })),
      
      addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
      updateRole: (id, role) => set((state) => ({
        roles: state.roles.map((r) => r.id === id ? { ...r, ...role } : r),
      })),
      deleteRole: (id) => set((state) => ({ roles: state.roles.filter((r) => r.id !== id) })),
      
      updateClinicSettings: (settings) => set((state) => ({
        clinicSettings: { ...state.clinicSettings, ...settings },
      })),
      
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
      })),
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
      })),
      markAllNotificationsAsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      })),
      deleteNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
      deleteMultipleNotifications: (ids) => set((state) => ({
        notifications: state.notifications.filter((n) => !ids.includes(n.id)),
      })),
      archiveNotification: (id) => set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, isArchived: true } : n),
      })),
      archiveMultipleNotifications: (ids) => set((state) => ({
        notifications: state.notifications.map((n) => ids.includes(n.id) ? { ...n, isArchived: true } : n),
      })),
      unarchiveNotification: (id) => set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, isArchived: false } : n),
      })),
      
      addProcedure: (procedure) => set((state) => ({ procedures: [...state.procedures, procedure] })),
      updateProcedure: (id, procedure) => set((state) => ({
        procedures: state.procedures.map((p) => p.id === id ? { ...p, ...procedure } : p),
      })),
      deleteProcedure: (id) => set((state) => ({ procedures: state.procedures.filter((p) => p.id !== id) })),
    }),
    {
      name: 'followup-agent-storage',
    }
  )
);
