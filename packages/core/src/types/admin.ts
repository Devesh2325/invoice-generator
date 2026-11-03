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

export interface AdminSystemAuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress?: string;
}

export interface GeneratorFieldSettings {
  showHsnColumn: boolean;
  showTaxRateColumn: boolean;
  showUnitColumn: boolean;
  showDiscountColumn: boolean;
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
