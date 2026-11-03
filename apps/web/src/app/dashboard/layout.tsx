import { TenantLayout } from '@/components/layout/tenant-layout';

/** Keeps the sidebar and top bar in place while moving between dashboard pages. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <TenantLayout>{children}</TenantLayout>;
}
