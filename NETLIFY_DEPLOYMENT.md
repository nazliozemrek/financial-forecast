# Netlify Deployment Guide

## 🚀 Deploy to Netlify

### Step 1: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up/Login with your GitHub account
3. Click "New site from Git"
4. Choose your `financial-forecast` repository

### Step 2: Configure Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Base directory**: (leave empty)

### Step 3: Set Environment Variables
In Netlify dashboard → Site settings → Environment variables, add:

```
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account
```

### Step 4: Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Your site will be available at `https://your-site-name.netlify.app`

## 🔧 Alternative: Railway Deployment

If Netlify doesn't work, try Railway:

### Step 1: Connect to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository

### Step 2: Configure
- Railway will automatically detect it's a Node.js app
- Set environment variables in Railway dashboard
- Deploy automatically

## 🎯 Benefits of Netlify
- ✅ Faster deployments
- ✅ Better serverless function support
- ✅ Automatic HTTPS
- ✅ Easy environment variable management
- ✅ Great React app support

## 📁 Clean File Structure
We now have only essential files:
```
api/
├── create-link-token.js
├── exchange-public-token.js
├── unlink-bank.js
└── transactions.js

lib/
├── plaidClient.js
└── firebaseAdmin.js
```

This should resolve the deployment issues we had with Vercel!
