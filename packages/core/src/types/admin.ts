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
  primaryColor?: string;
  supportEmail?: string;
  websiteUrl?: string;
  footerText?: string;
  customDomain?: string;
  ownerPassword?: string;
}

/** A workspace's own brand, used instead of ours when white-label is on. */
export interface WorkspaceBranding {
  displayName?: string;
  logoUrl?: string;
  primaryColor?: string;
  supportEmail?: string;
  websiteUrl?: string;
  footerText?: string;
  /** The customer's own domain, such as billing.acme.com. It also has to be added in Vercel and DNS. */
  customDomain?: string;
}

/** What the server shares about a workspace. It never includes the password. */
export interface WorkspaceConfig {
  id: string;
  name: string;
  ownerEmail: string;
  plan: PlanId;
  status: 'active' | 'suspended';
  isWhiteLabel: boolean;
  branding: WorkspaceBranding;
  createdAt: string;
  updatedAt: string;
}
