# Project Integration Plan: Meeting Assistant with Gmail & Calendar Integration

## Overview
Transform the existing prototype into a full-featured meeting assistant with Gmail integration for sending summaries, Google Calendar integration for meeting management, and Better Auth for authentication with Google OAuth and email/password support.

## Technology Stack Decisions

### Database: PostgreSQL with Neon
**Rationale:**
- Better Auth works excellently with PostgreSQL
- Neon provides serverless PostgreSQL with excellent free tier
- Supports complex queries for meeting data, transcripts, and user management
- Built-in connection pooling and edge compatibility
- Easy migration path with Drizzle ORM

### ORM: Drizzle ORM
**Rationale:**
- TypeScript-first with excellent type safety
- Better Auth has native Drizzle adapter
- Lightweight and performant
- Great migration tooling

### Authentication: Better Auth
**Features to implement:**
- Email/Password authentication
- Google OAuth (provides Gmail & Calendar access)
- Session management
- User profile management

### UI Framework: React + Next.js
- Enhance with Tailwind CSS for modern, minimal design
- Add shadcn/ui components for consistent, professional look
- Implement responsive dashboard layout

## Phase 1: Database Setup & Schema Design

### 1.1 Install Dependencies
```bash
pnpm add better-auth drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit
pnpm add dotenv
pnpm add googleapis
pnpm add better-auth/react
```

### 1.2 Database Schema Design

**Core Tables (Better Auth):**
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth accounts (Google)
- `verification` - Email verification tokens

**Application Tables:**
- `meeting` - Meeting records
  - id, userId, title, startTime, endTime, calendarEventId, status, createdAt
- `transcript` - Meeting transcripts
  - id, meetingId, content, language, speakerCount, createdAt
- `summary` - AI-generated summaries
  - id, meetingId, summary, actionPoints (JSON), keyTopics (JSON), createdAt
- `email_log` - Sent email tracking
  - id, meetingId, userId, recipientEmail, subject, sentAt, status
- `user_settings` - User preferences
  - id, userId, gmailEnabled, calendarEnabled, emailNotifications, settings (JSON)

### 1.3 Neon Database Setup
1. Create Neon account at neon.tech
2. Create new project
3. Copy connection string
4. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://..."
   ```

## Phase 2: Better Auth Integration

### 2.1 Environment Variables Setup
```env
# Database
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="generate-random-32-char-string"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"
```

### 2.2 Create Auth Configuration
**File:** `lib/auth.ts`
- Configure betterAuth with:
  - Email/password authentication
  - Google OAuth provider with Calendar & Gmail scopes
  - Drizzle adapter
  - Session management

### 2.3 Create Auth Client
**File:** `lib/auth-client.ts`
- Export configured auth client for frontend use
- Setup type-safe client methods

### 2.4 Drizzle Schema Definition
**File:** `lib/db/schema.ts`
- Define all tables using Drizzle schema
- Export types for TypeScript usage

### 2.5 Database Migration
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Phase 3: Google API Integration

### 3.1 Google Cloud Console Setup
1. Create project in Google Cloud Console
2. Enable APIs:
   - Gmail API
   - Google Calendar API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs
5. Configure OAuth consent screen

### 3.2 Gmail Integration
**File:** `lib/gmail/client.ts`
- Create Gmail API client wrapper
- Functions:
  - `sendEmail(to, subject, body, attachments)`
  - `sendTranscriptEmail(meeting, transcript)`
  - `sendSummaryEmail(meeting, summary, actionPoints)`

### 3.3 Google Calendar Integration
**File:** `lib/calendar/client.ts`
- Create Calendar API client wrapper
- Functions:
  - `getUpcomingMeetings(maxResults = 5)`
  - `getMeetingById(eventId)`
  - `watchCalendar()` - Setup webhook for new meetings
  - `syncMeeting(eventId)` - Sync calendar event to database

### 3.4 Token Refresh Mechanism
**File:** `lib/google/token-manager.ts`
- Handle OAuth token refresh
- Store refresh tokens securely in database
- Auto-refresh expired tokens

## Phase 4: UI/UX Redesign

### 4.1 Design System Setup
```bash
pnpm add @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react
```

### 4.2 Component Structure

**Layout Components:**
- `components/layout/DashboardLayout.tsx` - Main dashboard wrapper
- `components/layout/Sidebar.tsx` - Navigation sidebar
- `components/layout/Header.tsx` - Top header with user menu

**Auth Components:**
- `components/auth/LoginForm.tsx` - Email/password login
- `components/auth/SignupForm.tsx` - User registration
- `components/auth/GoogleButton.tsx` - OAuth button
- `components/auth/ProtectedRoute.tsx` - Route protection

**Dashboard Components:**
- `components/dashboard/Stats.tsx` - Quick stats cards
- `components/dashboard/UpcomingMeetings.tsx` - Next 5 meetings
- `components/dashboard/RecentMeetings.tsx` - Past meetings list
- `components/dashboard/QuickActions.tsx` - Upload/Sync buttons

**Meeting Components:**
- `components/meetings/MeetingCard.tsx` - Meeting display card
- `components/meetings/MeetingDetails.tsx` - Full meeting view
- `components/meetings/TranscriptViewer.tsx` - Transcript display
- `components/meetings/SummaryPanel.tsx` - Summary with action points
- `components/meetings/EmailSender.tsx` - Send email modal

**Settings Components:**
- `components/settings/ProfileSettings.tsx` - User profile
- `components/settings/IntegrationSettings.tsx` - OAuth management
- `components/settings/EmailSettings.tsx` - Email preferences
- `components/settings/ApiKeySettings.tsx` - API key management

### 4.3 Page Structure

**Public Pages:**
- `/` - Landing page with features
- `/login` - Login form
- `/signup` - Registration form

**Protected Pages:**
- `/dashboard` - Main dashboard
- `/meetings` - All meetings list
- `/meetings/[id]` - Meeting details
- `/calendar` - Calendar view
- `/settings` - Settings panel
- `/settings/profile` - Profile settings
- `/settings/integrations` - OAuth connections
- `/settings/preferences` - User preferences

### 4.4 Design Guidelines

**Color Palette:**
- Primary: Indigo/Blue (#4F46E5)
- Secondary: Slate (#64748B)
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)
- Background: White/Slate-50
- Text: Slate-900/Slate-600

**Typography:**
- Font: Inter or System UI
- Headings: font-semibold
- Body: font-normal
- Minimal use of font-bold

**Layout:**
- Max width: 1400px
- Padding: p-6 to p-8
- Rounded corners: rounded-lg to rounded-xl
- Shadows: shadow-sm, shadow-md (minimal)
- Spacing: Consistent use of Tailwind spacing scale

**Components Style:**
- Clean borders (border-slate-200)
- Subtle hover states
- Smooth transitions (transition-all duration-200)
- Focus states with ring utilities
- Minimalist icons (lucide-react)

## Phase 5: Feature Implementation

### 5.1 Authentication Flow
1. Implement login/signup pages
2. Add Google OAuth button
3. Handle OAuth callback
4. Setup protected routes
5. Create user session management
6. Add logout functionality

### 5.2 Dashboard Implementation
1. Create main dashboard layout
2. Display user stats (total meetings, summaries)
3. Show upcoming 5 meetings from Calendar
4. List recent processed meetings
5. Add quick action buttons

### 5.3 Meeting Management
1. Upload audio/video interface
2. Process transcription (existing functionality)
3. Generate summaries (existing functionality)
4. Save to database
5. Link to calendar events if available

### 5.4 Gmail Integration Features
1. Send transcript button
2. Send summary button
3. Email template customization
4. Attachment handling (PDF export)
5. Email history tracking

### 5.5 Calendar Integration Features
1. Sync upcoming meetings
2. Display meeting details
3. Link transcripts to calendar events
4. Auto-fetch meeting metadata
5. Calendar webhook setup

### 5.6 Settings Implementation
1. Profile management
2. OAuth connection status
3. Reconnect/disconnect integrations
4. Email preferences toggle
5. API key display/regeneration
6. Notification preferences

## Phase 6: API Routes

### 6.1 Auth Routes
- `POST /api/auth/signup` - Register user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/signout` - Logout user
- `GET /api/auth/session` - Get current session
- `GET /api/auth/callback/google` - OAuth callback

### 6.2 Meeting Routes
- `GET /api/meetings` - List user meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/[id]` - Get meeting details
- `PUT /api/meetings/[id]` - Update meeting
- `DELETE /api/meetings/[id]` - Delete meeting

### 6.3 Gmail Routes
- `POST /api/gmail/send` - Send email
- `POST /api/gmail/send-transcript` - Send transcript email
- `POST /api/gmail/send-summary` - Send summary email
- `GET /api/gmail/status` - Check Gmail connection

### 6.4 Calendar Routes
- `GET /api/calendar/meetings` - Get upcoming meetings
- `GET /api/calendar/sync` - Sync calendar
- `POST /api/calendar/webhook` - Calendar webhook handler
- `GET /api/calendar/status` - Check Calendar connection

### 6.5 Settings Routes
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/disconnect-google` - Revoke OAuth

## Phase 7: Security & Best Practices

### 7.1 Security Measures
- Environment variables for all secrets
- CSRF protection (Better Auth handles this)
- Rate limiting on API routes
- Input validation and sanitization
- SQL injection prevention (Drizzle handles this)
- XSS protection
- Secure session management

### 7.2 Error Handling
- Graceful error messages
- Error boundary components
- API error responses
- Logging for debugging

### 7.3 Performance Optimization
- Database query optimization
- API response caching where appropriate
- Lazy loading components
- Image optimization
- Code splitting

## Phase 8: Testing & Deployment

### 8.1 Testing Checklist
- [ ] Auth flow (signup, login, logout)
- [ ] Google OAuth flow
- [ ] Gmail sending
- [ ] Calendar sync
- [ ] Meeting CRUD operations
- [ ] Settings management
- [ ] Protected routes
- [ ] Mobile responsiveness

### 8.2 Deployment Steps
1. Setup Vercel/Netlify account
2. Configure environment variables
3. Update OAuth redirect URIs for production
4. Deploy application
5. Test production OAuth flow
6. Monitor for errors

## Phase 9: Documentation

### 9.1 User Documentation
- Getting started guide
- Feature walkthrough
- FAQ section
- Troubleshooting guide

### 9.2 Developer Documentation
- Setup instructions
- API documentation
- Database schema
- Environment variables guide

## Implementation Order

### Week 1: Foundation
1. Day 1-2: Database setup, schema design, Drizzle configuration
2. Day 3-4: Better Auth integration, basic auth flow
3. Day 5-7: Google OAuth setup, token management

### Week 2: Core Features
1. Day 1-2: Gmail integration, email sending
2. Day 3-4: Calendar integration, meeting sync
3. Day 5-7: Dashboard layout, basic UI components

### Week 3: UI/UX
1. Day 1-3: Dashboard implementation
2. Day 4-5: Meeting management UI
3. Day 6-7: Settings panel

### Week 4: Polish & Deploy
1. Day 1-2: Testing, bug fixes
2. Day 3-4: UI refinements
3. Day 5: Documentation
4. Day 6-7: Deployment, production testing

## Success Metrics
- [ ] User can sign up with email/password
- [ ] User can login with Google OAuth
- [ ] Gmail integration working
- [ ] Calendar shows upcoming meetings
- [ ] Transcripts can be sent via email
- [ ] Summaries can be sent via email
- [ ] Settings properly manage integrations
- [ ] UI is modern, minimal, and professional
- [ ] Mobile responsive
- [ ] No security vulnerabilities

## Notes
- Keep UI minimal and clean throughout
- Prioritize user experience
- Ensure proper error handling at every step
- Test OAuth flow thoroughly
- Document all environment variables
- Keep code modular and maintainable
