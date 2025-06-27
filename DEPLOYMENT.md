# GeoScope Deployment Guide

## Overview
This guide covers deploying GeoScope to production using:
- **Frontend**: Vercel (deployed ✅)
- **Backend**: Render.com 
- **Database**: Railway PostgreSQL (existing ✅)
- **Authentication**: Supabase (existing ✅)

## Current Status

### ✅ Completed
- **Frontend**: Successfully deployed to Vercel
  - URL: `https://geoscope-k8id0terk-strannik-works-projects.vercel.app`
  - Build: Working (1.6MB bundle, 445KB gzipped)
  - Status: Ready for production

- **Database**: Railway PostgreSQL running
  - Project: `discerning-purpose`
  - Status: Active and accessible

- **Configuration Files**: Created and committed
  - `render.yaml` - Render.com configuration
  - `vercel.json` - Vercel configuration (in apps/frontend/)

### 🔄 In Progress
- **Backend**: Ready to deploy to Render.com
- **Environment Variables**: Need to be set in Render dashboard
- **Domain Configuration**: Need to update Supabase auth settings

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│   (Vercel)      │───▶│   (Render.com)   │───▶│   (Railway)     │
│                 │    │                  │    │   PostgreSQL    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│  Authentication │    │   Image API      │
│   (Supabase)    │    │   (Mapillary)    │
└─────────────────┘    └──────────────────┘
```

## Deployment Steps

### Step 1: Backend Deployment to Render.com

#### Prerequisites
- Render.com account (free tier available)
- GitHub repository connected to Render
- `render.yaml` file committed to repository

#### Render Configuration (`render.yaml`)
```yaml
services:
  - type: web
    name: geoscope-backend
    env: node
    buildCommand: cd apps/backend && npm install && npx prisma generate
    startCommand: cd apps/backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: MAPILLARY_ACCESS_TOKEN
        sync: false
      - key: FRONTEND_URL
        value: https://geoscope-k8id0terk-strannik-works-projects.vercel.app
```

#### Deployment Process
1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click "New +" → "Web Service"
3. Connect GitHub repository: `whitestrannik/geoscope`
4. Render will auto-detect the `render.yaml` configuration
5. Set environment variables (see Environment Variables section)
6. Deploy

#### Expected Build Process
```bash
# Build commands that Render will execute:
cd apps/backend && npm install && npx prisma generate
cd apps/backend && npm start
```

### Step 2: Environment Variables Setup

#### Render.com Environment Variables
Set these in Render dashboard:

```bash
# Application
NODE_ENV=production
PORT=10000

# Database (Railway)
DATABASE_URL=postgresql://postgres:[PASSWORD]@maglev.proxy.rlwy.net:21023/railway

# Authentication (Supabase)
SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

# Image API
MAPILLARY_ACCESS_TOKEN=[YOUR_MAPILLARY_ACCESS_TOKEN]

# CORS
FRONTEND_URL=https://geoscope-k8id0terk-strannik-works-projects.vercel.app
```

#### Vercel Environment Variables
Update these in Vercel dashboard after backend deployment:

```bash
# Backend API
VITE_BACKEND_URL=[YOUR_RENDER_BACKEND_URL]  # e.g., https://geoscope-backend-xyz.onrender.com

# Authentication (Supabase)
VITE_SUPABASE_URL=[YOUR_SUPABASE_PROJECT_URL]
VITE_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```

### Step 3: Update Frontend Backend URL

After backend deployment, update frontend to use new backend URL:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: `geoscope-app`
3. Go to Settings → Environment Variables
4. Update `VITE_BACKEND_URL` to your new Render backend URL
5. Redeploy frontend

### Step 4: Update Supabase Authentication Settings

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Authentication → Settings
4. Update **Site URL**: `https://geoscope-k8id0terk-strannik-works-projects.vercel.app`
5. Add **Redirect URLs**:
   - `https://geoscope-k8id0terk-strannik-works-projects.vercel.app`
   - `https://geoscope-k8id0terk-strannik-works-projects.vercel.app/**`
6. Save changes

### Step 5: Testing Deployment

#### Health Checks
1. **Backend Health**: Visit `https://[your-render-url]/health`
2. **Frontend**: Visit `https://geoscope-k8id0terk-strannik-works-projects.vercel.app`
3. **Database**: Test through backend API calls
4. **Authentication**: Test login/signup flow

#### Functionality Tests
- [ ] User registration/login
- [ ] Solo game mode
- [ ] Multiplayer room creation
- [ ] Image loading from Mapillary
- [ ] Guess submission and scoring
- [ ] Leaderboard display
- [ ] WebSocket real-time features

## Configuration Files

### Frontend Configuration (`apps/frontend/vercel.json`)
```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Backend Configuration (`render.yaml`)
Located in project root, configured for monorepo structure.

## Database Schema

### Railway PostgreSQL
- **Current Status**: Active and accessible
- **Connection**: Uses `DATABASE_PUBLIC_URL` for external access
- **Schema**: Managed via Prisma migrations
- **Access**: Available to both local development and production

### Prisma Commands
```bash
# Generate client (done during build)
npx prisma generate

# Push schema changes (if needed)
npx prisma db push

# View data
npx prisma studio
```

## Monitoring and Logs

### Render.com
- **Logs**: Available in Render dashboard
- **Metrics**: CPU, memory, and request metrics
- **Health Checks**: Automatic health monitoring

### Vercel
- **Logs**: Available in Vercel dashboard
- **Analytics**: Page views and performance metrics
- **Functions**: Serverless function monitoring

### Railway
- **Database Metrics**: Connection count, query performance
- **Logs**: Database logs and connection info

## Troubleshooting

### Common Issues

#### Backend Deployment Fails
- Check build logs in Render dashboard
- Verify environment variables are set correctly
- Ensure Railway database is accessible from external connections

#### Frontend Can't Connect to Backend
- Verify `VITE_BACKEND_URL` is set correctly in Vercel
- Check CORS settings in backend
- Ensure backend is running and accessible

#### Authentication Issues
- Verify Supabase URLs are correct in both frontend and backend
- Check Supabase auth settings allow your domains
- Ensure JWT tokens are being passed correctly

#### Database Connection Issues
- Verify `DATABASE_URL` uses the public Railway URL
- Check Railway database is running
- Test connection from Render deployment logs

### Useful Commands

```bash
# Check Railway database status
railway status
railway variables

# View Render logs
# (Available in Render dashboard)

# View Vercel logs
vercel logs [deployment-url]

# Test backend locally
cd apps/backend
npm start

# Test frontend locally
cd apps/frontend
npm run dev
```

## Security Considerations

### Environment Variables
- All sensitive data stored in platform environment variables
- No secrets committed to repository
- Different keys for development and production

### Database Security
- Railway PostgreSQL uses encrypted connections
- Access restricted to authorized services
- Regular backups maintained by Railway

### Authentication
- Supabase handles secure authentication
- JWT tokens for API access
- CORS properly configured

## Performance Optimization

### Frontend (Vercel)
- **Bundle Size**: 1.6MB (445KB gzipped)
- **CDN**: Global edge network
- **Caching**: Automatic static asset caching

### Backend (Render)
- **Auto-scaling**: Based on traffic
- **Health Checks**: Automatic restart on failures
- **Connection Pooling**: Prisma connection management

### Database (Railway)
- **Connection Limits**: Monitor concurrent connections
- **Query Optimization**: Use Prisma query optimization
- **Indexing**: Ensure proper database indexes

## Maintenance

### Regular Tasks
- [ ] Monitor application logs
- [ ] Check database performance
- [ ] Update dependencies
- [ ] Review security settings
- [ ] Monitor usage limits

### Backup Strategy
- **Database**: Railway automatic backups
- **Code**: Git repository on GitHub
- **Environment Config**: Documented in this guide

## Support and Resources

### Platform Documentation
- [Render.com Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)

### Project Resources
- **Repository**: `https://github.com/whitestrannik/geoscope`
- **Issues**: GitHub Issues for bug reports
- **Documentation**: `/project-doc` folder

---

## Next Steps After Backend Deployment

1. **Get Backend URL** from Render deployment
2. **Update Frontend Environment Variables** in Vercel
3. **Update Supabase Auth Settings** with production URLs
4. **Test Full Application** end-to-end
5. **Monitor Performance** and fix any issues

## Deployment Checklist

- [ ] Backend deployed to Render.com
- [ ] Environment variables set in Render
- [ ] Frontend environment variables updated in Vercel
- [ ] Supabase auth settings updated
- [ ] Full application tested
- [ ] Performance monitoring enabled
- [ ] Documentation updated with final URLs

---

*Last Updated: December 2024*
*Deployment Status: Frontend Complete, Backend Ready for Deployment* 