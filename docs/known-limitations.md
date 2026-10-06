# Known Limitations & Deferred Features

## Web Application Phase Notes

1. **Native Mobile Development Deferred:**
   - Per project guidelines, native mobile apps (Expo / React Native) are explicitly deferred to the next project phase. The web application includes complete responsive mobile viewport support.

2. **Automated Payment Gateway Webhooks:**
   - Real-time automated Stripe/PayPal capture webhooks require external merchant credentials and will be integrated in the live payments gateway milestone. Manual payment tracking (cash, wire, cheque, card, ACH) is fully implemented and tested.

3. **Automated SSL Certificate Issuance for Custom Domains:**
   - Custom domain database schemas, verification records, and CNAME target mappings are deployed. Automated ACME challenge issuance via Cloudflare for SaaS or Vercel Domains API requires production platform API credentials.

4. **Resend Live Sending:**
   - Live email delivery requires setting `RESEND_API_KEY` in production environment variables. The application provides graceful feedback and offline PDF generation when unconfigured.
