# Quick Start Guide - Next Steps

## 🚀 Get Started in 5 Minutes

### Step 1: Environment Setup (2 min)
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your credentials
nano .env.local
```

**Required values:**
- `DATABASE_URL` - From Neon (https://neon.tech)
- `BETTER_AUTH_SECRET` - Run: `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

### Step 2: Database Setup (1 min)
```bash
# Generate and run migrations
pnpm db:generate
pnpm db:migrate

# (Optional) View database
pnpm db:studio
```

### Step 3: Run Application (1 min)
```bash
# Start dev server
pnpm dev

# Open browser
open http://localhost:3000
```

### Step 4: Test Authentication (1 min)
1. Go to http://localhost:3000/signup
2. Create account or use Google OAuth
3. Should redirect to /dashboard

## 📋 Detailed Setup (if needed)

### Neon Database Setup
1. Go to https://neon.tech
2. Sign up/Login
3. Click "Create Project"
4. Copy connection string
5. Paste in `.env.local` as `DATABASE_URL`

### Google Cloud Console Setup
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable APIs:
   - Gmail API
   - Google Calendar API
4. Create OAuth credentials:
   - Type: Web application
   - Redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env.local`

## 🔍 Verify Everything Works

### Check Database
```bash
pnpm db:studio
# Should open browser with database viewer
# Verify tables exist: user, session, account, meeting, etc.
```

### Check Authentication
1. Visit http://localhost:3000/login
2. Try signing up with email/password
3. Check if redirected to /dashboard
4. Try logging out and back in

### Check Google OAuth
1. Click "Continue with Google" on login page
2. Select Google account
3. Approve permissions
4. Should redirect to /dashboard
5. Check if your profile shows in sidebar

## 🐛 Quick Troubleshooting

### "DATABASE_URL not set" error
- Check `.env.local` exists
- Verify `DATABASE_URL` is set
- Try restarting dev server

### "Failed to sign in" error
- Check `BETTER_AUTH_SECRET` is set
- Clear browser cookies
- Try different browser

### Google OAuth not working
- Verify redirect URI matches exactly
- Check Client ID and Secret are correct
- Ensure APIs are enabled in Google Console
- Add yourself as test user

### Database migration errors
- Delete `drizzle` folder
- Run `pnpm db:generate` again
- Check DATABASE_URL format

## 📚 Documentation Reference

- **Full Setup**: See `SETUP.md`
- **Architecture**: See `INSTRUCTIONS.md`
- **Implementation Status**: See `IMPLEMENTATION_SUMMARY.md`
- **Project Info**: See `README.md`

## 🎯 What's Next?

After setup is working:

1. **Explore Dashboard** - Check the UI and navigation
2. **Review Code** - Understand the structure
3. **Check Documentation** - Read through INSTRUCTIONS.md
4. **Plan Integration** - Decide how to connect existing features
5. **Start Coding** - Begin Phase 2 implementation

## 💡 Pro Tips

- Use `pnpm db:studio` frequently to inspect data
- Check browser console for errors
- Use Better Auth's built-in error messages
- Test OAuth flow in incognito mode
- Keep documentation handy

## ✅ Ready to Code?

Once everything above works:
1. ✅ Database connected
2. ✅ Auth working
3. ✅ Google OAuth working
4. ✅ Dashboard loading

You're ready to integrate existing features! See `IMPLEMENTATION_SUMMARY.md` for Phase 2 tasks.

## 🆘 Need Help?

1. Check console errors
2. Review `SETUP.md` troubleshooting
3. Check Better Auth docs: https://better-auth.com
4. Check Drizzle docs: https://orm.drizzle.team
5. Review Google OAuth setup

---

**Time to build**: ~10 minutes total setup time
**Next phase**: Integrate existing audio/transcript features
**Estimated**: 6-9 days for full integration
