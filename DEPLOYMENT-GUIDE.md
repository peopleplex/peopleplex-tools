# 🚀 PRODUCTION DEPLOYMENT GUIDE

## ✅ WHAT'S IN THIS PACKAGE

**Production-ready version with API proxy:**

```
peopleplex-production/
├── api/
│   └── generate.js        ← Vercel serverless function (API proxy)
├── src/
│   ├── main.jsx
│   └── JourneyAudit.jsx   ← Updated to use proxy
├── public/
│   └── favicon.svg
├── package.json
├── vite.config.js
├── index.html
└── .env.example           ← Environment variable template
```

---

## 🔑 STEP 1: SET UP ANTHROPIC API KEY IN VERCEL

### 1.1 Get Your API Key

Already have it? Great! It looks like: `sk-ant-api03-...`

Don't have it? Get it from: https://console.anthropic.com/settings/keys

### 1.2 Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Click your project: **peopleplex-tools**
3. Click **Settings** tab
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**

Fill in:
```
Name:  ANTHROPIC_API_KEY
Value: sk-ant-api03-YOUR-ACTUAL-KEY-HERE
```

6. Click **Save**

**IMPORTANT:** Select "All" for environments (Production, Preview, Development)

---

## 📤 STEP 2: DEPLOY TO GITHUB

### 2.1 Clear Your Repo

Go to: github.com/YOUR-USERNAME/peopleplex-tools

Delete ALL existing files (or delete repo and create fresh one)

### 2.2 Upload New Files

1. Extract the production package
2. Open `peopleplex-production` folder
3. Upload ALL files and folders to GitHub:
   - api/ folder
   - src/ folder
   - public/ folder
   - All root files (package.json, etc.)

4. Commit changes

---

## ⚙️ STEP 3: VERCEL AUTO-DEPLOYS

Vercel will automatically:
1. Detect the new files
2. See the `/api` folder → enable serverless functions
3. Build your React app
4. Deploy everything
5. Use the ANTHROPIC_API_KEY from environment variables

Wait 2-3 minutes for deployment to complete.

---

## 🧪 STEP 4: TEST

### 4.1 Test the API Proxy

Visit: https://peopleplex-tools.vercel.app/api/generate

You should see: `{"error":"Method not allowed"}`

This is GOOD - it means the API function is deployed and responding.

### 4.2 Test the Tool

1. Visit: tools.peopleplex.one
2. Start the Journey Audit
3. Complete Step 1 (Describe your business)
4. Click Continue
5. **Personas should generate** ✅

If personas generate = SUCCESS! 🎉

---

## ❌ TROUBLESHOOTING

### Error: "Failed to generate personas"

**Check:**

1. Is ANTHROPIC_API_KEY set in Vercel?
   - Settings → Environment Variables
   - Should show: `ANTHROPIC_API_KEY` (value hidden)

2. Did you redeploy after adding the key?
   - Deployments tab → Click "Redeploy"

3. Is the API key valid?
   - Test at: https://console.anthropic.com/settings/keys
   - Should show "Active"

### Error: "API key not configured"

The environment variable isn't set.

**Fix:**
1. Vercel → Settings → Environment Variables
2. Add ANTHROPIC_API_KEY
3. Redeploy

### API function not found (404)

The `/api` folder didn't deploy.

**Fix:**
1. Make sure `/api` folder uploaded to GitHub
2. Should contain `generate.js`
3. Vercel auto-detects it as serverless function

---

## 🎯 COMPLETE CHECKLIST

```
☐ Have Anthropic API key
☐ Add ANTHROPIC_API_KEY to Vercel environment variables
☐ Delete old files from GitHub
☐ Upload new production package to GitHub
☐ Wait for Vercel to deploy (2-3 min)
☐ Test: Visit tools.peopleplex.one
☐ Test: Complete Step 1 → Personas generate ✅
☐ Test: Check Google Sheets for leads
☐ Test: Check WhatsApp for notifications
☐ LAUNCH ✅
```

---

## 💰 COST

**Anthropic API Free Tier:**
- 5 million tokens/month FREE
- Each persona generation: ~1,000 tokens
- = 5,000 free persona generations/month
- More than enough for testing and launch

**Vercel:**
- Serverless functions: FREE (up to 100GB-hours/month)
- Your usage: ~0.1GB-hours/month
- = FREE

**Total cost: ₹0** ✅

---

## 🎉 AFTER LAUNCH

Once working:
1. Share tools.peopleplex.one on LinkedIn
2. Message 10 business owners
3. Leads flow into Google Sheets
4. WhatsApp notifications for every lead
5. Follow up and close clients

---

## 📞 NEED HELP?

If deployment fails:
1. Screenshot the error
2. Check Vercel deployment logs
3. Check browser console (F12)
4. Send me the error details

---

**Your tool is production-ready. Deploy and launch!** 🚀
