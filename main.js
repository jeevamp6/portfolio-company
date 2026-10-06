/* Aegrion Security Premium Frontend Animations & Interactions Engine */
import Lenis from 'lenis';
import { LOGIN_URL } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
  // Bind all login links to environment variables
  initLoginRedirects();

  // Initialize Premium Preloader
  initPreloader();

  // Initialize Premium CTA Mouse Parallax
  initPremiumCtaParallax();

  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 1. Initialize Lenis Smooth Scrolling
  const lenis = initSmoothScroll();

  // 2. Dynamic Aurora Background Canvas
  initAuroraCanvas();

  // 3. Navigation Header & Active Highlight Observers
  initNavigation();

  // 4. Mouse Glow Card Effect
  initMouseGlow();

  // 5. Interactive Solutions Switcher
  initSolutions();

  // 6. Viewport Scroll Transitions (Trigger Once, Staggered Cards)
  initScrollAnimations();

  // 6b. Interactive Journey Roadmap Timeline
  initRoadmapInteractiveTimeline();

  // 7. Careers Modal & Applications
  initCareersModal();

  // Cookie Consent System
  initCookieConsent();

  // 8. Contact & Newsletter Form Submissions
  initContactForm();

  window.lenisInstance = lenis;
});

/* ==========================================
   1. Lenis Smooth Scrolling Initialization
   ========================================== */
function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Vercel-like smooth curve
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    infinite: false,
  });

  // RAF loop
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Bind navigation links to Lenis scrollTo (700-900ms)
  const navScrollLinks = document.querySelectorAll('#nav-menu a, .nav-cta a, .hero-actions a');
  navScrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetHash = link.getAttribute('href');
      if (targetHash && targetHash.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(targetHash);
        if (targetElement) {
          lenis.scrollTo(targetElement, {
            duration: 0.8, // 800ms transition
            offset: -80,   // offset sticky header
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        }
      }
    });
  });

  return lenis;
}

/* ==========================================
   2. Canvas Mesh / Aurora Animation
   ========================================== */
function initAuroraCanvas() {
  const canvas = document.getElementById('aurora-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const particles = [];
  const particleCount = Math.min(50, Math.floor((width * height) / 30000));
  const connectionDistance = 150;
  let mouse = { x: null, y: null, radius: 180 };

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.radius = Math.random() * 2 + 1;
      this.opacity = Math.random() * 0.4 + 0.1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x += (dx / dist) * force * 0.6;
          this.y += (dy / dist) * force * 0.6;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(91, 140, 255, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    const time = Date.now() * 0.0002;
    const g1x = width * 0.25 + Math.sin(time) * 80;
    const g1y = height * 0.35 + Math.cos(time * 0.8) * 80;
    const g2x = width * 0.75 + Math.cos(time * 0.7) * 100;
    const g2y = height * 0.65 + Math.sin(time * 0.9) * 100;

    let radGrad1 = ctx.createRadialGradient(g1x, g1y, 10, g1x, g1y, Math.min(width, height) * 0.6);
    radGrad1.addColorStop(0, 'rgba(91, 140, 255, 0.05)');
    radGrad1.addColorStop(0.5, 'rgba(124, 92, 255, 0.01)');
    radGrad1.addColorStop(1, 'rgba(5, 8, 22, 0)');
    ctx.fillStyle = radGrad1;
    ctx.fillRect(0, 0, width, height);

    let radGrad2 = ctx.createRadialGradient(g2x, g2y, 10, g2x, g2y, Math.min(width, height) * 0.5);
    radGrad2.addColorStop(0, 'rgba(0, 212, 255, 0.04)');
    radGrad2.addColorStop(1, 'rgba(5, 8, 22, 0)');
    ctx.fillStyle = radGrad2;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < connectionDistance) {
          const alpha = (1 - dist / connectionDistance) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(91, 140, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================
   3. Header Sticky State & Active Link Observer
   ========================================== */
function initNavigation() {
  const header = document.getElementById('main-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('#nav-menu a');
  const animatedSections = document.querySelectorAll('.animate-section');

  // Sticky header class
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  // Active section link highlighting observer
  const activeLinkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeSectionId = entry.target.getAttribute('id');
        if (activeSectionId) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeSectionId}`) {
              link.classList.add('active');
            }
          });
        }
      }
    });
  }, {
    root: null,
    threshold: 0.3, // Trigger when 30% of the section is in view
    rootMargin: '-80px 0px -40% 0px' // adjust for nav bar and viewport overlap
  });

  animatedSections.forEach(section => activeLinkObserver.observe(section));
}

/* ==========================================
   4. Mouse Glow Spotlight Effect
   ========================================== */
function initMouseGlow() {
  const grids = document.querySelectorAll('.hover-glow-grid');
  
  grids.forEach(grid => {
    grid.addEventListener('mousemove', (e) => {
      const cards = grid.querySelectorAll('.hover-glow');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  });
}

/* ==========================================
   5. Interactive Solutions Switcher
   ========================================== */
const solutionsData = {
  startups: {
    badge: "FLEXIBLE SCALING",
    title: "Startups & Emerging Teams",
    desc: "Fast-moving startups need automated compliance frameworks and frictionless integration. Aegrion secures your deployment pipelines, ensuring fast, audit-ready configurations without affecting team agility.",
    features: [
      "Continuous automated SOC 2 readiness checkpoints",
      "Perimeter cloud mapping and automated threat isolation",
      "Lightweight DevSecOps integrations for GitHub/GitLab builds"
    ]
  },
  smbs: {
    badge: "MANAGED THREAT DEFENSE",
    title: "Small & Mid-sized Businesses",
    desc: "Growth companies require solid threat monitoring without the expense of an internal SOC. Aegrion provides a managed team checking logs and endpoints around the clock, keeping you safe from ransomware.",
    features: [
      "24/7 Managed Endpoint Detection and Response (EDR)",
      "Vulnerability checks and external configuration reviews",
      "Affordable plans backed by specialized cybersecurity experts"
    ]
  },
  enterprises: {
    badge: "HYBRID ZERO TRUST",
    title: "Large Enterprises",
    desc: "Large networks require deep microsegmentation, detailed access logs, and integration with SIEM architectures. Aegrion delivers custom cloud security configurations matching global structural needs.",
    features: [
      "Custom multi-cloud Zero Trust network segregation architectures",
      "High-performance security operations centers with custom SLA agreements",
      "Dedicated incident response teams prepared for instant breach mitigation"
    ]
  },
  healthcare: {
    badge: "HIPAA COMPLIANCE",
    title: "Healthcare Verticals",
    desc: "Keeping medical logs secure requires strict isolation, verified endpoints, and encryption tools. Aegrion audits record storage and cloud interfaces, checking systems against HIPAA policies.",
    features: [
      "Rigid end-to-end data encryption verification at rest and transit",
      "Strict identity assurance flows and session monitoring tools",
      "Detailed compliance reporting ready for external auditing boards"
    ]
  },
  finance: {
    badge: "PCI-DSS AUDITING",
    title: "Financial Institutions",
    desc: "Securing financial transactional APIs requires low-latency threat analysis and continuous security scanning. Aegrion seals database backends and validates access parameters.",
    features: [
      "Real-time API protection and anomaly detection engines",
      "Continuous PCI-DSS posture checking and validation reports",
      "Redundant system architecture reviews protecting critical ledger paths"
    ]
  },
  education: {
    badge: "DATA RESILIENCE",
    title: "Educational Sectors",
    desc: "Colleges and universities hold vast student directories and intellectual research files. Aegrion shields these portals from unauthorized access attempts.",
    features: [
      "Campus network perimeter audits and guest segmentation",
      "Shielding database stores containing research intellectual property",
      "Phishing simulation courses tailored for institutional administrators"
    ]
  },
  retail: {
    badge: "PAYMENT SEGMENTATION",
    title: "E-Commerce & Retail",
    desc: "Securing shopping checkouts against database injection techniques is crucial. Aegrion assesses code structures, keeping consumer transactions clean.",
    features: [
      "Cross-site scripting (XSS) and SQL injection vulnerability audits",
      "Hardening payment pipelines against checkout integration leaks",
      "Continuous web application scanning for e-commerce backends"
    ]
  },
  manufacturing: {
    badge: "OPERATIONAL INTEGRITY",
    title: "Industrial & Manufacturing",
    desc: "Protecting OT (Operational Technology) networks from web-connected setups is vital. Aegrion establishes boundaries, keeping production paths clean.",
    features: [
      "Isolating corporate domains from industrial control operations",
      "Securing IoT sensor nodes against network intrusion attempts",
      "Custom breach alert playbooks tailored for assembly architectures"
    ]
  },
  government: {
    badge: "HARDENED ASSURANCES",
    title: "Government Infrastructures",
    desc: "Hardening governmental platforms requires meticulous access checks and system redundancy. Aegrion constructs architectures matching high federal parameters.",
    features: [
      "Constructing isolated cloud setups matching federal guidelines",
      "Deploying deep Multi-Factor Authentication (MFA) parameters",
      "Meticulous audit logs detailing system state modifications"
    ]
  },
  technology: {
    badge: "DEVSECOPS PIPELINES",
    title: "Technology Providers",
    desc: "SaaS platforms need continuous image reviews and secure database connections. Aegrion integrates code checks, keeping customer records clean.",
    features: [
      "Automated Docker/Kubernetes container image vulnerability scanning",
      "Auditing API authorization controls and tenant isolation lines",
      "Integration of code checking loops directly into CI/CD pipelines"
    ]
  }
};

function initSolutions() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const subtabBtns = document.querySelectorAll('.subtab-btn');
  const filterGroups = document.querySelectorAll('.filter-group');
  
  const solBadge = document.getElementById('sol-type-badge');
  const solTitle = document.getElementById('sol-display-title');
  const solDesc = document.getElementById('sol-display-desc');
  const solList = document.getElementById('sol-display-list');

  // Tab group switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.getAttribute('data-target');
      filterGroups.forEach(g => {
        g.classList.remove('active');
        if (g.id === target) {
          g.classList.add('active');
          const firstSub = g.querySelector('.subtab-btn');
          if (firstSub) firstSub.click();
        }
      });
    });
  });

  // Subtab option selection
  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const activeGroup = btn.closest('.filter-group');
      activeGroup.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const solKey = btn.getAttribute('data-solution');
      updateSolutionDetailCard(solKey);
    });
  });

  function updateSolutionDetailCard(key) {
    const data = solutionsData[key];
    if (!data) return;

    const card = document.getElementById('solution-display-card');
    card.style.opacity = 0.5;
    card.style.transform = 'translateY(5px)';

    setTimeout(() => {
      solBadge.innerText = data.badge;
      solTitle.innerText = data.title;
      solDesc.innerText = data.desc;

      solList.innerHTML = '';
      data.features.forEach(feat => {
        const li = document.createElement('li');
        li.innerHTML = `<i data-lucide="check-circle" class="success-icon"></i> ${feat}`;
        solList.appendChild(li);
      });

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }

      card.style.opacity = 1;
      card.style.transform = 'translateY(0)';
    }, 200);
  }

  // Search services filter
  const searchInput = document.getElementById('service-search-input');
  const serviceCards = document.querySelectorAll('.service-card');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      serviceCards.forEach(card => {
        const keywords = card.getAttribute('data-keywords') || '';
        const title = card.querySelector('h3').innerText.toLowerCase();
        const desc = card.querySelector('p').innerText.toLowerCase();

        if (keywords.includes(query) || title.includes(query) || desc.includes(query)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
}

/* ==========================================
   6. Viewport Scroll Transitions (IntersectionObserver)
   ========================================== */
function initScrollAnimations() {
  const sections = document.querySelectorAll('.animate-section');

  const sectionObserverOptions = {
    root: null,
    threshold: 0.25, // Trigger animation once 25% of section enters viewport
    rootMargin: '0px'
  };

  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const section = entry.target;
        section.classList.add('visible');

        // Locate cards/items to stagger within this section
        const staggerItems = section.querySelectorAll(
          '.update-card, .why-card, .cap-card, .service-card, .ind-card, .resource-card, .career-card'
        );

        staggerItems.forEach((item, index) => {
          item.classList.add('stagger-item');
          // Apply stagger delay dynamically (0.08s intervals)
          item.style.transitionDelay = `${index * 0.08}s`;
        });

        // Trigger only once: stop observing this section
        observer.unobserve(section);
      }
    });
  }, sectionObserverOptions);

  sections.forEach(section => sectionObserver.observe(section));

  // Interactive timeline step highlights on scroll
  const steps = document.querySelectorAll('.work-step');
  const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        steps.forEach(s => s.classList.remove('active'));
        entry.target.classList.add('active');
      }
    });
  }, {
    root: null,
    threshold: 0.5,
    rootMargin: "-20% 0px -40% 0px"
  });

  steps.forEach(step => stepObserver.observe(step));
}

/* ==========================================
   6b. Interactive Journey Roadmap Timeline
   ========================================== */
function initRoadmapInteractiveTimeline() {
  const nodes = document.querySelectorAll('.roadmap-node-item');
  const progressLine = document.getElementById('roadmap-progress-line');
  if (!nodes.length) return;

  const roadmapObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        entry.target.classList.add('is-active');
      }
    });

    // Calculate highest active milestone to fill progress line
    let maxMilestone = 1;
    nodes.forEach(node => {
      if (node.classList.contains('is-visible')) {
        const m = parseInt(node.getAttribute('data-milestone'), 10) || 1;
        if (m > maxMilestone) maxMilestone = m;
      }
    });

    if (progressLine) {
      const percentage = Math.min(100, Math.max(15, (maxMilestone / nodes.length) * 100));
      progressLine.style.height = `${percentage}%`;
    }
  }, {
    threshold: 0.25,
    rootMargin: "0px 0px -10% 0px"
  });

  nodes.forEach(node => roadmapObserver.observe(node));
}

/* ==========================================
   7. Careers Modal & Applications
   ========================================== */
function initCareersModal() {
  const modal = document.getElementById('apply-modal');
  const openBtns = document.querySelectorAll('.apply-btn-trigger');
  const closeBtn = document.getElementById('close-modal-btn');
  const modalRoleName = document.getElementById('modal-role-name');
  const hiddenRoleInput = document.getElementById('app-role');
  
  const form = document.getElementById('career-application-form');
  const successBox = document.getElementById('app-success-box');

  if (!modal) return;

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      modalRoleName.innerText = role;
      hiddenRoleInput.value = role;
      
      form.style.display = 'block';
      successBox.style.display = 'none';
      form.reset();
      
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.innerText = "Submitting Application...";
      submitBtn.disabled = true;

      const payload = {
        full_name: document.getElementById('app-name').value,
        email: document.getElementById('app-email').value,
        role: document.getElementById('app-role').value,
        portfolio_url: document.getElementById('app-portfolio').value,
        resume_url: document.getElementById('app-resume').value,
        cover_note: document.getElementById('app-message').value
      };

      submitToSupabase('career_applications', payload)
        .catch((err) => console.error("Career application submission failed:", err))
        .finally(() => {
          form.style.display = 'none';
          successBox.style.display = 'flex';
          submitBtn.disabled = false;
          submitBtn.innerText = "Submit Application";
        });
    });
  }
}

/* ==========================================
   8. Form Submissions (Contact & Newsletter)
   ========================================== */
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || "https://ioxzzyvtfkuwubvkeicn.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlveHp6eXZ0Zmt1d3VidmtlaWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTg0NTgsImV4cCI6MjEwMTM5NDQ1OH0._evXDgK1IY12_cl9MNs7F6f6TATfsEEvvmH_VLkwDa4";

async function submitToSupabase(table, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase insert failed (${response.status}): ${errorText}`);
  }
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const successBox = document.getElementById('contact-success-box');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerText = "Processing request...";
    submitBtn.disabled = true;

    const payload = {
      full_name: document.getElementById('contact-name').value,
      company: document.getElementById('contact-company').value,
      email: document.getElementById('contact-email').value,
      phone: document.getElementById('contact-phone').value,
      service_required: document.getElementById('contact-service').value,
      message: document.getElementById('contact-message').value
    };

    submitToSupabase('consultation_requests', payload)
      .catch((err) => console.error("Contact form submission failed:", err))
      .finally(() => {
        form.style.display = 'none';
        successBox.style.display = 'flex';
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Request";
      });
  });

  const newsForms = document.querySelectorAll('.newsletter-form, #newsletter-form');
  newsForms.forEach(newsForm => {
    newsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = newsForm.querySelector('input[type="email"]');
      const submitBtn = newsForm.querySelector('button[type="submit"]');
      if (!input || !submitBtn) return;

      const rawEmail = input.value;
      if (!rawEmail || !rawEmail.trim()) return;

      const cleanEmail = rawEmail.trim().toLowerCase();

      // Email Validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        input.classList.add('border-red-500');
        setTimeout(() => input.classList.remove('border-red-500'), 3000);
        return;
      }
      
      submitBtn.disabled = true;
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>Subscribing...</span>';
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }

      try {
        let resData = null;
        let success = false;

        // 1. Call Supabase Edge Function /newsletter
        if (supabase && supabase.supabaseUrl) {
          try {
            const res = await fetch(`${supabase.supabaseUrl}/functions/v1/newsletter`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ action: 'subscribe', email: cleanEmail, source: 'website' })
            });
            resData = await res.json();
            if (res.ok && resData.success) {
              success = true;
            }
          } catch (fetchErr) {
            console.warn("Newsletter Edge Function fallback:", fetchErr);
          }
        }

        // 2. Direct Supabase Client Fallback (if edge function is offline)
        if (!success && supabase) {
          const { data: existing } = await supabase
            .from('newsletter_subscribers')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (existing && (existing.status === 'active' || existing.status === 'confirmed')) {
            resData = { alreadySubscribed: true, message: "You're already subscribed to Aegrion updates." };
            success = true;
          } else {
            const token = crypto.randomUUID ? crypto.randomUUID() : 'token-' + Math.random().toString(36).substring(2);
            await supabase.from('newsletter_subscribers').upsert({
              email: cleanEmail,
              status: 'active',
              source: 'website',
              unsubscribe_token: token,
              subscribed_at: new Date().toISOString()
            }, { onConflict: 'email' });
            success = true;
            resData = { message: "You're now subscribed to Aegrion Intelligence." };
          }
        }

        if (resData && resData.alreadySubscribed) {
          submitBtn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-green-400"></i><span>Subscribed</span>';
          input.value = "Already subscribed!";
          input.disabled = true;
          showNotification(resData.message || "You're already subscribed to Aegrion updates.", "info");
        } else {
          submitBtn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-green-400"></i><span>Subscribed</span>';
          input.value = "✓ Subscribed!";
          input.disabled = true;
          showNotification(resData?.message || "You're now subscribed to Aegrion Intelligence.", "success");
        }

      } catch (err) {
        console.error("Newsletter submission error:", err);
        submitBtn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-green-400"></i><span>Subscribed</span>';
        input.value = "✓ Subscribed!";
        input.disabled = true;
        showNotification("You're now subscribed to Aegrion Intelligence.", "success");
      } finally {
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    });
  });
}

/* ==========================================
   9. Premium Preloader Screen Handler
   ========================================== */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  // Add load event listener to fade out the preloader
  window.addEventListener('load', () => {
    // Add a slight delay for visual impact and smooth progress transition completion
    setTimeout(() => {
      preloader.classList.add('fade-out');
    }, 600);
  });
}

/* ==========================================
   10. Cookie Consent & Custom Toggles Handler
   ========================================== */
function initCookieConsent() {
  const banner = document.getElementById('cookie-banner');
  const modal = document.getElementById('cookie-prefs-modal');
  
  const acceptBtn = document.getElementById('cookie-accept-btn');
  const manageBtn = document.getElementById('cookie-manage-btn');
  const savePrefsBtn = document.getElementById('cookie-save-prefs-btn');
  const closeBtn = document.getElementById('close-cookie-modal-btn');
  
  const openBtns = document.querySelectorAll('#open-cookie-prefs');
  
  const prefFunctional = document.getElementById('cookie-pref-functional');
  const prefAnalytics = document.getElementById('cookie-pref-analytics');
  
  if (!banner || !modal) return;
  
  const STORAGE_KEY = 'aegrion_cookie_consent';
  
  function getConsent() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error reading cookie consent', e);
      return null;
    }
  }
  
  function saveConsent(functional, analytics) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ functional, analytics }));
    } catch (e) {
      console.error('Error saving cookie consent', e);
    }
  }
  
  function openModal() {
    const consent = getConsent() || { functional: true, analytics: true };
    if (prefFunctional) prefFunctional.checked = !!consent.functional;
    if (prefAnalytics) prefAnalytics.checked = !!consent.analytics;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Check consent state on load
  const consent = getConsent();
  if (consent === null) {
    banner.classList.add('active');
  } else {
    if (prefFunctional) prefFunctional.checked = !!consent.functional;
    if (prefAnalytics) prefAnalytics.checked = !!consent.analytics;
  }
  
  // Accept All
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      saveConsent(true, true);
      banner.classList.remove('active');
    });
  }
  
  // Manage Preferences from banner
  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      openModal();
    });
  }
  
  // Open from footer button(s)
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });
  
  // Close Modal
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Save Prefs
  if (savePrefsBtn) {
    savePrefsBtn.addEventListener('click', () => {
      const functional = prefFunctional ? prefFunctional.checked : false;
      const analytics = prefAnalytics ? prefAnalytics.checked : false;
      saveConsent(functional, analytics);
      closeModal();
      banner.classList.remove('active');
    });
  }
}

/* ==========================================
   9. Dynamic Environment Redirects Binding
   ========================================== */
function initLoginRedirects() {
  const loginLinks = document.querySelectorAll('.login-link');
  loginLinks.forEach(link => {
    link.setAttribute('href', LOGIN_URL);
  });
}

/* ==========================================
   10. Mouse Parallax for Premium CTA Cards
   ========================================== */
function initPremiumCtaParallax() {
  const cards = document.querySelectorAll('.premium-cta-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const width = rect.width;
      const height = rect.height;
      // Calculate rotation angles (max 4 degrees)
      const rotX = ((y / height) - 0.5) * -8;
      const rotY = ((x / width) - 0.5) * 8;
      
      card.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-10px) scale(1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
    });
  });
}


