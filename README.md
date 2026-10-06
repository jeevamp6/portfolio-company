# Aegrion Security | Enterprise Security Intelligence Platform V2

Aegrion is a modern, production-ready enterprise B2B cybersecurity & SaaS platform built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **Supabase**, and **Razorpay Subscriptions**.

---

## 🚀 Key Features & Capabilities

- **Modern Enterprise Design System**: Clean, high-contrast B2B SaaS aesthetic (Stripe/Vercel/Datadog quality) with zero gimmicky dark hacker themes or cheesy terminal animations.
- **Unified Attack Surface Discovery**: Agentless network recon, subnets, domain enumerations, and port tracking.
- **Copilot AI Security Assistant**: Context-aware threat analysis, CVE vulnerability scoring, and MITRE ATT&CK tactical mapping.
- **Seamless Authentication**: Instant account setup with Supabase Auth—no email verification blocking prior to sandbox access.
- **Server-Authoritative Razorpay Billing**: Recurring SaaS subscription management (Starter $29, Professional $99, Enterprise $299) with server-side price & tax calculations.
- **Atomic Coupon System (`AEGIRION100`)**: 30% OFF annual subscriptions for the first 100 founding customers, enforced atomically in PostgreSQL via `redeem_coupon_atomic` RPC to prevent race conditions.
- **Automated Tax Invoicing**: Real-time PDF tax invoice generation with 18% GST split calculations.

---

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite 5, React Router v6
- **Icons**: Lucide React (`lucide-react`)
- **Styling**: Tailwind CSS + JIT
- **Backend & Auth**: Supabase PostgreSQL + Supabase Auth (`@supabase/supabase-js`)
- **Edge Functions**: Deno TypeScript (`supabase/functions/checkout/index.ts`)
- **Payments**: Razorpay Subscriptions API & Standard Checkout SDK
- **Hosting**: Netlify / Cloudflare Pages (Publish Directory: `dist`)

---

## 📁 Directory Structure

```
├── public/                 # Static assets & SPA _redirects
├── src/
│   ├── assets/             # Logos, graphics
│   ├── components/
│   │   ├── ui/             # Atomic UI (Button, Card, Badge, Input, Modal, Table)
│   │   ├── marketing/      # Public landing sections
│   │   ├── navigation/     # Responsive Navbar, Sidebar, ProtectedRoute
│   │   ├── billing/        # Plan Selector, Coupon Input, Payment History
│   │   └── dashboard/      # Security Score, Alert widgets, Threat Feeds
│   ├── pages/
│   │   ├── marketing/      # Home, Platform, Solutions, Features, Pricing, Security, Resources, About, Contact, Privacy, Terms
│   │   ├── auth/           # Login, Register, ForgotPassword, ResetPassword
│   │   └── app/            # Dashboard, Security, Alerts, Incidents, Assets, Reports, Integrations, Team, Billing, Settings
│   ├── layouts/            # MarketingLayout, AuthLayout, AppLayout
│   ├── features/           # Auth context & session state
│   ├── hooks/              # useAuth hook
│   ├── lib/                # supabase.ts, razorpay.ts, tax.ts, utils.ts
│   ├── config/             # pricing.ts, routes.ts, site.ts
│   ├── types/              # TypeScript definitions
│   ├── App.tsx             # Application router
│   └── main.tsx            # Entrypoint
├── supabase/
│   └── functions/
│       └── checkout/       # Server-side Razorpay Plan & Verification Edge Function
├── netlify.toml            # Netlify deployment configuration
├── package.json
└── README.md
```

---

## 💻 Local Development Setup

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the project root based on `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_RAZORPAY_KEY_ID=rzp_live_your_key_id
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Production Build Verification**:
   ```bash
   npm run build
   ```
   The compiled SPA bundle will be generated in `dist/`.

---

## 🔒 Security & Deployment Notes

- **Zero Secret Leakage**: Private credentials (`RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) are **never** included in client `.env` files or compiled JS bundles. They reside exclusively in Supabase Edge Functions environment secrets.
- **Netlify Deploy Instructions**:
  - Build command: `npm run build`
  - Publish directory: `dist`
