# 🚀 Calculator Boilerplate - Ultimate Edition

**Enterprise-grade, AI-friendly, Cloudflare Edge-native calculator boilerplate**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-4.15-orange)](https://astro.build/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

---

## ✨ Features

### 🎯 Core Features
- ✅ Multi-step calculator with progress tracking
- ✅ Quote generation with price breakdown
- ✅ Email notifications (Resend)
- ✅ Responsive design (mobile-first)
- ✅ Dark mode support

### 🔐 Security (Enterprise-Grade)
- ✅ Rate limiting (IP + UserAgent hash)
- ✅ Payload size limits (1MB max)
- ✅ CORS whitelist (no wildcards)
- ✅ Webhook signatures (HMAC-SHA256)
- ✅ IP anonymization (GDPR compliant)
- ✅ Error ID tracking

### 📊 Analytics & Monitoring
- ✅ Google Analytics (GTM + GA4)
- ✅ Event tracking
- ✅ Error monitoring (Sentry/Toucan)
- ✅ Health check endpoint

### 🌍 Internationalization
- ✅ Multi-language support (EN, ES, FR)
- ✅ Language detection
- ✅ RTL support ready

### 📦 Data & Storage
- ✅ Turso database (Edge SQLite)
- ✅ Drizzle ORM (type-safe)
- ✅ Cloudflare KV (caching)
- ✅ Schema versioning
- ✅ Data retention (180-day cleanup)
- ✅ Duplicate prevention (fingerprinting)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- Cloudflare account
- Turso account (database)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/calculator-boilerplate.git
cd calculator-boilerplate

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate database
npm run db:generate
npm run db:migrate

# Run health check
npm run health-check

# Start development server
npm run dev
```

Visit: `http://localhost:4321`

---

## ⚙️ Configuration

### Feature Flags

Edit `src/lib/config.ts`:

```typescript
features: {
  auth: false,                    // Enable authentication
  multiLanguage: false,           // Enable i18n
  analytics: false,               // Enable GA/GTM
  crmSync: false,                 // Enable CRM webhook
  rateLimiting: true,             // Rate limiting (forced in prod)
  ipAnonymization: true,          // GDPR IP hashing
  // ... more features
}
```

### Environment Variables

Required:
- `TURSO_DATABASE_URL` - Database URL
- `TURSO_AUTH_TOKEN` - Database auth token
- `RESEND_API_KEY` - Email service

Optional:
- `GOOGLE_CLIENT_ID` - OAuth
- `GOOGLE_CLIENT_SECRET` - OAuth
- `CRM_WEBHOOK_URL` - CRM integration
- `SENTRY_DSN` - Error tracking
- `GTM_ID` - Google Tag Manager

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint
npm run lint:fix
```

---

## 🚢 Deployment

### Production Checklist

```bash
# 1. Health check
npm run health-check

# 2. Run tests
npm run test

# 3. Type check
npm run type-check

# 4. Build
npm run build

# 5. Preview locally
npm run preview

# 6. Deploy to Cloudflare
npm run deploy
```

### Cloudflare Setup

1. Create KV namespaces:
   - `RATE_LIMITER`
   - `SESSIONS`
   - `CRM_QUEUE`

2. Set secrets:
```bash
wrangler secret put TURSO_DATABASE_URL
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put RESEND_API_KEY
```

3. Configure `wrangler.toml` with your KV IDs

4. Deploy:
```bash
npm run deploy
```

---

## 📚 Documentation

- [API Reference](docs/API.md)
- [Components](docs/COMPONENTS.md)
- [Pages](docs/PAGES.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

---

## 🛠️ Project Structure

```
calculator-boilerplate/
├── src/
│   ├── components/        # React & Astro components
│   ├── lib/               # Core library code
│   │   ├── core/         # Feature-independent logic
│   │   ├── features/     # Optional features (plugins)
│   │   └── utils/        # Shared utilities
│   ├── pages/            # Routes & API endpoints
│   ├── middleware/       # Global middleware
│   └── styles/           # Global styles
├── public/               # Static assets
├── docs/                 # Documentation
├── scripts/              # Maintenance scripts
├── test/                 # Test files
└── db/                   # Database migrations
```

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- [Astro](https://astro.build/)
- [Cloudflare](https://www.cloudflare.com/)
- [Turso](https://turso.tech/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Biome](https://biomejs.dev/)

---

**Built with ❤️ for the AI development era**

Need help? Open an issue or join our [Discord](https://discord.gg/your-invite)
