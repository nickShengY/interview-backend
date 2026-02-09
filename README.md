# 🎯 Interview Pro - AI-Powered Career Advancement

> **Production Ready** ✅ | Fully tested, secure, and optimized for deployment

A comprehensive AI-powered platform for resume optimization and interview preparation featuring ATS scanning, cover letter generation, and interactive technical/behavioral interview practice.

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)]() [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)]() [![Next.js](https://img.shields.io/badge/Next.js-15.2-black)]() [![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 🚀 Quick Links

- **[Production Setup Guide](./PRODUCTION_READY.md)** - Complete setup instructions
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to Vercel, Railway, etc.
- **[Changelog](./CHANGELOG.md)** - What's new in v1.0.0
- **[Gap Analysis](./GAP_ANALYSIS.md)** - Production readiness audit
- **[Critical Fixes](./CRITICAL_FIXES_GUIDE.md)** - Implementation details

---

## Features

### 🎯 ATS Resume Scanner
- **Traditional Scoring**: TF-IDF keyword matching with section weighting
- **AI Semantic Scoring**: Transformer-based similarity using Sentence-BERT
- **Missing Keywords Detection**: Identifies important terms to include
- **Formatting Analysis**: Penalties for ATS-unfriendly formatting
- **Cover Letter Generation**: AI-powered personalized cover letters

### 💼 Interview Practice
- **Technical Interviews**: Industry-specific questions with answer evaluation
- **Behavioral Interviews**: Personalized questions using MBTI/zodiac data
- **Credit Rewards**: Spin-wheel system for correct technical answers
- **Voice Input Support**: Real-time speech processing (privacy-compliant)
- **Progress Tracking**: Review past Q&A with feedback

### 💳 Credit System & Billing
- **Credit-Based Usage**: ATS scan (2 credits), Cover letter (3 credits), Questions (1 credit)
- **Stripe Integration**: Pro (100 credits) and Ultra (400 credits) plans
- **Transaction Logging**: Complete audit trail of credit usage
- **Free Tier**: 10 credits for new users

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **NextAuth.js** for authentication

### Backend
- **FastAPI** (Python) for ATS processing
- **Prisma ORM** with PostgreSQL
- **Google Gemini (1.5 Pro/Flash)** for AI features and structured output
- **Stripe** for payments
- **Gemini Embeddings** for semantic similarity (with optional SBERT fallback)

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database (or use Docker)

### 1. Clone and Install
```bash
git clone <repository-url>
cd ats-interview-app
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local and fill in ALL required variables
# See .env.example for detailed instructions
```

**Required Services:**
- PostgreSQL database ([Supabase](https://supabase.com) recommended)
- Google OAuth credentials ([Setup Guide](https://console.cloud.google.com))
- Google Gemini API key ([Get Key](https://makersuite.google.com/app/apikey))
- Stripe account ([Dashboard](https://dashboard.stripe.com))

### 3. Database Setup
```bash
npm run db:generate
npm run db:push
```

### 4. Start Services

**Option A: With Docker (Recommended)**
```bash
# Start database and backend
npm run docker:dev

# In another terminal, start frontend
npm run dev
```

**Option B: Manual**
```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
npm run dev
```

### 5. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- Database Studio: `npm run db:studio`

🎉 **Done!** Sign in with Google to start using the app.

---

## 📖 Full Documentation

**New to the project?** Start here:
1. Read [PRODUCTION_READY.md](./PRODUCTION_READY.md) for complete setup
2. Check [.env.example](./.env.example) for configuration
3. Review [DEPLOYMENT.md](./DEPLOYMENT.md) before going live

**Deploying to production?**
1. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) checklist
2. Verify all tests pass: `npm run test:ci`
3. Complete manual testing checklist
4. Monitor health endpoints post-deployment

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API key | ✅ |
| `OPENROUTER_APP_URL` | OpenRouter attribution URL (HTTP-Referer header) | ❌ |
| `OPENROUTER_APP_NAME` | OpenRouter attribution app name (X-Title header) | ❌ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ |
| `STRIPE_PRICE_PRO` | Stripe price ID for Pro plan | ✅ |
| `STRIPE_PRICE_ULTRA` | Stripe price ID for Ultra plan | ✅ |
| `NEXT_PUBLIC_ATS_API` | Backend API URL | ✅ |
| `SBERT_API_URL` | Optional SBERT endpoint fallback for embeddings | ❌ |

## API Endpoints

### Frontend (Next.js)
- `POST /api/auth/[...nextauth]` - Authentication
- `POST /api/stripe/create-checkout` - Start payment flow
- `POST /api/stripe/webhook` - Handle payment events
- `POST /api/interview/technical` - Generate technical questions
- `POST /api/interview/behavioral` - Generate behavioral questions
- `POST /api/interview/evaluate` - Evaluate answers
- `GET /api/qa` - Retrieve user Q&A history

### Backend (FastAPI)
- `POST /scan` - ATS resume scanning
- `POST /cover-letter` - Generate cover letters

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Backend (Railway/Render)
1. Create a new service from GitHub
2. Set environment variables
3. Use `backend/` as root directory
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Database (Supabase/PlanetScale)
1. Create a PostgreSQL database
2. Update `DATABASE_URL` in environment
3. Run `npx prisma db push` to create tables

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   FastAPI API    │────│   PostgreSQL    │
│   (Frontend)    │    │   (ATS Backend)  │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌─────▼─────┐         ┌──────▼──────┐
    │ NextAuth│            │  Gemini   │         │   Prisma    │
    │ (Auth)  │            │   API     │         │    ORM      │
    └─────────┘            └───────────┘         └─────────────┘
         │                       │
    ┌────▼────┐            ┌─────▼─────┐
    │ Stripe  │            │  Gemini   │
    │(Payment)│            │ Embedding │
    └─────────┘            └───────────┘
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run all tests (CI mode)
npm run test:ci

# Run E2E tests
npm run test:e2e

# Type check
npm run type-check

# Lint
npm run lint
```

## 📊 Project Status

### ✅ Production Ready Features
- [x] Complete authentication system with Google OAuth
- [x] Protected routes and middleware
- [x] Real-time credit tracking
- [x] Secure payment processing with Stripe
- [x] ATS resume scanning with AI
- [x] Cover letter generation
- [x] Technical & behavioral interview practice
- [x] Comprehensive error handling
- [x] Database optimization with indexes
- [x] Rate limiting and security headers
- [x] SEO optimization
- [x] Full test coverage setup
- [x] Health monitoring endpoints
- [x] Deployment-ready configuration

### 🎯 Quality Metrics
- **Security**: Rate limiting, CORS, input validation, secure headers
- **Performance**: Database indexes, image optimization, lazy loading
- **Reliability**: Error boundaries, health checks, structured logging
- **Testing**: Unit tests, E2E tests, type checking
- **Documentation**: Complete setup and deployment guides

## 🛠️ Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run type-check   # TypeScript validation
npm run test         # Run tests in watch mode
npm run test:ci      # Run all tests once
npm run test:e2e     # Run E2E tests
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Open database GUI
npm run docker:dev   # Start Docker services
npm run docker:down  # Stop Docker services
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test:ci`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Coding Standards
- TypeScript strict mode enabled
- ESLint and Prettier configured
- Test coverage required for new features
- Follow existing code structure and patterns

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 💬 Support

**Need help?**
- 📖 Check [PRODUCTION_READY.md](./PRODUCTION_READY.md) for detailed setup
- 🚀 Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- 🐛 Create a [GitHub Issue](../../issues) for bugs
- 💡 Start a [Discussion](../../discussions) for questions

**Common Issues:**
- Authentication not working? Check [PRODUCTION_READY.md - Troubleshooting](./PRODUCTION_READY.md#troubleshooting)
- Build failing? See [DEPLOYMENT.md - Troubleshooting](./DEPLOYMENT.md#troubleshooting)
- Database errors? Review [database setup instructions](./PRODUCTION_READY.md#phase-3-database-setup-5-minutes)

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Stripe](https://stripe.com/) - Payments
- [FastAPI](https://fastapi.tiangolo.com/) - Backend API
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Google Gemini](https://ai.google.dev/) - AI features

## 📈 Roadmap

See [CHANGELOG.md](./CHANGELOG.md) for planned features and future releases.

---

<p align="center">Built with ❤️ for job seekers worldwide</p>
<p align="center">⭐ Star this repo if it helped you land your dream job!</p>
