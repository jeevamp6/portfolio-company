-- =========================================================================
-- Aegrion Security - Database Schema Setup (REVISED - COMPLETE SAAS INTEGRATION)
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  full_name text,
  company text,
  country text,
  email text,
  avatar_url text,
  role text default 'user',
  status text default 'active',
  plan text default 'FREE TRIAL',
  trial_days integer default 14,
  organization uuid,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  provider text,
  provider_id text,
  phone text,
  gstin text,
  billing_address text,
  state text,
  city text,
  postal_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone
);

-- 2. Organizations Table
create table if not exists public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Link profiles.organization to organizations(id)
alter table public.profiles 
  drop constraint if exists profiles_organization_fkey,
  add constraint profiles_organization_fkey foreign key (organization) references public.organizations(id) on delete set null;

-- 3. Trial Workspace Table
create table if not exists public.trial_workspace (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. User Settings Table
create table if not exists public.user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  theme text default 'light' not null,
  notifications boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Plans Table
create table if not exists public.plans (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  price_monthly numeric not null,
  price_yearly numeric not null,
  features text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Coupon Codes Table
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

-- 6b. Coupon Redemptions Table
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

-- 7. Subscriptions Table
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  plan text default 'FREE TRIAL' not null,
  status text default 'ACTIVE' not null,
  billing_cycle text default 'monthly' not null,
  price numeric default 0 not null,
  trial_days integer default 14 not null,
  renewal_date timestamp with time zone,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  cancel_at_period_end boolean default false,
  auto_renew boolean default true,
  razorpay_customer_id text,
  razorpay_subscription_id text,
  razorpay_payment_id text,
  razorpay_order_id text,
  coupon_id uuid references public.coupon_codes(id) on delete set null,
  discount_amount numeric default 0,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Payments Table
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  plan text not null,
  billing_cycle text not null,
  amount numeric not null,
  currency text default 'USD' not null,
  tax numeric not null,
  discount numeric default 0,
  coupon text,
  payment_provider text default 'Razorpay' not null,
  payment_status text not null,
  transaction_id text,
  order_id text not null unique,
  invoice_id text,
  cashfree_order_id text,
  cashfree_payment_id text,
  razorpay_payment_id text,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8b. Payment Orders Table (Razorpay Order Lifecycle)
create table if not exists public.payment_orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  razorpay_signature text,
  plan text not null,
  amount numeric not null,
  currency text default 'INR' not null,
  status text default 'created' not null,
  receipt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  paid_at timestamp with time zone
);

-- 9. Invoices Table
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  invoice_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  plan_name text not null,
  amount numeric not null,
  currency text default 'USD' not null,
  tax numeric not null,
  total numeric not null,
  status text not null,
  payment_id text references public.payments(order_id) on delete set null,
  transaction_id text not null,
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Assets Table
create table if not exists public.assets (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  type text not null, -- server / endpoint / domain / ip
  ip_address text,
  domain text,
  tags text[] default array[]::text[],
  credentials jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Threats Table
create table if not exists public.threats (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  severity text not null, -- info / low / medium / high / critical
  status text default 'open' not null, -- open / investigating / closed
  description text not null,
  source text not null,
  asset_id uuid references public.assets(id) on delete set null,
  mitre_mapping text[] default array[]::text[],
  assigned_analyst uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Support Tickets Table
create table if not exists public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  ticket_number text not null unique,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  category text not null, -- Technical / Billing / Security / Bug Report / Feature Request
  priority text not null, -- low / medium / high / urgent
  description text not null,
  status text default 'open' not null, -- open / pending / resolved
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone
);

-- 13. Support Replies Table
create table if not exists public.support_replies (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. Device Tokens (FCM) Table
create table if not exists public.device_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_token text not null unique,
  platform text not null, -- browser / android / ios
  last_seen timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. AI Conversations Table
create table if not exists public.ai_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  messages jsonb[] default array[]::jsonb[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. Activity Logs (Audit Logs) Table
create table if not exists public.payment_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.trial_workspace enable row level security;
alter table public.user_settings enable row level security;
alter table public.plans enable row level security;
alter table public.coupon_codes enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.assets enable row level security;
alter table public.threats enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_replies enable row level security;
alter table public.device_tokens enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.payment_logs enable row level security;

-- Drop policies to avoid duplicates
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Anyone can view plans" on public.plans;
drop policy if exists "Anyone can view coupons" on public.coupon_codes;

-- RLS Select policies for profiles and tables
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Anyone can view plans" on public.plans
  for select using (true);

create policy "Anyone can view coupons" on public.coupon_codes
  for select using (true);

-- Table Policies: Assets RLS
create policy "Users can select their assets" on public.assets
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = assets.organization_id
    )
  );

create policy "Users can modify their assets" on public.assets
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = assets.organization_id
    )
  );

-- Table Policies: Threats RLS
create policy "Users can select their threats" on public.threats
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = threats.organization_id
    )
  );

create policy "Users can modify their threats" on public.threats
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = threats.organization_id
    )
  );

-- Table Policies: Tickets RLS
create policy "Users can select tickets" on public.support_tickets
  for select using (user_id = auth.uid() or exists (
    select 1 from public.profiles where profiles.id = auth.uid() and (profiles.role = 'super_admin' or profiles.role = 'support_admin')
  ));

create policy "Users can modify tickets" on public.support_tickets
  for all using (user_id = auth.uid() or exists (
    select 1 from public.profiles where profiles.id = auth.uid() and (profiles.role = 'super_admin' or profiles.role = 'support_admin')
  ));

-- Support replies policy
create policy "Replies policy select" on public.support_replies
  for select using (
    exists (
      select 1 from public.support_tickets
      where support_tickets.id = support_replies.ticket_id
      and (support_tickets.user_id = auth.uid() or exists (
        select 1 from public.profiles where profiles.id = auth.uid() and (profiles.role = 'super_admin' or profiles.role = 'support_admin')
      ))
    )
  );

create policy "Replies policy insert" on public.support_replies
  for insert with check (
    exists (
      select 1 from public.support_tickets
      where support_tickets.id = support_replies.ticket_id
      and (support_tickets.user_id = auth.uid() or exists (
        select 1 from public.profiles where profiles.id = auth.uid() and (profiles.role = 'super_admin' or profiles.role = 'support_admin')
      ))
    )
  );

-- Device tokens policy
create policy "Tokens policy" on public.device_tokens
  for all using (user_id = auth.uid());

-- AI Conversations RLS
create policy "Users can select conversations" on public.ai_conversations
  for select using (user_id = auth.uid());

create policy "Users can modify conversations" on public.ai_conversations
  for all using (user_id = auth.uid());

-- Table Policies: Billing
create policy "Billing subscriptions policy" on public.subscriptions
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = subscriptions.organization_id
    )
  );

create policy "Billing subscriptions modify" on public.subscriptions
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = subscriptions.organization_id
    )
  );

create policy "Billing payments policy" on public.payments
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = payments.organization_id
    )
  );

create policy "Billing payments modify" on public.payments
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = payments.organization_id
    )
  );

create policy "Billing invoices policy" on public.invoices
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = invoices.organization_id
    )
  );

create policy "Billing invoices modify" on public.invoices
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = invoices.organization_id
    )
  );

create policy "Audit logs policy" on public.payment_logs
  for all using (user_id = auth.uid());

-- Database Trigger for Auto-Provisioning on Sign Up (Email and OAuth)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  company_name text;
  full_name_val text;
  first_name_val text;
  last_name_val text;
  new_org_id uuid;
begin
  -- Extract values from user metadata
  first_name_val := coalesce(new.raw_user_meta_data->>'first_name', '');
  last_name_val := coalesce(new.raw_user_meta_data->>'last_name', '');
  
  full_name_val := coalesce(new.raw_user_meta_data->>'full_name', '');
  if trim(full_name_val) = '' then
    if trim(first_name_val || ' ' || last_name_val) <> '' then
      full_name_val := trim(first_name_val || ' ' || last_name_val);
    else
      full_name_val := split_part(new.email, '@', 1);
    end if;
  end if;

  if trim(first_name_val) = '' then
    first_name_val := split_part(full_name_val, ' ', 1);
  end if;
  if trim(last_name_val) = '' then
    last_name_val := split_part(full_name_val, ' ', 2);
  end if;

  company_name := coalesce(new.raw_user_meta_data->>'company', split_part(new.email, '@', 1) || ' Sandbox');

  -- 1. Insert Profile record
  insert into public.profiles (
    id, email, first_name, last_name, full_name, avatar_url, role, status, plan, trial_days, trial_start, trial_end, provider, provider_id, created_at, updated_at, last_login
  )
  values (
    new.id,
    new.email,
    first_name_val,
    last_name_val,
    full_name_val,
    new.raw_user_meta_data->>'avatar_url',
    'super_admin', -- Default to super_admin for development accessibility
    'active',
    'FREE TRIAL',
    14,
    now(),
    now() + interval '14 days',
    new.app_metadata->>'provider',
    new.id::text,
    now(),
    now(),
    now()
  );

  -- 2. Insert Organization
  insert into public.organizations (name, created_at)
  values (company_name || ' Organization', now())
  returning id into new_org_id;

  -- 3. Update Profile to link to the new Organization
  update public.profiles 
  set organization = new_org_id
  where id = new.id;

  -- 4. Insert Default Workspace (trial_workspace)
  insert into public.trial_workspace (organization_id, name, created_at)
  values (new_org_id, 'Default Workspace', now());

  -- 5. Insert User Settings (user_settings)
  insert into public.user_settings (user_id, theme, notifications, created_at, updated_at)
  values (new.id, 'light', true, now(), now());

  -- 6. Insert Default Active Free Subscription
  insert into public.subscriptions (organization_id, plan, status, billing_cycle, price, trial_days, start_date, end_date, created_at, updated_at)
  values (new_org_id, 'FREE TRIAL', 'ACTIVE', 'monthly', 0, 14, now(), now() + interval '14 days', now(), now());

  -- 7. Seed Default Assets
  insert into public.assets (organization_id, name, type, ip_address, domain, tags) values
    (new_org_id, 'production-vpc-db-1', 'server', '10.0.1.14', 'db-1.internal.aegrion.com', array['Production', 'Database']),
    (new_org_id, 'kubernetes-control-node', 'server', '10.0.1.25', 'k8s-node.internal.aegrion.com', array['Production', 'Kubernetes']),
    (new_org_id, 'aegrion-client-portal', 'domain', '13.233.15.42', 'portal.aegrion.com', array['Public', 'Frontend']);

  -- 8. Seed Default Threats
  insert into public.threats (organization_id, severity, status, description, source, asset_id, mitre_mapping) values
    (new_org_id, 'critical', 'open', 'Critical SQL Injection attempted on Database node', 'IP: 185.220.101.42', (select id from public.assets where name = 'production-vpc-db-1' limit 1), array['T1190', 'T1059.006']),
    (new_org_id, 'high', 'open', 'Suspicious credential access attempt via Kubernetes API', 'Internal Network', (select id from public.assets where name = 'kubernetes-control-node' limit 1), array['T1078', 'T1556']);

  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger on auth.users insert event
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert plans configuration details
insert into public.plans (name, price_monthly, price_yearly, features) values
  ('Starter', 29, 290, array['5 Cloud Assets', 'Weekly Port Scans', 'Basic Alerts']),
  ('Professional', 99, 990, array['50 Cloud Assets', 'Daily Port Scans', 'Email & Slack Alerts', 'Copilot AI Assistant']),
  ('Enterprise', 299, 2990, array['Unlimited Cloud Assets', 'Continuous Scanning', '24/7 SOC Support', 'SOC2 Compliance', 'Single Sign-On (SSO)'])
on conflict (name) do nothing;

-- Insert coupon code entries
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

-- 17. Newsletter Subscribers Table
create table if not exists public.newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'unsubscribed', 'pending', 'confirmed')),
  source text default 'website',
  unsubscribe_token text unique,
  confirmation_token text unique,
  subscribed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unsubscribed_at timestamp with time zone,
  last_email_sent_at timestamp with time zone
);

create index if not exists idx_newsletter_subscribers_email on public.newsletter_subscribers (email);
create index if not exists idx_newsletter_subscribers_token on public.newsletter_subscribers (unsubscribe_token);

alter table public.newsletter_subscribers enable row level security;

create policy "Public insert newsletter subscribers" on public.newsletter_subscribers
  for insert with check (true);

create policy "Public update newsletter subscribers" on public.newsletter_subscribers
  for update using (true) with check (true);

-- 18. Newsletter Campaigns Table
create table if not exists public.newsletter_campaigns (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  title text not null,
  content text not null,
  linkedin_url text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sent_at timestamp with time zone
);

alter table public.newsletter_campaigns enable row level security;

-- 19. Newsletter Deliveries Table
create table if not exists public.newsletter_deliveries (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references public.newsletter_campaigns(id) on delete cascade,
  subscriber_id uuid references public.newsletter_subscribers(id) on delete set null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_newsletter_deliveries_campaign on public.newsletter_deliveries (campaign_id);
create index if not exists idx_newsletter_deliveries_subscriber on public.newsletter_deliveries (subscriber_id);

alter table public.newsletter_deliveries enable row level security;

-- ==========================================
-- 20. Atomic Coupon Redemption Function
-- ==========================================
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
  -- 1. Lock the coupon row for update to prevent race conditions
  select * into v_coupon 
  from public.coupon_codes 
  where code = p_coupon_code and active = true 
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Coupon not found or inactive');
  end if;

  -- Check validity period
  if v_coupon.valid_from is not null and now() < v_coupon.valid_from then
    return jsonb_build_object('success', false, 'error', 'Coupon is not valid yet');
  end if;

  if v_coupon.valid_until is not null and now() > v_coupon.valid_until then
    return jsonb_build_object('success', false, 'error', 'Coupon has expired');
  end if;

  -- 2. Check redemption limits
  if v_coupon.max_redemptions is not null and v_coupon.current_redemptions >= v_coupon.max_redemptions then
    return jsonb_build_object('success', false, 'error', 'Founding offer fully claimed');
  end if;

  -- 3. Check if already redeemed by this organization
  if exists (
    select 1 from public.coupon_redemptions 
    where coupon_id = v_coupon.id and organization_id = p_org_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Coupon already redeemed by this customer');
  end if;

  -- 4. Check if already redeemed by this user
  if exists (
    select 1 from public.coupon_redemptions 
    where coupon_id = v_coupon.id and user_id = p_user_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Coupon already redeemed by this customer');
  end if;

  -- 5. Insert redemption
  insert into public.coupon_redemptions (
    coupon_id, user_id, organization_id, discount_amount, redeemed_at
  ) values (
    v_coupon.id, p_user_id, p_org_id, p_discount_amount
  ) returning id into v_redemption_id;

  -- 6. Update coupon current count
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

-- =========================================================================
-- 21. Webhook Receivers & Security Telemetry Events Tables & RLS Policies
-- =========================================================================

-- Webhook Receivers Table
create table if not exists public.webhook_receivers (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  description text,
  source_type text default 'custom_webhook' not null,
  auth_method text default 'hmac_sha256' not null,
  secret_hash text,
  secret_token text,
  secret_preview text,
  status text default 'active' not null check (status in ('active', 'disabled')),
  event_count integer default 0 not null,
  last_received_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_webhook_receivers_org on public.webhook_receivers (organization_id);
create index if not exists idx_webhook_receivers_status on public.webhook_receivers (status);

-- Security Events Table
create table if not exists public.security_events (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  receiver_id uuid references public.webhook_receivers(id) on delete set null,
  external_event_id text,
  event_type text default 'security_event' not null,
  severity text default 'medium' not null check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  source text default 'custom-webhook' not null,
  source_ip text,
  asset_id text,
  title text not null,
  description text,
  raw_payload jsonb default '{}'::jsonb,
  occurred_at timestamp with time zone default timezone('utc'::text, now()),
  received_at timestamp with time zone default timezone('utc'::text, now()),
  status text default 'open' not null check (status in ('open', 'investigating', 'closed', 'resolved')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Idempotency Unique Constraint
create unique index if not exists idx_security_events_idempotency 
  on public.security_events (organization_id, receiver_id, external_event_id) 
  where external_event_id is not null;

create index if not exists idx_security_events_org on public.security_events (organization_id);
create index if not exists idx_security_events_received on public.security_events (received_at desc);
create index if not exists idx_security_events_severity on public.security_events (severity);

-- Enable RLS
alter table public.webhook_receivers enable row level security;
alter table public.security_events enable row level security;

-- Webhook Receivers RLS Policies
drop policy if exists "Users can view their organization webhook receivers" on public.webhook_receivers;
create policy "Users can view their organization webhook receivers" on public.webhook_receivers
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = webhook_receivers.organization_id
    )
    or
    exists (
      select 1 from public.organization_members
      where organization_members.user_id = auth.uid()
      and organization_members.organization_id = webhook_receivers.organization_id
    )
  );

drop policy if exists "Users can create webhook receivers for their organization" on public.webhook_receivers;
create policy "Users can create webhook receivers for their organization" on public.webhook_receivers
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = webhook_receivers.organization_id
    )
    or
    exists (
      select 1 from public.organization_members
      where organization_members.user_id = auth.uid()
      and organization_members.organization_id = webhook_receivers.organization_id
    )
  );

drop policy if exists "Users can update their organization webhook receivers" on public.webhook_receivers;
create policy "Users can update their organization webhook receivers" on public.webhook_receivers
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = webhook_receivers.organization_id
    )
    or
    exists (
      select 1 from public.organization_members
      where organization_members.user_id = auth.uid()
      and organization_members.organization_id = webhook_receivers.organization_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = webhook_receivers.organization_id
    )
    or
    exists (
      select 1 from public.organization_members
      where organization_members.user_id = auth.uid()
      and organization_members.organization_id = webhook_receivers.organization_id
    )
  );

drop policy if exists "Users can delete their organization webhook receivers" on public.webhook_receivers;
create policy "Users can delete their organization webhook receivers" on public.webhook_receivers
  for delete to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = webhook_receivers.organization_id
    )
    or
    exists (
      select 1 from public.organization_members
      where organization_members.user_id = auth.uid()
      and organization_members.organization_id = webhook_receivers.organization_id
    )
  );

-- Security Events RLS Policies
drop policy if exists "Users can view their organization security events" on public.security_events;
create policy "Users can view their organization security events" on public.security_events
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = security_events.organization_id
    )
    or
    exists (
      select 1 from public.organization_members
      where organization_members.user_id = auth.uid()
      and organization_members.organization_id = security_events.organization_id
    )
  );

drop policy if exists "Users can modify their organization security events" on public.security_events;
create policy "Users can modify their organization security events" on public.security_events
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.organization = security_events.organization_id
    )
    or
    exists (
      select 1 from public.organization_members
      where organization_members.user_id = auth.uid()
      and organization_members.organization_id = security_events.organization_id
    )
  );



