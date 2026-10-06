# Security & Authorization Architecture

## Row Level Security (RLS)

Every tenant-owned table in PostgreSQL is protected by Row Level Security policies.

### Authorization Function
Cross-tenant reads, writes, and privilege escalations are prevented using a non-recursive, security-definer function:

```sql
CREATE OR REPLACE FUNCTION is_member(check_tenant_id UUID, min_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = check_tenant_id
      AND user_id = auth.uid()
      AND (
        CASE min_role
          WHEN 'viewer' THEN role IN ('owner', 'admin', 'accountant', 'staff', 'viewer')
          WHEN 'staff' THEN role IN ('owner', 'admin', 'accountant', 'staff')
          WHEN 'accountant' THEN role IN ('owner', 'admin', 'accountant')
          WHEN 'admin' THEN role IN ('owner', 'admin')
          WHEN 'owner' THEN role = 'owner'
          ELSE FALSE
        END
      )
  );
$$;
```

### Role Hierarchies & Permissions

1. **Owner:** Full workspace control, billing, deletion, and member ownership transfers.
2. **Admin:** Manage team members, workspace settings, brand templates, and custom domains.
3. **Accountant:** Read/write invoices, credit notes, reports, and record payments.
4. **Staff:** Create and update draft documents, customers, and product catalogs.
5. **Viewer:** Read-only access to documents and customer directories.

### Local Privacy Guarantee
In Anonymous Mode, documents are stored exclusively in the browser's IndexedDB. No background synchronization occurs without explicit user consent via the Local-to-Cloud Migration Wizard.
