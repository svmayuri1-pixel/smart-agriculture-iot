# 🚀 Free Deployment Guide — Smart Agriculture IoT

## Option 1: Railway (Best — Free subdomain + full-stack)

### You get: `https://your-app.up.railway.app` for FREE

### Steps:

**1. Push code to GitHub**
```bash
git init
git add .
git commit -m "Smart Agriculture IoT App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-agriculture.git
git push -u origin main
```

**2. Deploy on Railway**
- Go to https://railway.app
- Click "Start a New Project"
- Choose "Deploy from GitHub repo"
- Select your repository
- Railway auto-detects Node.js and runs `npm run build` then `npm start`

**3. Set environment variables on Railway dashboard**
```
PORT          = (Railway sets this automatically)
JWT_SECRET    = any_long_random_string_here
MQTT_BROKER   = mqtt://broker.hivemq.com
NODE_ENV      = production
```

**4. Your app is live at:**
```
https://smart-agriculture-production.up.railway.app
```

---

## Option 2: Render (Also free)

### You get: `https://your-app.onrender.com` for FREE

### Steps:

**1. Push to GitHub** (same as above)

**2. Deploy on Render**
- Go to https://render.com
- Click "New Web Service"
- Connect your GitHub repo
- Settings:
  - Build Command: `npm install && npm run build`
  - Start Command: `npm start`
  - Environment: Node

**3. Add environment variables** (same as Railway above)

> ⚠️ Free Render apps sleep after 15 min of inactivity.
> Use https://uptimerobot.com (free) to ping it every 10 min to keep it awake.

---

## Option 3: Vercel (Frontend only — not recommended for this app)

Not suitable — Vercel doesn't support WebSocket/Socket.IO or persistent MQTT connections.

---

## After Deployment — Update your ESP32 devices

Once your app is live, update the MQTT broker in your ESP32 sketches:

```cpp
// In esp32_field_sensor.ino, esp32_gps_livestock.ino, esp32_cam_pest.ino
// Change from public broker to your own (optional but recommended):
const char* MQTT_BROKER = "broker.hivemq.com";  // free public broker, works fine
```

The ESP32 devices connect directly to the MQTT broker.
Your Railway/Render server also connects to the same broker.
Data flows: ESP32 → MQTT Broker → Your Server → Dashboard

---

## Custom Domain (Optional — still free)

After deploying to Railway or Render, you can add a custom domain:

### Free subdomain options:
- `smartfarm.is-a.dev` — apply at https://github.com/is-a-dev/register
- `smartfarm.js.org` — apply at https://github.com/js-org/js.org

### Or buy a cheap domain (~$1-10/year):
- https://namecheap.com
- https://cloudflare.com/registrar

Then in Railway/Render dashboard → Settings → Custom Domain → add your domain.
Point your domain's DNS CNAME record to your Railway/Render URL.

---

## Summary

| Platform | URL | Cost | WebSocket | MQTT | Sleep? |
|----------|-----|------|-----------|------|--------|
| Railway  | yourapp.up.railway.app | Free ($5 credit/mo) | ✅ | ✅ | ❌ No sleep |
| Render   | yourapp.onrender.com   | Free                | ✅ | ✅ | ⚠️ Sleeps |
