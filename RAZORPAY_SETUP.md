# Razorpay SaaS Billing & Coupon Integration Guide

This guide documents the setup, verification, security policies, database migrations, and testing workflows for the newly integrated Razorpay subscription system.

---

## 1. Database Schema Migrations

Apply the database schema changes to support Razorpay and the atomic coupon validation system. You can execute these queries in the **Supabase SQL Editor**:

```sql
-- 1. Create or update coupon_codes table
create table if not exists public.coupon_codes (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  discount_type text default 'percentage' not null,
  discount_percent integer not null,
  max_redemptions integer default 100,
  current_redemptions integer default 0,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  eligible_plans text[] default array['Starter', 'Professional', 'Enterprise']::text[],
  annual_only boolean default true,
  first_time_customer_only boolean default false,
  active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create coupon_redemptions table
create table if not exists public.coupon_redemptions (
  id uuid default gen_random_uuid() primary key,
  coupon_id uuid references public.coupon_codes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  discount_amount numeric not null,
  redeemed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_coupon_organization unique(coupon_id, organization_id),
  constraint unique_coupon_user unique(coupon_id, user_id)
);

-- 3. Add Razorpay and subscription columns to subscriptions table
alter table public.subscriptions 
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_order_id text,
  add column if not exists coupon_id uuid references public.coupon_codes(id) on delete set null,
  add column if not exists discount_amount numeric default 0,
  add column if not exists current_period_start timestamp with time zone,
  add column if not exists current_period_end timestamp with time zone;

-- 4. Add Razorpay payment ID to payments table
alter table public.payments 
  add column if not exists razorpay_payment_id text;

-- 5. Seed coupons configuration
insert into public.coupon_codes (code, discount_type, discount_percent, max_redemptions, current_redemptions, active, annual_only) values
  ('AEGIRION100', 'percentage', 30, 100, 0, true, true),
  ('AEGRION20', 'percentage', 20, 1000, 0, true, false),
  ('WELCOME10', 'percentage', 10, 1000, 0, true, false)
on conflict (code) do update set
  discount_type = excluded.discount_type,
  discount_percent = excluded.discount_percent,
  max_redemptions = excluded.max_redemptions,
  active = excluded.active,
  annual_only = excluded.annual_only;

-- 6. Add atomic coupon redemption function with FOR UPDATE locking
create or replace function public.redeem_coupon_atomic(
  p_coupon_code text,
  p_user_id uuid,
  p_org_id uuid,
  p_discount_amount numeric
) returns jsonb as $$
declare
  v_coupon record;
  v_redemption_id uuid;
begin
  select * into v_coupon 
  from public.coupon_codes 
  where code = p_coupon_code and active = true 
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Coupon not found or inactive');
  end if;

  if v_coupon.valid_from is not null and now() < v_coupon.valid_from then
    return jsonb_build_object('success', false, 'error', 'Coupon is not valid yet');
  end if;

  if v_coupon.valid_until is not null and now() > v_coupon.valid_until then
    return jsonb_build_object('success', false, 'error', 'Coupon has expired');
  end if;

  if v_coupon.max_redemptions is not null and v_coupon.current_redemptions >= v_coupon.max_redemptions then
    return jsonb_build_object('success', false, 'error', 'Founding offer fully claimed');
  end if;

  if exists (
    select 1 from public.coupon_redemptions 
    where coupon_id = v_coupon.id and organization_id = p_org_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Coupon already redeemed by this customer');
  end if;

  if exists (
    select 1 from public.coupon_redemptions 
    where coupon_id = v_coupon.id and user_id = p_user_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Coupon already redeemed by this customer');
  end if;

  insert into public.coupon_redemptions (
    coupon_id, user_id, organization_id, discount_amount, redeemed_at
  ) values (
    v_coupon.id, p_user_id, p_org_id, p_discount_amount
  ) returning id into v_redemption_id;

  update public.coupon_codes 
  set current_redemptions = current_redemptions + 1,
      updated_at = now()
  where id = v_coupon.id;

  return jsonb_build_object(
    'success', true, 
    'redemption_id', v_redemption_id, 
    'coupon_id', v_coupon.id,
    'discount_percent', v_coupon.discount_percent
  );
end;
$$ language plpgsql security definer;
```

---

## 2. Configuration Parameters

Configure your secrets in the **Supabase Dashboard** or via the **Supabase CLI**:

### Backend Secrets (Edge Function)
Set the following secrets in your Supabase project (never expose these to public repositories or frontend JS):
```bash
supabase secrets set RAZORPAY_KEY_ID="your_razorpay_key_id"
supabase secrets set RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
supabase secrets set RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_phrase"
```

### Frontend Environment
Add the public Key ID to your frontend `.env` file:
```env
VITE_RAZORPAY_KEY_ID="your_razorpay_key_id"
```

---

## 3. Webhook Configuration in Razorpay Dashboard

1. Navigate to the **Razorpay Dashboard** $\rightarrow$ **Settings** $\rightarrow$ **Webhooks**.
2. Add a new Webhook URL:
   `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/checkout/webhook`
3. Enter the Webhook Secret (matching `RAZORPAY_WEBHOOK_SECRET` set in Supabase).
4. Select the following event triggers:
   - `subscription.charged`
   - `subscription.cancelled`
   - `payment.captured`

---

## 4. Verification & Testing Playbook

### Scenario A: Applying the Founding Customer Offer (`AEGIRION100`)
1. Go to the portal dashboard and click **Upgrade Plan** to open `billing.html`.
2. Toggle the Billing Cycle to **Yearly** (20% off).
3. Type `AEGIRION100` in the Coupon Code box and click **Apply**.
4. Verify that:
   - 30% discount is applied correctly to the subtotal.
   - The Claimed Counter banner updates successfully.
5. Toggle the cycle back to **Monthly** and verify that applying `AEGIRION100` triggers a validation error: *"Coupon AEGIRION100 is only valid on annual subscriptions."*

### Scenario B: Payment Success Flow
1. Select the **Professional** plan and apply a valid coupon.
2. Click **Complete Payment & Upgrade**.
3. Verify that the Razorpay Checkout overlay opens in **Test Mode**.
4. Use a test card/UPI option to simulate a successful payment.
5. On success:
   - The checkout overlay closes.
   - Verification triggers server-side.
   - The page displays *"Payment verified successfully!"*.
   - A PDF invoice auto-downloads containing Razorpay transaction metrics.
   - You are redirected back to the dashboard, and your account plan upgrades.

---

## 5. Security & Isolation Checklists
- **No Private Key Leakage**: `RAZORPAY_KEY_SECRET` is strictly verified as accessible only within server-side Edge Functions.
- **Race Condition Protection**: Multi-tenant concurrent redemptions of `AEGIRION100` are serialized atomically using the PostgreSQL row-level lock clause `FOR UPDATE`.
- **Tenant Isolation**: Row-level security (RLS) is active on the `coupon_redemptions` table, ensuring users cannot view other customers' redemption histories.
