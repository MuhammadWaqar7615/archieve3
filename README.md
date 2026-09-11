# WowCar Notification Manager

Production-ready Next.js administrator portal for managing, automating, and monitoring push notifications for the WowCar car buying and selling platform.

---

## 🎨 Brand Design Identity

- **Primary Accent**: `#FF9540` (CTA buttons, active navigation links, active tabs, focus rings, primary chart series)
- **Secondary Surface**: `#1B2935` (Sidebar background, dark headings, high-contrast panels)
- **Page Background**: `#F7F8FA`
- **Cards**: `#FFFFFF`
- **Borders**: `#E6E8EC`
- **Main Text**: `#1B2935`
- **Muted Text**: `#6B7280`

---

## 🔒 Security & Architecture Overview

```
Browser (React Client)
        ↓
Next.js BFF (/api/auth/login)
        ↓
WordPress REST API (POST /wp-json/wowcar-admin/v1/login)
        ↓
wp_authenticate() & manage_options verification
        ↓
8-hour Portal Bearer Token
        ↓
Encrypted HTTP-Only Server Session Cookie
        ↓
Next.js Protected BFF Routes (/api/admin/*)
        ↓
WordPress Admin REST API (GET/POST /wp-json/wowcar-admin/v1/*)
```

### Security Rules Enforced
1. **Normal WordPress Credentials**: Administrators log in using their normal WordPress username & password.
2. **`manage_options` Capability**: Only WordPress users with administrator permissions are authorized.
3. **HTTP-Only Session**: The portal Bearer token is stored inside an encrypted HTTP-only session cookie (`aes-256-gcm`). Browser JavaScript never accesses the raw token.
4. **Zero Password Persistence**: Normal WordPress passwords are cleared from memory immediately after login and are never stored in `localStorage`, cookies, logs, or environment variables.
5. **No Client-Side Secrets**: Secrets (like `SESSION_SECRET` and OneSignal REST API keys) are kept server-side and never exposed via `NEXT_PUBLIC_*` variables.
6. **Token Header Fallback**: Server-to-server calls attach `Authorization: Bearer <portalToken>` and fallback header `X-WowCar-Portal-Token: <portalToken>`.
7. **Clean Session Expiration**: If a request receives an HTTP `401` or `403` (or when the 8-hour token expires), the local session is cleared and the browser is redirected to `/login`.

---

## 🛠️ Environment Setup

Create `.env.local` in the project root:

```env
WOWCAR_WORDPRESS_URL=https://user110.wowcar.co.th/wp-json
SESSION_SECRET=your_32_character_minimum_random_secret_string
NEXT_PUBLIC_USE_MOCK_API=false
```

---

## 🚦 Development & Production Commands

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Production Build
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

---

## 📡 WordPress Admin API v1.8.x Endpoints

- `POST /wowcar-admin/v1/login` (Authentication & token issuance)
- `POST /wowcar-admin/v1/logout` (Token revocation)
- `GET /wowcar-admin/v1/dashboard` (KPI statistics)
- `GET /wowcar-admin/v1/analytics/chart` (Performance charts)
- `GET /wowcar-admin/v1/notifications` (Notification history)
- `GET /wowcar-admin/v1/notifications/recent` (Recent notifications)
- `GET /wowcar-admin/v1/notifications/{id}` (Notification detail)
- `POST /wowcar-admin/v1/send` (Queue notification dispatch)
- `GET /wowcar-admin/v1/users` (Registered app users)
- `GET /wowcar-admin/v1/listings` (Vehicle directory sync)
- `GET /wowcar-admin/v1/makes` & `GET /wowcar-admin/v1/models` (Follow alerts)
- `GET /wowcar-admin/v1/audience` (Audience stats)
- `GET /wowcar-admin/v1/automation` (Trigger rules)
- `GET /wowcar-admin/v1/queue` (Delivery logs)
- `GET /wowcar-admin/v1/campaigns` & `GET /wowcar-admin/v1/templates` (Read-only endpoints)
- `GET /wowcar-admin/v1/health` (Operational status)
