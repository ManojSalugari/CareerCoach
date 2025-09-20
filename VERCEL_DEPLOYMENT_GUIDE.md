# 🚀 CareerCoach AI - Complete Vercel Deployment Guide

## 📋 **Prerequisites Checklist**

- [ ] GitHub repository with your CareerCoach AI code
- [ ] Vercel account (free tier available)
- [ ] All API keys ready (provided below)
- [ ] Neon Postgres database (already configured)
- [ ] Clerk authentication setup
- [ ] Google Gemini API access
- [ ] Inngest account for background jobs
- [ ] Upstash Redis for caching (optional but recommended)

---

## 🔑 **Environment Variables Setup**

### **Step 1: Create .env.local for Local Development**

Create a `.env.local` file in your project root with these exact values:

```env
# Database (Neon Postgres)
DATABASE_URL="postgresql://neondb_owner:npg_ga7wpTm6PbSL@ep-wandering-band-a1cnj7q7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_cnVsaW5nLWdydWItOTkuY2xlcmsuYWNjb3VudHMuZGV2JA"
CLERK_SECRET_KEY="sk_test_1qGC09907SfD9U4KhdOIchIwBof4Wokf6iIoVWWOJ9"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/onboarding"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

# AI Services (Google Gemini)
GEMINI_API_KEY="AIzaSyAn83WJggy1sUmLT54vloPmP3nVTUC8cZ0"

# Background Jobs (Inngest)
INNGEST_EVENT_KEY="EAYlxIh_JeeU9LosbgAfYHb8zbNyvuUxT1YQV2YdS3oZVX4r5PtHl5n4U91RMumgq4iyT7VLupRvnNmQ3Lfbxg"
INNGEST_SIGNING_KEY="signkey-prod-fac11fc457c117593a4f420fb7224f8f99c791766a5ba414a4a8ceb0189dfd0e"

# Caching & Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://accepted-ram-7128.upstash.io"
UPSTASH_REDIS_REST_TOKEN="ARvYAAImcDJlZWMxMTg0NWE1ZWI0NmVkYTRkMDUxODk2ZjFhMDcwM3AyNzEyOA"
```

---

## 🚀 **Vercel Deployment Steps**

### **Step 1: Prepare Your Repository**

1. **Ensure your project is on GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment with new features"
   git push origin main
   ```

2. **Verify package.json scripts:**
   ```json
   {
     "scripts": {
       "dev": "next dev --turbopack",
       "build": "prisma generate && next build",
       "start": "next start",
       "lint": "next lint",
       "postinstall": "prisma generate"
     }
   }
   ```

### **Step 2: Deploy to Vercel**

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Import your project:**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure project settings:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

### **Step 3: Set Environment Variables in Vercel**

**CRITICAL:** Add all environment variables before deploying:

1. **In Vercel project settings, go to "Environment Variables"**

2. **Add each variable one by one:**

   | Variable Name | Value | Environment |
   |---------------|-------|-------------|
   | `DATABASE_URL` | `postgresql://neondb_owner:npg_ga7wpTm6PbSL@ep-wandering-band-a1cnj7q7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Production, Preview, Development |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_cnVsaW5nLWdydWItOTkuY2xlcmsuYWNjb3VudHMuZGV2JA` | Production, Preview, Development |
   | `CLERK_SECRET_KEY` | `sk_test_1qGC09907SfD9U4KhdOIchIwBof4Wokf6iIoVWWOJ9` | Production, Preview, Development |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Production, Preview, Development |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Production, Preview, Development |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/onboarding` | Production, Preview, Development |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/onboarding` | Production, Preview, Development |
   | `GEMINI_API_KEY` | `AIzaSyAn83WJggy1sUmLT54vloPmP3nVTUC8cZ0` | Production, Preview, Development |
   | `INNGEST_EVENT_KEY` | `EAYlxIh_JeeU9LosbgAfYHb8zbNyvuUxT1YQV2YdS3oZVX4r5PtHl5n4U91RMumgq4iyT7VLupRvnNmQ3Lfbxg` | Production, Preview, Development |
   | `INNGEST_SIGNING_KEY` | `signkey-prod-fac11fc457c117593a4f420fb7224f8f99c791766a5ba414a4a8ceb0189dfd0e` | Production, Preview, Development |
   | `UPSTASH_REDIS_REST_URL` | `https://accepted-ram-7128.upstash.io` | Production, Preview, Development |
   | `UPSTASH_REDIS_REST_TOKEN` | `ARvYAAImcDJlZWMxMTg0NWE1ZWI0NmVkYTRkMDUxODk2ZjFhMDcwM3AyNzEyOA` | Production, Preview, Development |

3. **Click "Save" after adding each variable**

### **Step 4: Deploy**

1. **Click "Deploy" button**
2. **Wait for build to complete** (usually 2-5 minutes)
3. **Note your deployment URL** (e.g., `https://careercoach-ai.vercel.app`)

---

## 🗄️ **Database Migration (CRITICAL)**

After deployment, you MUST run database migrations:

### **Option A: Using Vercel CLI (Recommended)**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Link your project:**
   ```bash
   vercel link
   # Select your project when prompted
   ```

4. **Pull environment variables:**
   ```bash
   vercel env pull .env.production
   ```

5. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

### **Option B: Manual Migration**

1. **Go to your Neon database console**
2. **Run the SQL from your migration files**
3. **Or use Prisma Studio:**
   ```bash
   npx prisma studio
   ```

---

## 🔧 **Post-Deployment Configuration**

### **Step 1: Configure Inngest Webhook**

1. **Go to [Inngest Dashboard](https://app.inngest.com/)**
2. **Find your app settings**
3. **Set webhook URL to:** `https://your-app-name.vercel.app/api/inngest`
4. **Save configuration**

### **Step 2: Update Clerk Redirect URLs**

1. **Go to [Clerk Dashboard](https://dashboard.clerk.com/)**
2. **Navigate to "Paths" settings**
3. **Add your Vercel domain:**
   - Sign-in URL: `https://your-app-name.vercel.app/sign-in`
   - Sign-up URL: `https://your-app-name.vercel.app/sign-up`
   - After sign-in: `https://your-app-name.vercel.app/onboarding`
   - After sign-up: `https://your-app-name.vercel.app/onboarding`

### **Step 3: Test All Features**

Visit your deployed URL and test:

- [ ] **Authentication** (sign up/sign in)
- [ ] **Onboarding** process
- [ ] **Dashboard** loads correctly
- [ ] **Resume builder** works
- [ ] **Cover letter generator** works
- [ ] **Interview preparation** works
- [ ] **Portfolio builder** works
- [ ] **ATS optimization** works
- [ ] **Notifications** system works
- [ ] **AI features** respond correctly

---

## 🎯 **Custom Domain Setup (Optional)**

### **Step 1: Add Domain in Vercel**

1. **Go to your project settings**
2. **Click "Domains"**
3. **Add your domain** (e.g., `www.careercoach.com`)
4. **Follow DNS configuration instructions**

### **Step 2: Update Clerk Settings**

Update Clerk redirect URLs to use your custom domain instead of Vercel URL.

---

## 🚨 **Troubleshooting Common Issues**

### **Build Failures**

**Error:** `PrismaClient not found`
**Solution:** Ensure `prisma generate` is in your build command

**Error:** `Environment variable not found`
**Solution:** Double-check all environment variables are set in Vercel

### **Runtime Errors**

**Error:** Database connection failed
**Solution:** Verify `DATABASE_URL` is correct and accessible

**Error:** Clerk authentication not working
**Solution:** Check Clerk keys and redirect URLs

**Error:** AI features not working
**Solution:** Verify `GEMINI_API_KEY` is set correctly

### **Performance Issues**

**Issue:** Slow page loads
**Solution:** 
- Enable Vercel Analytics
- Use Redis caching
- Optimize images
- Enable CDN

---

## 📊 **Monitoring & Analytics**

### **Recommended Setup:**

1. **Vercel Analytics** (built-in)
2. **Sentry** for error tracking
3. **Google Analytics** for user behavior
4. **Inngest Dashboard** for background jobs

### **Environment Variables for Monitoring:**

```env
# Add these to Vercel if using monitoring services
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_GA_ID="your-google-analytics-id"
```

---

## 🔒 **Security Checklist**

- [ ] All API keys are secure
- [ ] Database access is restricted
- [ ] Authentication is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is working
- [ ] Error handling is comprehensive
- [ ] HTTPS is enforced
- [ ] CORS is configured correctly

---

## 🎉 **Deployment Complete!**

Your CareerCoach AI is now live! 

**Next Steps:**
1. **Test all features thoroughly**
2. **Set up monitoring**
3. **Configure custom domain** (if desired)
4. **Share with users**
5. **Monitor performance and user feedback**

**Your app URL:** `https://your-app-name.vercel.app`

---

## 📞 **Support**

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test database connectivity
4. Review API key permissions
5. Check Inngest webhook configuration

**Happy deploying! 🚀**
