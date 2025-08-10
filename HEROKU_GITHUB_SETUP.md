# Heroku + GitHub Integration Setup Guide

## Prerequisites
- ✅ Heroku app created
- ✅ GitHub repository connected to Heroku
- ✅ Automatic deployments enabled

## Step 1: Add PostgreSQL Database

### Option A: Heroku Dashboard
1. Go to your Heroku app dashboard
2. Click "Resources" tab
3. Click "Find more add-ons"
4. Search for "Heroku Postgres"
5. Select "Heroku Postgres" (Mini plan - $5/month)
6. Click "Submit Order Form"

### Option B: Heroku CLI
```bash
heroku addons:create heroku-postgresql:mini -a YOUR_APP_NAME
```

## Step 2: Set Environment Variables

### In Heroku Dashboard:
1. Go to "Settings" tab
2. Click "Reveal Config Vars"
3. Add these variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Tells app to use production settings |
| `JWT_SECRET` | `your-strong-secret-here` | For JWT token security |
| `CORS_ORIGIN` | (leave empty) | Allows all origins in production |

### Generate JWT Secret:
```bash
# In terminal (optional)
openssl rand -base64 32
```

## Step 3: Verify Configuration

### Check Environment Variables:
```bash
heroku config -a YOUR_APP_NAME
```

### Verify PostgreSQL:
```bash
heroku pg:info -a YOUR_APP_NAME
```

## Step 4: Trigger Deployment

### Option A: Automatic (Recommended)
- Make any commit to your GitHub repository
- Heroku will automatically deploy

### Option B: Manual Trigger
1. Go to Heroku dashboard → Deploy tab
2. Click "Deploy Branch" button

## Step 5: Monitor Deployment

### Check App Status:
```bash
heroku ps -a YOUR_APP_NAME
```

### View Logs:
```bash
heroku logs --tail -a YOUR_APP_NAME
```

## Troubleshooting

### If App Still Crashes:

1. **Check Logs:**
   ```bash
   heroku logs --tail -a YOUR_APP_NAME
   ```

2. **Verify Database:**
   ```bash
   heroku pg:info -a YOUR_APP_NAME
   ```

3. **Check Environment Variables:**
   ```bash
   heroku config -a YOUR_APP_NAME
   ```

4. **Common Issues:**
   - Missing `DATABASE_URL` (automatically set by PostgreSQL addon)
   - Missing `JWT_SECRET`
   - `NODE_ENV` not set to `production`

### Database Migration (if needed):
```bash
# Run after successful deployment
heroku run npm run migrate:sqlite-to-postgres -a YOUR_APP_NAME
```

## Success Indicators

✅ App shows "Running" status in Heroku dashboard  
✅ `heroku ps` shows web dyno as "up"  
✅ App responds to requests  
✅ No database connection errors in logs  

## Next Steps

After successful deployment:
1. Test all app functionality
2. Set up admin user: `heroku run node utils/setupOwner.js -a YOUR_APP_NAME`
3. Consider custom domain setup
4. Set up monitoring and alerts
