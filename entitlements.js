// Aegrion Centralized Entitlement & Access Control Engine
// Server-timestamp authoritative calculation

export const PLAN_RANKS = {
  'FREE TRIAL': 0,
  'TRIAL EXPIRED': 0,
  'STARTER': 1,
  'PROFESSIONAL': 2,
  'ENTERPRISE': 3
};

/**
 * Normalizes and determines the numeric rank of a plan tier.
 */
export function getPlanRank(planName) {
  if (!planName) return 0;
  const upper = planName.toString().toUpperCase().trim();
  if (upper.includes('ENTERPRISE')) return 3;
  if (upper.includes('PROFESSIONAL')) return 2;
  if (upper.includes('STARTER')) return 1;
  return 0;
}

/**
 * Validates whether the authenticated user is permitted to purchase/upgrade to a target plan.
 * Rules:
 * 1. User cannot purchase the SAME plan if it is already active.
 * 2. User cannot DOWNGRADE an active paid plan.
 * 3. User can only UPGRADE to a higher plan (or purchase any plan if in Trial/Expired).
 */
export function canPurchasePlan(targetPlanName, profile, user) {
  const currentSub = getCurrentSubscription(profile, user);
  const currentRank = (currentSub.isPaid || currentSub.isPromoActive) ? getPlanRank(currentSub.planName || currentSub.plan) : 0;
  const targetRank = getPlanRank(targetPlanName);

  // If user has an active paid or promotional plan
  if (currentRank > 0) {
    if (targetRank === currentRank) {
      return {
        allowed: false,
        reason: 'same_plan',
        currentPlan: currentSub.planName || currentSub.plan,
        message: `You are already subscribed to the ${currentSub.planName || currentSub.plan} plan.`
      };
    }

    if (targetRank < currentRank) {
      return {
        allowed: false,
        reason: 'downgrade',
        currentPlan: currentSub.planName || currentSub.plan,
        message: `Downgrading from ${currentSub.planName || currentSub.plan} is unavailable. You can only upgrade to a higher plan.`
      };
    }

    return {
      allowed: true,
      isUpgrade: true,
      currentPlan: currentSub.planName || currentSub.plan,
      message: `Upgrade from ${currentSub.planName || currentSub.plan} to ${targetPlanName}`
    };
  }

  // Free trial or expired users can purchase any plan
  return {
    allowed: true,
    isUpgrade: false,
    currentPlan: currentSub.planName || currentSub.plan,
    message: `Purchase ${targetPlanName}`
  };
}

/**
 * Determines the minimum required plan tier for a specific feature.
 */
export function getRequiredPlanForFeature(featureName) {
  const key = (featureName || '').toLowerCase().replace(/[-_ ]/g, '');
  if (['complianceexport', 'complianceaudits', 'sso', 'ssosaml', 'socsupport', '247soc', 'enterpriseworkspacepro', 'createnewworkspaces', 'createapitokens'].includes(key)) {
    return 'Enterprise';
  }
  if (['cloudsecurity', 'copilotai', 'aiassistant', 'copilot', 'advancedscanning', 'realscanning', 'threatmonitoring', 'unlimitedactivemonitoring', 'productionmonitoringdeployments', 'unlimitedreportsexport', 'vulnerabilityautoresolution', 'compliance'].includes(key)) {
    return 'Professional';
  }
  return 'Starter';
}

/**
 * Authoritatively calculates entitlement status for any user account.
 * Follows strict access-control hierarchy:
 * 1. Active Corporate Paid Plan (Starter, Enterprise, Standard Professional) -> Full Access GRANTED
 * 2. Active Professional Promotional Plan (₹5 for 3 months / 90 days) -> Full Professional Access GRANTED
 * 3. Active 14-Day Free Trial (calculated from account creation timestamp) -> Trial Access GRANTED
 * 4. Expired / Inactive -> Premium Features LOCKED (Free/basic dashboard features remain accessible)
 */
export function calculateEntitlement(profile, user) {
  if (!profile && !user) {
    return {
      isPaid: false,
      isPromoActive: false,
      isTrialActive: false,
      isExpired: true,
      daysRemaining: 0,
      plan: 'Trial Expired',
      accessGranted: false,
      statusMessage: 'Trial Expired'
    };
  }

  const rawPlan = (profile?.plan || user?.user_metadata?.plan || '').trim();
  const upperPlan = rawPlan.toUpperCase();
  const nowMs = Date.now();

  // 1. Check if user has an active Starter or Enterprise corporate subscription
  if (upperPlan === 'STARTER' || upperPlan === 'ENTERPRISE') {
    return {
      isPaid: true,
      isPromoActive: false,
      isTrialActive: false,
      isExpired: false,
      daysRemaining: 0,
      plan: profile?.plan || rawPlan,
      accessGranted: true,
      statusMessage: `${profile?.plan || rawPlan} Plan Active`
    };
  }

  // 2. Check Professional Plan (supports both standard subscription and ₹5 for 3 Months Promotional Plan)
  if (upperPlan === 'PROFESSIONAL' || profile?.promotion === '3_month_5_rupees') {
    // Check if this is a timed promotional plan (3 months / 90 days)
    const hasPromoDates = profile?.promotion_end || profile?.promotion_start || profile?.promotion === '3_month_5_rupees';
    
    if (hasPromoDates) {
      const promoStartMs = profile?.promotion_start 
        ? new Date(profile.promotion_start).getTime() 
        : (profile?.created_at ? new Date(profile.created_at).getTime() : nowMs);

      // Promotional duration: exactly 3 months / 90 days
      const defaultPromoEndMs = promoStartMs + (90 * 24 * 60 * 60 * 1000);
      const promoEndMs = profile?.promotion_end ? new Date(profile.promotion_end).getTime() : defaultPromoEndMs;

      const msRemaining = promoEndMs - nowMs;
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      const isPromoActive = msRemaining > 0;

      if (isPromoActive) {
        return {
          isPaid: true,
          isPromo: true,
          isPromoActive: true,
          isTrialActive: false,
          isExpired: false,
          daysRemaining: daysRemaining,
          plan: 'Professional',
          promotion: '3_month_5_rupees',
          accessGranted: true,
          promotionStart: new Date(promoStartMs).toISOString(),
          promotionEnd: new Date(promoEndMs).toISOString(),
          statusMessage: `Professional Plan Active (${daysRemaining} Days Remaining - ₹5 Promo)`
        };
      } else {
        return {
          isPaid: false,
          isPromo: true,
          isPromoActive: false,
          isTrialActive: false,
          isExpired: true,
          daysRemaining: 0,
          plan: 'Professional Promo Expired',
          promotion: '3_month_5_rupees',
          accessGranted: false,
          promotionStart: new Date(promoStartMs).toISOString(),
          promotionEnd: new Date(promoEndMs).toISOString(),
          statusMessage: 'Professional Promotional Period Ended'
        };
      }
    } else {
      // Standard active corporate Professional plan
      return {
        isPaid: true,
        isPromoActive: false,
        isTrialActive: false,
        isExpired: false,
        daysRemaining: 0,
        plan: 'Professional',
        accessGranted: true,
        statusMessage: 'Professional Plan Active'
      };
    }
  }

  // 3. 14-Day Free Trial calculation based on authoritative account creation timestamp
  const accountCreatedAt = profile?.trial_start || profile?.created_at || user?.created_at || new Date().toISOString();
  const createdMs = new Date(accountCreatedAt).getTime();

  // Expiration is exactly 14 days after account creation timestamp
  const defaultTrialEndMs = createdMs + (14 * 24 * 60 * 60 * 1000);
  const trialEndMs = profile?.trial_end ? new Date(profile.trial_end).getTime() : defaultTrialEndMs;

  const msRemaining = trialEndMs - nowMs;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const isTrialActive = msRemaining > 0;

  return {
    isPaid: false,
    isPromoActive: false,
    isTrialActive: isTrialActive,
    isExpired: !isTrialActive,
    daysRemaining: daysRemaining,
    plan: isTrialActive ? 'Free Trial' : 'Trial Expired',
    accessGranted: isTrialActive,
    trialStart: new Date(createdMs).toISOString(),
    trialEnd: new Date(trialEndMs).toISOString(),
    statusMessage: isTrialActive ? `${daysRemaining} Days Remaining` : 'Trial Expired'
  };
}

/**
 * Authoritative single source of truth for user subscription & feature access.
 */
export function getCurrentSubscription(profile, user) {
  const ent = calculateEntitlement(profile, user);
  const rawPlan = (ent.plan || '').toLowerCase();
  const isEnterprise = ent.isPaid && rawPlan.includes('enterprise');
  const isProfessional = (ent.isPaid || ent.isPromoActive) && rawPlan.includes('professional');
  const isStarter = ent.isPaid && rawPlan.includes('starter');
  const isTrial = ent.isTrialActive;
  const isExpired = ent.isExpired;

  // Single centralized feature-access state
  const features = {
    cloudSecurity: isEnterprise || isProfessional || isTrial,
    continuousMonitoring: isEnterprise || isProfessional,
    realScanning: isEnterprise || isProfessional || isTrial,
    compliance: isEnterprise || isProfessional || isTrial,
    complianceExport: isEnterprise,
    copilot: isEnterprise || isProfessional || isTrial,
    copilotAI: isEnterprise || isProfessional || isTrial,
    support: true,
    premiumSupport: isEnterprise || isProfessional,
    reports: true,
    unlimitedReports: isEnterprise || isProfessional,
    sso: isEnterprise,
    assetsLimit: isEnterprise ? Infinity : (isProfessional ? 50 : 5)
  };

  // If expired, locked premium features turn false
  if (isExpired) {
    features.cloudSecurity = false;
    features.continuousMonitoring = false;
    features.realScanning = false;
    features.compliance = false;
    features.complianceExport = false;
    features.copilot = false;
    features.copilotAI = false;
    features.premiumSupport = false;
    features.unlimitedReports = false;
    features.sso = false;
    features.assetsLimit = 0;
  }

  let normalizedPlan = 'starter';
  if (isEnterprise) normalizedPlan = 'enterprise';
  else if (isProfessional) normalizedPlan = 'professional';
  else if (isStarter) normalizedPlan = 'starter';
  else if (isTrial) normalizedPlan = 'trial';
  else if (isExpired) normalizedPlan = 'expired';

  let normalizedStatus = 'trial';
  if (ent.isPaid || ent.isPromoActive) normalizedStatus = 'active';
  else if (ent.isExpired) normalizedStatus = 'expired';

  return {
    plan: normalizedPlan,
    planName: ent.plan,
    status: normalizedStatus,
    billing_status: (ent.isPaid || ent.isPromoActive) ? 'paid' : (isTrial ? 'trial' : 'unpaid'),
    isPaid: ent.isPaid,
    isPromo: ent.isPromo || false,
    isPromoActive: ent.isPromoActive || false,
    isTrialActive: ent.isTrialActive,
    isExpired: ent.isExpired,
    daysRemaining: ent.daysRemaining,
    startedAt: ent.promotionStart || ent.trialStart || null,
    expiresAt: ent.promotionEnd || ent.trialEnd || null,
    startDate: ent.promotionStart || ent.trialStart || null,
    endDate: ent.promotionEnd || ent.trialEnd || null,
    paymentId: profile?.payment_id || null,
    accessGranted: ent.accessGranted,
    statusMessage: ent.statusMessage,
    features: features
  };
}

/**
 * Access-control checker for specific feature names.
 */
export function hasFeature(featureName, profile, user) {
  const sub = getCurrentSubscription(profile, user);
  const key = (featureName || '').toLowerCase().replace(/[-_ ]/g, '');

  // Basic free/trial dashboard and standard pages are always accessible
  const basicFeatures = ['dashboard', 'assets', 'support', 'billing', 'settings', 'documentation', 'reports'];
  if (basicFeatures.includes(key)) {
    return true;
  }

  // Compliance page is accessible to all active accounts (trial, starter, professional, enterprise)
  if (key === 'compliance' || key === 'compliancemetrics') {
    return !sub.isExpired;
  }

  // Enterprise exclusive export / custom integrations
  if (['complianceexport', 'complianceaudits', 'sso', 'ssosaml', 'socsupport', '247soc', 'enterpriseworkspacepro', 'createnewworkspaces', 'createapitokens'].includes(key)) {
    return sub.features.complianceExport === true;
  }

  // Threat Monitoring
  if (['threatmonitoring', 'threats', 'threatalerts', 'threatlogs'].includes(key)) {
    return !sub.isExpired;
  }

  // Copilot AI
  if (['copilot', 'copilotai', 'aiassistant', 'aiassistantview'].includes(key)) {
    return sub.features.copilot === true;
  }

  // Cloud Security & Real Scanning
  if (['cloudsecurity', 'realscanning', 'advancedscanning', 'unlimitedactivemonitoring', 'productionmonitoringdeployments', 'vulnerabilityautoresolution'].includes(key)) {
    return sub.features.cloudSecurity === true;
  }

  return sub.accessGranted === true;
}

/**
 * Boolean helper to quickly check whether account has premium features access.
 */
export function hasPremiumAccess(profile, user) {
  const entitlement = calculateEntitlement(profile, user);
  return entitlement.accessGranted === true;
}

// Expose calculation to global window object
if (typeof window !== 'undefined') {
  window.PLAN_RANKS = PLAN_RANKS;
  window.getPlanRank = getPlanRank;
  window.canPurchasePlan = canPurchasePlan;
  window.getRequiredPlanForFeature = getRequiredPlanForFeature;
  window.calculateEntitlement = calculateEntitlement;
  window.getCurrentSubscription = getCurrentSubscription;
  window.hasFeature = hasFeature;
  window.hasPremiumAccess = hasPremiumAccess;
}
