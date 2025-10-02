# Setup Guide - Meeting Assistant

## Prerequisites
- Node.js 18+ installed
- pnpm package manager
- Neon PostgreSQL account
- Google Cloud Console account

## Step 1: Database Setup

1. **Create Neon Database**
   - Go to https://neon.tech
   - Sign up/Login
   - Create a new project
   - Copy the connection string

2. **Create Environment File**
   ```bash
   cp .env.example .env.local
   ```

3. **Add Database URL to `.env.local`**
   ```env
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   ```

4. **Generate Better Auth Secret**
   ```bash
   openssl rand -base64 32
   ```
   Add to `.env.local`:
   ```env
   BETTER_AUTH_SECRET="your-generated-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

## Step 2: Google Cloud Console Setup

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create a new project
   - Note the project ID

2. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Enable:
     - Gmail API
     - Google Calendar API
     - Google People API

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "Meeting Assistant"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - Add your production URL later

4. **Configure OAuth Consent Screen**
   - Go to "OAuth consent screen"
   - User type: External (for testing) or Internal (for organization)
   - Add required information
   - Add scopes:
     - `userinfo.email`
     - `userinfo.profile`
     - `gmail.send`
     - `calendar.readonly`
   - Add test users (for External type)

5. **Copy Credentials to `.env.local`**
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

## Step 3: API Keys (Optional)

Add your API keys to `.env.local`:
```env
GLADIA_API_KEY="your-gladia-api-key"
GEMINI_API_KEY="your-gemini-api-key"
```

## Step 4: Database Migration

1. **Generate Migration Files**
   ```bash
   pnpm drizzle-kit generate
   ```

2. **Run Migrations**
   ```bash
   pnpm drizzle-kit migrate
   ```

3. **Verify Database**
   ```bash
   pnpm drizzle-kit studio
   ```
   This opens a browser interface to view your database.

## Step 5: Install Dependencies

```bash
pnpm install
```

## Step 6: Run Development Server

```bash
pnpm dev
```

Open http://localhost:3000

## Step 7: Test Authentication

1. Go to http://localhost:3000/signup
2. Create an account with email/password
3. Or click "Continue with Google"
4. After login, you should be redirected to /dashboard

## Step 8: Connect Google Services

1. Go to Dashboard
2. Click on Settings
3. Connect Google Account (if not already connected via OAuth)
4. This will enable:
   - Gmail integration for sending emails
   - Calendar integration for syncing meetings

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if Neon project is active
- Ensure connection pooling is enabled

### Google OAuth Issues
- Verify redirect URI matches exactly
- Check if APIs are enabled
- Ensure test users are added (for External OAuth apps)
- Check if client ID and secret are correct

### Better Auth Issues
- Ensure BETTER_AUTH_SECRET is set
- Verify BETTER_AUTH_URL matches your domain
- Clear browser cookies and try again

### Migration Issues
- Delete `drizzle` folder and regenerate: `pnpm drizzle-kit generate`
- Check DATABASE_URL format
- Ensure Neon database is accessible

## Next Steps

1. **Upload Audio Recording**: Go to /record to upload and transcribe meetings
2. **Sync Calendar**: Connect Google Calendar to see upcoming meetings
3. **Send Emails**: Use Gmail integration to send transcripts and summaries
4. **Configure Settings**: Set up default email recipients and preferences

## Production Deployment

1. **Update Environment Variables**
   - Set production DATABASE_URL
   - Update BETTER_AUTH_URL to production domain
   - Add production redirect URI in Google Console

2. **Deploy to Vercel**
   ```bash
   vercel deploy
   ```

3. **Add Environment Variables in Vercel**
   - Go to Project Settings > Environment Variables
   - Add all variables from .env.local

4. **Update Google OAuth**
   - Add production redirect URI
   - Update authorized domains

## Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Use strong BETTER_AUTH_SECRET (32+ characters)
- [ ] Enable email verification in production
- [ ] Add rate limiting to API routes
- [ ] Review Google OAuth scopes (use minimal required)
- [ ] Enable HTTPS in production
- [ ] Add CORS configuration for API routes
- [ ] Implement proper error handling
- [ ] Add logging for security events

## Features Available

✅ Email/Password Authentication  
✅ Google OAuth Login  
✅ Gmail Integration  
✅ Google Calendar Integration  
✅ Meeting Transcription  
✅ AI Summaries  
✅ Email Sending  
✅ Dashboard with Stats  
✅ Settings Management  
✅ Modern UI with Shadcn  

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the INSTRUCTIONS.md file
3. Check Better Auth documentation: https://better-auth.com
4. Check Drizzle ORM docs: https://orm.drizzle.team
