# Environment Variables Reference

| Variable | Description | Required? | Default / Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Base URL of the web application | Optional | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Optional | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous API key | Optional | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for administrative functions (never exposed to client) | Optional | `eyJhbG...` |
| `RESEND_API_KEY` | API key for Resend transactional email service | Optional | `re_123456...` |
| `EMAIL_FROM_ADDRESS` | Verified sending address for transactional emails | Optional | `invoices@yourdomain.com` |
| `SUPER_ADMIN_EMAIL` | Super admin sign-in email (server only) | Required for admin | `admin@yourdomain.com` |
| `SUPER_ADMIN_PASSWORD` | Super admin password (server only) | Required for admin | Long, unique value |
| `ADMIN_SESSION_SECRET` | Signs admin sessions, at least 32 characters (server only) | Required for admin | Long random value |
| `NODE_ENV` | Environment state (`development`, `production`, `test`) | Optional | `development` |

> **Note:** When Supabase environment variables are omitted, BillCraft automatically activates its built-in development fallback adapter, enabling immediate local development and demonstration.
