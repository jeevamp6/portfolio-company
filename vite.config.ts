import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'LANDING_URL', 'LOGIN_URL', 'DASHBOARD_URL'],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
      },
      '/.netlify/functions/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/\.netlify\/functions\/api/, '/api/v1'),
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        privacy: path.resolve(__dirname, 'privacy.html'),
        terms: path.resolve(__dirname, 'terms.html'),
        security: path.resolve(__dirname, 'security.html'),
        'trust-center': path.resolve(__dirname, 'trust-center.html'),
        'newsletter-confirm': path.resolve(__dirname, 'newsletter-confirm.html'),
        'newsletter-unsubscribe': path.resolve(__dirname, 'newsletter-unsubscribe.html'),
        login: path.resolve(__dirname, 'login.html'),
        register: path.resolve(__dirname, 'register.html'),
        'forgot-password': path.resolve(__dirname, 'forgot-password.html'),
        'reset-password': path.resolve(__dirname, 'reset-password.html'),
        trial: path.resolve(__dirname, 'trial.html'),
        app: path.resolve(__dirname, 'app.html'),
        billing: path.resolve(__dirname, 'billing.html'),
        'admin-billing': path.resolve(__dirname, 'admin-billing.html'),
        'verify-email': path.resolve(__dirname, 'verify-email.html'),
        // Services
        'service-managed-soc': path.resolve(__dirname, 'services/managed-soc/index.html'),
        'service-cloud-security': path.resolve(__dirname, 'services/cloud-security/index.html'),
        'service-incident-response': path.resolve(__dirname, 'services/incident-response/index.html'),
        'service-threat-detection': path.resolve(__dirname, 'services/threat-detection/index.html'),
        'service-threat-hunting': path.resolve(__dirname, 'services/threat-hunting/index.html'),
        'service-vulnerability-assessment': path.resolve(__dirname, 'services/vulnerability-assessment/index.html'),
        'service-web-application-security': path.resolve(__dirname, 'services/web-application-security/index.html'),
        'service-network-security': path.resolve(__dirname, 'services/network-security/index.html'),
        'service-identity-security': path.resolve(__dirname, 'services/identity-security/index.html'),
        'service-email-security': path.resolve(__dirname, 'services/email-security/index.html'),
        'service-endpoint-protection': path.resolve(__dirname, 'services/endpoint-protection/index.html'),
        'service-compliance-consulting': path.resolve(__dirname, 'services/compliance-consulting/index.html'),
        'service-security-awareness-training': path.resolve(__dirname, 'services/security-awareness-training/index.html'),
        'service-digital-forensics': path.resolve(__dirname, 'services/digital-forensics/index.html'),
        'service-managed-detection-response': path.resolve(__dirname, 'services/managed-detection-response/index.html'),
        // Resources
        'resource-cloud-threat-actors': path.resolve(__dirname, 'resources/analyzing-advanced-threat-actors-cloud-infrastructure/index.html'),
        'resource-zero-trust-kubernetes': path.resolve(__dirname, 'resources/zero-trust-kubernetes-architectures/index.html'),
        'resource-aws-iam-best-practices': path.resolve(__dirname, 'resources/aws-iam-best-practices/index.html'),
      },
    },
  },
});
