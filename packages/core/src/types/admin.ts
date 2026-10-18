import { PlanId, PlanLimits } from './team';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
  status: 'active' | 'banned';
  createdAt: string;
  invoicesCount: number;
}

export interface AdminInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: string;
  notes?: string;
}

export interface AdminSiteSettings {
  announcementBanner: {
    enabled: boolean;
    text: string;
    variant: 'info' | 'warning' | 'success';
  };
  maintenanceMode: boolean;
  defaultCurrency: string;
  allowPublicSignups: boolean;
  seoDefaults: {
    title: string;
    description: string;
  };
}

export interface AdminSystemAuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress?: string;
}

export interface AdminTemplateSetting {
  id: string;
  name: string;
  category: string;
  isPro: boolean;
  enabled: boolean;
  downloadsCount: number;
}

export interface AdminTeam {
  id: string;
  name: string;
  ownerEmail: string;
  membersCount: number;
  invoicesCount: number;
  plan: PlanId;
  status: 'active' | 'suspended';
  createdAt: string;
  isWhiteLabel?: boolean;
  companyDisplayName?: string;
  logoUrl?: string;
  ownerPassword?: string;
}
