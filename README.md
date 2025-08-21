# FairShare 💰

A modern, feature-rich expense splitting application built with Next.js, TypeScript, Supabase, and Prisma. Split expenses intelligently with friends, family, and groups with support for receipt scanning, dietary preferences, and real-time updates.

## ✨ Features

- 🔐 **Secure Authentication** - Email/password and Google OAuth via Supabase Auth
- 👥 **Smart Groups** - Create and manage expense groups with invite codes
- 📱 **Receipt Scanning** - Upload and parse receipts using Tesseract.js OCR
- 🍽️ **Dietary Preferences** - Automatic expense splitting based on dietary restrictions
- 💰 **Flexible Splitting** - Equal, percentage, or custom split options
- 📊 **Real-time Balances** - Live updates of who owes what
- 🌙 **Dark/Light Mode** - Beautiful UI with theme switching
- 📱 **Responsive Design** - Works perfectly on all devices
- ♿ **Accessible** - WCAG compliant design
- 🧪 **Well Tested** - Comprehensive unit and integration tests

## 🚀 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **OCR**: Tesseract.js
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- A Google Cloud Console project (for OAuth)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd fairshare
npm install
```

### 2. Environment Variables

Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_postgresql_connection_string

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Go to Settings > Database to get your connection string
4. Run the database migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 4. Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)
6. Add the client ID and secret to your environment variables

### 5. Database Schema

Generate and push the Prisma schema:

```bash
npx prisma generate
npx prisma db push
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Automated CI/CD with GitHub Actions

This project includes a complete CI/CD pipeline that automatically:
- ✅ Runs tests and linting on every push
- 🏗️ Builds the application
- 🔒 Performs security scans
- 🚀 Deploys to Vercel automatically
- 📊 Runs performance tests with Lighthouse CI

#### Quick Setup for Auto-Deployment

1. **Fork/Clone this repository**
2. **Set up GitHub Secrets** (see [GitHub Actions Setup Guide](./docs/GITHUB_ACTIONS_SETUP.md)):
   ```
   Required Secrets:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - VERCEL_TOKEN
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID
   ```
3. **Push to main branch** - automatic deployment will start!

📖 **Detailed Setup**: See [docs/GITHUB_ACTIONS_SETUP.md](./docs/GITHUB_ACTIONS_SETUP.md) for complete instructions.

### Manual Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

**Optional Variables:**
- `GOOGLE_CLIENT_ID` - For Google OAuth (if enabled)
- `GOOGLE_CLIENT_SECRET` - For Google OAuth (if enabled)
- `NEXT_PUBLIC_APP_URL` - Your production URL

📋 **Complete list**: See [.env.example](./.env.example) for all available environment variables.

## 🔄 CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow:

### Pipeline Stages
- **🧪 Testing**: ESLint, TypeScript, Jest tests with coverage
- **🏗️ Building**: Next.js build with Prisma generation
- **🔒 Security**: npm audit + Snyk vulnerability scanning
- **📊 Performance**: Lighthouse CI for Core Web Vitals
- **🚀 Deployment**: Automatic Vercel deployment
- **📢 Notifications**: Slack alerts for deployment status

### Workflow Triggers
- **Main branch**: Full pipeline + production deployment
- **Develop branch**: Testing and building only
- **Pull requests**: Testing + preview deployment

### Setup Requirements
See [GitHub Actions Setup Guide](./docs/GITHUB_ACTIONS_SETUP.md) for detailed configuration instructions.

## 📁 Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── (auth)/         # Authentication pages
│   └── dashboard/      # Main application pages
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── forms/          # Form components
│   ├── navigation/     # Navigation components
│   └── providers.tsx   # Context providers
├── lib/                # Utility libraries
│   ├── database.ts     # Database operations
│   ├── balance-calculator.ts # Balance algorithms
│   ├── ocr.ts          # OCR processing
│   ├── prisma.ts       # Prisma client
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Utility functions
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
└── __tests__/          # Test files
    ├── components/     # Component tests
    ├── lib/           # Library tests
    ├── api/           # API tests
    └── integration/   # Integration tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend-as-a-service
- [Vercel](https://vercel.com) for seamless deployment
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Framer Motion](https://framer.com/motion) for smooth animations
