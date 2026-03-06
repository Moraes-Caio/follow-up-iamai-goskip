export type Gender = 'male' | 'female' | 'other' | string;

export interface Procedure {
  id: string;
  title: string;
  description?: string;
  professionalIds?: string[];
  returnIntervalDays?: number;
  createdAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  birthDate: string;
  phone: string;
  gender?: Gender;
  hasResponsible: boolean;
  responsible?: {
    fullName: string;
    relation: 'mother' | 'father' | 'guardian' | 'spouse' | 'son' | 'daughter' | 'other';
    phone: string;
    gender?: Gender;
    birthDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  procedureName: string;
  procedureId?: string;
  professionalId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  confirmationSent: boolean;
  confirmationSentAt?: string;
  wasPerformed?: boolean;
  createdAt: string;
}

export interface ReminderTemplate {
  id: string;
  name: string;
  type: 'periodic_return' | 'appointment_confirmation';
  procedureName?: string;
  returnInterval?: number;
  returnIntervalUnit?: 'days' | 'weeks' | 'months' | 'years';
  sendBefore?: number;
  daysBeforeAppointment?: number;
  messageTemplate: string;
  isActive: boolean;
  createdAt: string;
}

export interface PeriodicReturn {
  id: string;
  patientId: string;
  reminderTemplateId: string;
  lastProcedureDate: string;
  nextReturnDate: string;
  reminderSentAt?: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface Message {
  id: string;
  patientId: string;
  appointmentId?: string;
  periodicReturnId?: string;
  type: 'periodic_return' | 'appointment_confirmation';
  recipientPhone: string;
  recipientName: string;
  messageContent: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

// ============= PERMISSION SYSTEM =============

export interface RolePermissions {
  // Consultas e Agendamentos
  viewAppointments: boolean;
  createAppointments: boolean;
  editAppointments: boolean;
  cancelAppointments: boolean;
  confirmAppointments: boolean;
  
  // Pacientes
  viewPatients: boolean;
  createPatients: boolean;
  editPatients: boolean;
  deletePatients: boolean;
  viewSensitiveData: boolean;
  
  // Lembretes e Mensagens
  viewReminders: boolean;
  manageReminders: boolean;
  viewMessages: boolean;
  sendMessages: boolean;
  
  // Gerenciamento de Equipe
  viewTeam: boolean;
  addTeamMembers: boolean;
  removeTeamMembers: boolean;
  manageRoles: boolean;
  
  // Configurações do Sistema
  viewSettings: boolean;
  editSettings: boolean;
  manageIntegrations: boolean;
  
  // Dashboard e Relatórios
  viewDashboard: boolean;
  viewReports: boolean;
  exportData: boolean;
  
  // Notificações
  viewNotifications: boolean;
  manageNotifications: boolean;
}

export interface PermissionCategory {
  id: string;
  label: string;
  icon: string;
  permissions: {
    key: keyof RolePermissions;
    label: string;
    description?: string;
  }[];
}

export const permissionCategories: PermissionCategory[] = [
  {
    id: 'appointments',
    label: 'Consultas e Agendamentos',
    icon: '📊',
    permissions: [
      { key: 'viewAppointments', label: 'Visualizar agenda', description: 'Ver consultas agendadas' },
      { key: 'createAppointments', label: 'Agendar consultas', description: 'Criar novos agendamentos' },
      { key: 'editAppointments', label: 'Editar consultas', description: 'Modificar agendamentos existentes' },
      { key: 'cancelAppointments', label: 'Cancelar consultas', description: 'Cancelar agendamentos' },
      { key: 'confirmAppointments', label: 'Confirmar consultas', description: 'Marcar consultas como confirmadas' },
    ],
  },
  {
    id: 'patients',
    label: 'Pacientes',
    icon: '👥',
    permissions: [
      { key: 'viewPatients', label: 'Visualizar pacientes', description: 'Ver lista e dados de pacientes' },
      { key: 'createPatients', label: 'Cadastrar pacientes', description: 'Adicionar novos pacientes' },
      { key: 'editPatients', label: 'Editar pacientes', description: 'Modificar dados de pacientes' },
      { key: 'deletePatients', label: 'Excluir pacientes', description: 'Remover pacientes do sistema' },
      { key: 'viewSensitiveData', label: 'Ver dados sensíveis', description: 'Visualizar telefone, data de nascimento e dados do responsável' },
    ],
  },
  {
    id: 'reminders',
    label: 'Lembretes e Mensagens',
    icon: '💬',
    permissions: [
      { key: 'viewReminders', label: 'Visualizar lembretes', description: 'Ver templates de lembretes' },
      { key: 'manageReminders', label: 'Gerenciar lembretes', description: 'Criar e editar templates' },
      { key: 'viewMessages', label: 'Visualizar mensagens', description: 'Ver histórico de mensagens' },
      { key: 'sendMessages', label: 'Enviar mensagens', description: 'Enviar mensagens para pacientes' },
    ],
  },
  {
    id: 'team',
    label: 'Gerenciamento de Equipe',
    icon: '🏥',
    permissions: [
      { key: 'viewTeam', label: 'Visualizar equipe', description: 'Ver membros da equipe' },
      { key: 'addTeamMembers', label: 'Adicionar e Editar Membros', description: 'Convidar novos membros e editar membros existentes' },
      { key: 'removeTeamMembers', label: 'Remover membros', description: 'Excluir membros da equipe' },
      { key: 'manageRoles', label: 'Gerenciar funções', description: 'Criar e editar funções' },
    ],
  },
  {
    id: 'settings',
    label: 'Configurações do Sistema',
    icon: '⚙️',
    permissions: [
      { key: 'viewSettings', label: 'Visualizar configurações', description: 'Ver configurações do sistema' },
      { key: 'editSettings', label: 'Editar configurações', description: 'Modificar configurações' },
      { key: 'manageIntegrations', label: 'Gerenciar integrações', description: 'Configurar WhatsApp e outras integrações' },
    ],
  },
  {
    id: 'reports',
    label: 'Dashboard e Relatórios',
    icon: '📈',
    permissions: [
      { key: 'viewDashboard', label: 'Visualizar dashboard', description: 'Acessar painel principal' },
      { key: 'viewReports', label: 'Visualizar relatórios', description: 'Ver relatórios e análises' },
      { key: 'exportData', label: 'Exportar dados', description: 'Baixar relatórios e dados' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notificações',
    icon: '🔔',
    permissions: [
      { key: 'viewNotifications', label: 'Visualizar notificações', description: 'Ver notificações do sistema' },
      { key: 'manageNotifications', label: 'Gerenciar notificações', description: 'Marcar como lida, arquivar, etc.' },
    ],
  },
];

export const defaultPermissions: RolePermissions = {
  viewAppointments: false,
  createAppointments: false,
  editAppointments: false,
  cancelAppointments: false,
  confirmAppointments: false,
  viewPatients: false,
  createPatients: false,
  editPatients: false,
  deletePatients: false,
  viewSensitiveData: false,
  viewReminders: false,
  manageReminders: false,
  viewMessages: false,
  sendMessages: false,
  viewTeam: false,
  addTeamMembers: false,
  removeTeamMembers: false,
  manageRoles: false,
  viewSettings: false,
  editSettings: false,
  manageIntegrations: false,
  viewDashboard: false,
  viewReports: false,
  exportData: false,
  viewNotifications: false,
  manageNotifications: false,
};

export const allPermissionsEnabled: RolePermissions = {
  viewAppointments: true,
  createAppointments: true,
  editAppointments: true,
  cancelAppointments: true,
  confirmAppointments: true,
  viewPatients: true,
  createPatients: true,
  editPatients: true,
  deletePatients: true,
  viewSensitiveData: true,
  viewReminders: true,
  manageReminders: true,
  viewMessages: true,
  sendMessages: true,
  viewTeam: true,
  addTeamMembers: true,
  removeTeamMembers: true,
  manageRoles: true,
  viewSettings: true,
  editSettings: true,
  manageIntegrations: true,
  viewDashboard: true,
  viewReports: true,
  exportData: true,
  viewNotifications: true,
  manageNotifications: true,
};

export interface Role {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  permissions: RolePermissions;
  isDefault: boolean;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  specialty?: string;
  isActive: boolean;
  isOwner?: boolean;
  createdAt: string;
}

export interface ClinicSettings {
  clinicName: string;
  specialty: string;
  phone: string;
  address: string;
  whatsappConnected: boolean;
  whatsappNumber?: string;
  emailNotifications: boolean;
  alertUnconfirmed: boolean;
}

export interface Notification {
  id: string;
  type: 'upcoming_appointment' | 'completed_appointment';
  appointmentId: string;
  title: string;
  description: string;
  isRead: boolean;
  isArchived: boolean;
  priority: 'low' | 'normal' | 'high';
  category: string;
  createdAt: string;
}

export type RelationType = 'mother' | 'father' | 'guardian' | 'spouse' | 'son' | 'daughter' | 'other';

export const relationLabels: Record<RelationType, string> = {
  mother: 'Mãe',
  father: 'Pai',
  guardian: 'Responsável Legal',
  spouse: 'Cônjuge',
  son: 'Filho',
  daughter: 'Filha',
  other: 'Outro',
};

export const genderLabels: Record<Gender, string> = {
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
};

export const statusLabels: Record<Appointment['status'], string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
};

export const messageStatusLabels: Record<Message['status'], string> = {
  sent: 'Enviado',
  delivered: 'Entregue',
  read: 'Lido',
  failed: 'Falhou',
};

// Role icons for selection
export const roleIcons = ['👨‍💼', '👩‍💼', '👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '👨‍💻', '👩‍💻', '📋', '🏥', '⚙️', '🔧', '📊', '💼', '🎯', '✨'];
