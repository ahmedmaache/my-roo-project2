# Gloven Portal

Public portal displaying cohort leaderboards and weekly health reports for the Gloven accelerator program.

## Enterprise Maturity Pack v1 - Slice 1

This portal now includes comprehensive authentication, RBAC, database, and security features as part of the Enterprise Maturity Pack implementation.

## Overview

The Gloven Portal is a Next.js 15+ application that provides:

- **Home**: Program overview and call-to-action
- **Cohort**: Application leaderboard with rankings and scores  
- **Report**: Weekly health metrics and operational summary
- **FAQ**: Frequently asked questions about the program
- **Slack API**: Slash commands for team notifications
- **Authentication**: Role-based access control (RBAC)
- **Dashboard**: Role-aware user dashboard
- **Security**: Comprehensive security headers and protection

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Markdown**: Remark + Rehype
- **Database**: Prisma + SQLite
- **Authentication**: NextAuth.js
- **Security**: CSP, CSRF, Rate Limiting
- **Deployment**: Vercel (recommended)

## Enterprise Features

### Authentication & RBAC
- NextAuth with Prisma Adapter
- Role-based access control (Admin, Staff, Founder, Mentor, Investor)
- Development-friendly one-time code authentication
- Production email magic links

### Database Schema
- Comprehensive Prisma schema with 15+ entities
- User management with roles and permissions
- Startup and cohort management
- Application scoring and tracking
- Investor interest tracking
- Audit logging

### Security
- Strict Content Security Policy (CSP)
- CSRF protection with token validation
- Rate limiting for API endpoints
- Security headers middleware
- Secret scanning in CI/CD

## Setup

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
cd gloven_starter_kit/portal
npm install
```

### Database Setup

1. **Generate Prisma client:**
```bash
npm run db:generate
```

2. **Push database schema:**
```bash
npm run db:push
```

3. **Seed the database:**
```bash
npm run db:seed
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure required variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here-change-in-production

# Email Provider (Optional - for production magic links)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=user@example.com
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@gloven.org

# Development Authentication (when SMTP not configured)
# Use one-time code printed during seeding for development

# Admin protection for /report route (optional - legacy)
PORTAL_ADMIN_PASSWORD=your-secret-password

# Slack integration (optional)
SLACK_SIGNING_SECRET=your-slack-signing-secret

# Base URL for absolute links
NEXT_PUBLIC_BASE_URL=https://gloven.net
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Development Authentication

When SMTP is not configured, use development authentication:

1. Run the seed script: `npm run db:seed`
2. Use any email address and the one-time code **123456**
3. The system will create a new user with FOUNDER role

### Database Management

- **Prisma Studio**: `npm run db:studio` - Visual database management
- **Generate Client**: `npm run db:generate` - After schema changes
- **Push Changes**: `npm run db:push` - Update database schema
- **Seed Database**: `npm run db:seed` - Reset with sample data

## Data Publishing

Portal data is published from the Gloven CLI:

```bash
cd ../tools/gloven-cli
npm run build

# Publish data to portal
node dist/index.js publish-portal-data --out ../portal/public/data
```

This generates:
- `public/data/leaderboard.json` - Full rankings
- `public/data/top10.json` - Top 10 performers  
- `public/data/health.json` - KPI metrics
- `public/data/report.md` - Weekly report (sanitized)

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configure environment variables in Vercel dashboard.

### Manual Deployment

Build for production:

```bash
npm run build
npm run start
```

## Security Features

### Content Security Policy (CSP)
The portal implements strict CSP headers. To modify CSP for your needs:

1. Edit `src/middleware.headers.ts`
2. Update the `csp` object with your requirements
3. Common modifications include adding external script sources or relaxing policies for specific features

### CSRF Protection
All POST requests require CSRF tokens. Include tokens in forms:

```typescript
import { getCSRFToken } from '@/lib/csrf';

// In your form component
const csrfToken = getCSRFToken();

// Add to form
<input type="hidden" name="_csrf" value={csrfToken} />
```

### Rate Limiting
API endpoints are protected with rate limiting. Configure limits in `src/lib/rateLimit.ts`:

- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes  
- File upload: 10 requests per hour

## Slack Integration

The portal provides slash commands for Slack workspaces:

### Setup

1. Create a Slack app at https://api.slack.com/apps
2. Enable Slash Commands:
   - `/gloven-health` → `https://your-domain.com/api/slack/command`
   - `/gloven-top` → `https://your-domain.com/api/slack/command`
3. Copy the Signing Secret to `SLACK_SIGNING_SECRET` env var
4. Install the app to your workspace

### Available Commands

- `/gloven-health` - Show key health metrics (total apps, GO/WAITLIST counts, avg score)
- `/gloven-top [n]` - Show top N performers (default: 5, max: 10)

## Admin Protection

To protect the `/report` route with a password:

1. Set `PORTAL_ADMIN_PASSWORD` in environment variables
2. Users will be prompted for authentication when accessing `/report`
3. Leave unset for public access

## Project Structure

```
portal/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── layout.tsx       # Root layout with navigation
│   │   ├── page.tsx         # Home page
│   │   ├── dashboard/       # Role-aware dashboard
│   │   ├── signin/          # Authentication page
│   │   ├── cohort/          # Leaderboard page
│   │   ├── report/          # Weekly report page
│   │   ├── faq/             # FAQ page
│   │   └── api/
│   │       ├── auth/        # NextAuth API routes
│   │       └── slack/       # Slack API endpoints
│   ├── components/          # React components
│   │   ├── LeaderBoard.tsx  # Leaderboard table
│   │   └── ReportMD.tsx     # Markdown renderer
│   └── lib/                 # Utilities
│       ├── auth.ts          # Simple auth helpers (legacy)
│       ├── db.ts            # Prisma client
│       ├── rbac.ts          # Role-based access control
│       ├── csrf.ts          # CSRF protection
│       ├── rateLimit.ts     # Rate limiting
│       └── markdown.ts      # Markdown processing
├── prisma/
│   └── schema.prisma        # Database schema
├── scripts/
│   └── seed.ts              # Database seeding
├── public/
│   └── data/                # Published data files (gitignored)
├── package.json
├── next.config.mjs
└── tailwind.config.ts
```

## Data Schema

### leaderboard.json
```json
{
  "generated": "2024-01-15T10:30:00Z",
  "totalApps": 50,
  "entries": [
    {
      "rank": 1,
      "id": "app-001",
      "company": "StartupCo",
      "region": "North America",
      "stage": "Seed",
      "score": 85.5,
      "band": "GO"
    }
  ]
}
```

### health.json
```json
{
  "generated": "2024-01-15T10:30:00Z",
  "totalApps": 50,
  "goCount": 8,
  "waitlistCount": 12,
  "noGoCount": 30,
  "avgScore": 67.3,
  "costMTD": 45.20
}
```

## Contributing

This portal is part of the Gloven Growth CLI ecosystem. See the main README for contribution guidelines.

## Security Scanning

The project includes automated security scanning:

- **Gitleaks**: Secret detection in CI/CD
- **Custom Scanner**: Regex-based secret scanning
- **Dependency Audit**: npm audit integration
- **CodeQL**: Static code analysis

Run security scans locally:
```bash
# Install gitleaks
brew install gitleaks

# Run secret scan
cd gloven_starter_kit
gitleaks detect -v

# Or use custom scanner
node scripts/secret-scan.js
```

## License

Proprietary - Gloven Accelerator Program

## Support

For questions or issues:
- Email: hello@gloven.org
- GitHub Issues: [Project Repository]