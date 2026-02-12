# 🎉 You're All Set! Local Dev Environment is Running

## ✅ What's Running

- **Local Supabase**: http://127.0.0.1:54321
  - Studio (database UI): http://127.0.0.1:54323
  - All migrations applied ✅
  - Seed data loaded ✅
  
- **Dev Server**: http://localhost:3001
  - Connected to LOCAL database
  - Hot reload enabled
  - Running on `dev` branch

## 🚀 Your Workflow

### Daily Development
```bash
# You're already on dev branch, just start coding!
# Make changes to any file
# Changes will auto-reload

# When ready to test
# Open: http://localhost:3001
```

### When Ready to Deploy
```bash
# 1. Commit your changes
git add .
git commit -m "Description of your changes"

# 2. Push to dev branch (creates preview deployment)
git push origin dev
# Preview URL: https://transit-rdd-calculator-git-dev.vercel.app

# 3. When satisfied, merge to main for production
git checkout main
git merge dev
git push origin main
# Production URL: https://transit-rdd-calculator.vercel.app

# 4. Back to dev
git checkout dev
```

## 🛠️ Quick Commands

```bash
# Development
npm run dev                     # Start dev server (already running!)
npm run build                   # Test production build

# Supabase
npm run supabase:studio         # Open database UI
npm run supabase:reset          # Reset database (rerun migrations)
npm run supabase:stop           # Stop Supabase
npm run supabase:start          # Start Supabase

# View Supabase logs
supabase status                 # Check what's running
```

## 📊 Database Access

**Supabase Studio (easiest):**
```bash
npm run supabase:studio
# Opens: http://127.0.0.1:54323
```

**Direct connection:**
```
Host: 127.0.0.1
Port: 54322
Database: postgres
User: postgres
Password: postgres
```

## 🔄 Switching Between Local & Production

**Currently using: LOCAL database** ✅

**To switch to production database:**
1. Edit `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://lwvqkqwtlazaarpxyvon.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-key-from-DEVELOPMENT.md>
   ```
2. Restart dev server

**To switch back to local:**
1. Edit `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
   ```
2. Restart dev server

## 📝 Next Steps

1. **Open the app**: http://localhost:3001
2. **Create an account** (will be in local database)
3. **Make yourself admin** (see below)
4. **Start building!**

### Make Yourself Admin in Local DB

Open Supabase Studio and run:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

## 🎨 What You Can Do Now

- ✅ Develop locally without affecting production
- ✅ Test database changes safely
- ✅ Create/test new features
- ✅ Preview deployments on every push to dev
- ✅ Deploy to production when ready

## 📖 More Info

See `DEVELOPMENT.md` for complete documentation!

---

**Current Status:**
- Branch: `dev` ✅
- Local Supabase: Running ✅
- Dev Server: Running on port 3001 ✅
- Database: Reset with all migrations ✅
