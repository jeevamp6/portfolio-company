// Supabase Client Initialization & Authentication Helper (REVISED - COMPLETE ISOLATION & FAILSAFE)
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || "https://ioxzzyvtfkuwubvkeicn.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlveHp6eXZ0Zmt1d3VidmtlaWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTg0NTgsImV4cCI6MjEwMTM5NDQ1OH0._evXDgK1IY12_cl9MNs7F6f6TATfsEEvvmH_VLkwDa4";

// Cloudflare Turnstile Configuration
export const TURNSTILE_SITE_KEY = import.meta.env?.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAAFLYzHY5EUI7-4H6";

// Expose supabase client globally
export const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Dynamically loads the Cloudflare Turnstile script exactly once.
 */
export function loadTurnstileScript() {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          resolve(window.turnstile);
        }
      }, 50);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          resolve(window.turnstile);
        }
      }, 50);
    };
    script.onerror = (e) => reject(new Error("Failed to load Cloudflare Turnstile verification script."));
    document.head.appendChild(script);
  });
}

/**
 * Initializes a Turnstile widget into a specified container.
 */
export async function renderTurnstileWidget(containerEl, { action = 'login', onSuccess, onError, onExpire } = {}) {
  try {
    const turnstile = await loadTurnstileScript();
    if (!containerEl) return null;
    containerEl.innerHTML = '';
    const widgetId = turnstile.render(containerEl, {
      sitekey: TURNSTILE_SITE_KEY,
      action: action,
      theme: 'light',
      callback: (token) => {
        if (onSuccess) onSuccess(token);
      },
      'error-callback': () => {
        if (onError) onError();
      },
      'expired-callback': () => {
        if (onExpire) onExpire();
      }
    });
    return widgetId;
  } catch (err) {
    console.warn("Turnstile initialization notice:", err);
    return null;
  }
}

// Enterprise Floating Toast Notification Builder
export function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container') || (() => {
    const c = document.createElement('div');
    c.id = 'notification-container';
    c.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none';
    document.body.appendChild(c);
    return c;
  })();

  const alert = document.createElement('div');
  alert.className = `min-w-[320px] max-w-[400px] p-4 rounded-xl border bg-white shadow-lg pointer-events-auto transition-all duration-300 transform translate-x-12 opacity-0 flex items-start gap-3`;
  
  let icon = 'info';
  let iconColor = 'text-brandOrange';
  let borderColor = 'border-[#E9E9E9]';
  
  if (type === 'success') {
    icon = 'check-circle';
    iconColor = 'text-green-500';
    borderColor = 'border-green-100';
  } else if (type === 'error') {
    icon = 'alert-circle';
    iconColor = 'text-red-500';
    borderColor = 'border-red-100';
  } else if (type === 'warning') {
    icon = 'alert-triangle';
    iconColor = 'text-yellow-500';
    borderColor = 'border-yellow-100';
  }

  alert.className += ` ${borderColor}`;

  alert.innerHTML = `
    <div class="${iconColor} mt-0.5"><i data-lucide="${icon}" class="w-5 h-5"></i></div>
    <div class="flex-1">
      <div class="text-[10px] font-bold text-textPrimary uppercase tracking-widest">${type}</div>
      <div class="text-xs text-textSecondary font-semibold mt-0.5 leading-relaxed" id="notification-text-content">${message}</div>
    </div>
  `;
  
  container.appendChild(alert);
  if (window.lucide) window.lucide.createIcons();

  // Animate in
  requestAnimationFrame(() => {
    alert.classList.remove('translate-x-12', 'opacity-0');
  });

  // Auto-remove after 5s
  const removeTimer = setTimeout(() => {
    alert.classList.add('translate-x-12', 'opacity-0');
    setTimeout(() => alert.remove(), 300);
  }, 5000);

  // Allow clicking notification to dismiss instantly
  alert.addEventListener('click', () => {
    clearTimeout(removeTimer);
    alert.classList.add('translate-x-12', 'opacity-0');
    setTimeout(() => alert.remove(), 300);
  });
}

/**
 * Completely purges all local/session authentication state to avoid any cross-user session leakage.
 */
export function clearAuthCaches() {
  try {
    localStorage.removeItem('aegrion_auth_user');
    sessionStorage.clear();
    // Clear any Supabase local storage keys if present
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn("Aegrion Auth: Cache cleanup notice:", err);
  }
}

// Client-side Fail-Safe Workspace Provisioner (Scoped strictly to user.id)
export async function ensureUserProfileAndWorkspace(user, metadata = {}) {
  if (!user || !user.id) return null;

  try {
    // 1. Verify if profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      return existingProfile;
    }

    console.log("Aegrion Auth: User profile not found, initiating fail-safe client provisioning for user:", user.id);

    const userMeta = user.user_metadata || {};
    const emailStr = user.email || userMeta.email || '';
    const emailPrefix = emailStr ? emailStr.split('@')[0] : 'User';

    const rawFullName = metadata.full_name || userMeta.full_name || userMeta.name || '';
    const nameParts = rawFullName ? rawFullName.trim().split(/\s+/) : [];
    
    const firstName = metadata.first_name || userMeta.first_name || (nameParts.length > 0 ? nameParts[0] : emailPrefix);
    const lastName = metadata.last_name || userMeta.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
    const fullName = rawFullName || `${firstName} ${lastName}`.trim() || emailPrefix;
    const company = metadata.company || userMeta.company || `${firstName} Organization`;
    const country = metadata.country || userMeta.country || 'India';
    const avatarUrl = userMeta.avatar_url || userMeta.picture || '';

    // 2. Insert Organization
    let orgId = null;
    try {
      const { data: orgData, error: orgInsertError } = await supabase
        .from('organizations')
        .insert({
          name: `${company}`.endsWith('Organization') ? company : `${company} Organization`
        })
        .select()
        .single();

      if (!orgInsertError && orgData) {
        orgId = orgData.id;
      }
    } catch (orgErr) {
      console.warn("Aegrion Auth: Org insert error:", orgErr);
    }

    // 3. Insert Profile with independent 14-day trial based on user creation timestamp
    const accountCreatedAt = user.created_at ? new Date(user.created_at) : new Date();
    const trialEnd = new Date(accountCreatedAt.getTime() + (14 * 24 * 60 * 60 * 1000));

    const profileData = {
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      company: company,
      country: country,
      avatar_url: avatarUrl,
      role: 'user',
      status: 'active',
      plan: 'FREE TRIAL',
      trial_days: 14,
      organization: orgId,
      trial_start: accountCreatedAt.toISOString(),
      trial_end: trialEnd.toISOString(),
      provider: user.app_metadata?.provider || 'email',
      provider_id: user.id,
      created_at: accountCreatedAt.toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data: insertedProfile, error: profileInsertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .maybeSingle();

      if (profileInsertError) {
        console.warn("Aegrion Auth: Profile insert notice:", profileInsertError);
      } else if (insertedProfile) {
        return insertedProfile;
      }
    } catch (profErr) {
      console.warn("Aegrion Auth: Profile insert exception:", profErr);
    }

    // 4. Insert Workspace (trial_workspace) if organization exists
    if (orgId) {
      try {
        await supabase
          .from('trial_workspace')
          .insert({
            organization_id: orgId,
            name: `${company} Workspace`
          });
      } catch (wsErr) {
        console.warn("Aegrion Auth: Workspace insert notice:", wsErr);
      }
    }

    // 5. Insert User Settings
    try {
      await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          theme: 'light',
          notifications: true
        });
    } catch (setErr) {
      console.warn("Aegrion Auth: User settings insert notice:", setErr);
    }

    return profileData;

  } catch (err) {
    console.error("Aegrion Auth: Fail-safe provisioning error:", err);
    return null;
  }
}

// Environment Redirect Configurations
const baseAppUrl = import.meta.env.VITE_APP_URL || window.location.origin;

function resolveRedirectUrl(url, fallback) {
  const rawUrl = url || fallback;
  if (rawUrl.startsWith('http')) {
    return rawUrl.replace(/^https?:\/\/[^\/]+/, baseAppUrl);
  }
  return rawUrl.startsWith('/') ? `${baseAppUrl}${rawUrl}` : `${baseAppUrl}/${rawUrl}`;
}

export const LANDING_URL = resolveRedirectUrl(import.meta.env.VITE_LANDING_URL, 'index.html');
export const LOGIN_URL = resolveRedirectUrl(import.meta.env.VITE_LOGIN_URL, 'login.html');
export const DASHBOARD_URL = resolveRedirectUrl(import.meta.env.VITE_DASHBOARD_URL, 'app.html');

/**
 * Safely resolves session or waits for Supabase OAuth URL token exchange
 */
export async function getOrWaitForSession() {
  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;

    const hasAuthParams = window.location.hash.includes('access_token=') || 
                          window.location.hash.includes('error=') ||
                          window.location.search.includes('code=') ||
                          window.location.search.includes('error=');

    if (hasAuthParams) {
      return new Promise((resolve) => {
        const timeout = setTimeout(async () => {
          try {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            resolve(retrySession || null);
          } catch {
            resolve(null);
          }
        }, 3000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (newSession) {
            clearTimeout(timeout);
            subscription.unsubscribe();
            resolve(newSession);
          }
        });
      });
    }
  } catch (err) {
    console.warn("Aegrion Auth: Session resolution error:", err);
  }

  return null;
}

// Session Router Protection Checks
export async function checkRouteProtection() {
  if (!supabase) return;

  const session = await getOrWaitForSession();
  const path = window.location.pathname;

  const protectedRoutes = ['/app.html', '/app', '/settings.html', '/profile.html', '/reports.html', '/security.html', '/billing.html', '/billing', '/admin-billing.html', '/admin-billing'];
  const authRoutes = ['/login.html', '/login', '/register.html', '/register', '/forgot-password.html', '/reset-password.html'];

  const isProtected = protectedRoutes.some(r => path.endsWith(r) || path === r);
  const isAuth = authRoutes.some(r => path.endsWith(r) || path === r);

  if (isProtected) {
    if (!session) {
      window.location.href = LOGIN_URL;
    } else if (!session.user.email_confirmed_at && session.user.app_metadata?.provider === 'email') {
      // User logged in but email unverified (sign out and redirect to login)
      await supabase.auth.signOut();
      window.location.href = `${LOGIN_URL}?error=unverified`;
    }
  } else if (isAuth && session) {
    // If authenticated and email verified, bypass auth pages and redirect to dashboard
    if (session.user.email_confirmed_at || session.user.app_metadata?.provider !== 'email') {
      window.location.href = DASHBOARD_URL;
    }
  }
}

// Global Sign out utility: Purges session and local storage
export async function handleLogout() {
  if (supabase) {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn("Signout error:", err);
    }
  }
  clearAuthCaches();
  window.location.href = LOGIN_URL;
}

// Execute route protection on script import
checkRouteProtection();

