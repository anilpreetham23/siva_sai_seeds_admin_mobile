# 🌱 Siva Sai Seeds — Mobile App

> Agricultural seeds & grain trading platform for farmers and managers.  
> Built with **React + Vite + Capacitor** — runs on **Android** and **iOS**.

---

## 📱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Mobile Packaging | Capacitor 7 (Android + iOS) |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Styling | CSS Modules + Vanilla CSS tokens |
| State | React Context + React Query |

---

## 🏗️ Project Structure

```
siva-sai-seeds/
├── src/
│   ├── app/router/       # React Router — role-based routing
│   ├── components/       # Shared UI components (mobile + desktop)
│   │   └── mobile/       # Mobile-specific components (Header, BottomNav, etc.)
│   ├── context/          # Auth, Theme, Language contexts
│   ├── layouts/          # FarmerLayout, AdminLayout, SuperAdminLayout
│   ├── pages/
│   │   ├── public/       # Landing, MarketRates, Seeds Catalog
│   │   ├── auth/         # Login, Register, ForgotPassword
│   │   ├── farmer/       # Farmer portal screens
│   │   ├── manager/      # Manager portal screens
│   │   ├── admin/        # Admin / Super Admin screens
│   │   └── mobile/       # Mobile welcome & shared screens
│   ├── platform/         # Capacitor native bridge (camera, storage, GPS, etc.)
│   └── services/         # Supabase API service layer
├── android/              # Android native project (Capacitor)
├── ios/                  # iOS native project (Capacitor)
├── public/               # Static assets
├── supabase/             # Edge functions & DB migrations
├── capacitor.config.json
├── vite.config.js
└── .env.example          # Copy → .env and fill credentials
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Android Studio (for Android builds)
- Xcode 15+ (for iOS builds, macOS only)
- Java JDK 17+

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your Supabase URL and keys in .env
```

### 3. Run in browser (dev)
```bash
npm run dev
```

### 4. Build for mobile
```bash
# Build web assets
npm run build

# Sync to Android/iOS
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode (macOS)
npx cap open ios
```

---

## 👥 User Roles

| Role | Portal | Access |
|------|--------|--------|
| **Farmer** | `/farmer` | Seed purchases, bookings, grain sales, market rates |
| **Manager** | `/manager` | Farmer management, inventory, visits, billing |
| **Admin / Super Admin** | `/admin` | Full system — users, reports, credits, analytics |

---

## 🔐 Security

- All secrets live in `.env` (never committed)
- Supabase Row Level Security (RLS) enforces data isolation per role
- `SUPABASE_SERVICE_KEY` is **server-side only** — never exposed to the client
- See `.env.example` for required environment variables

---

## 📦 Building the APK

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
# APK → android/app/build/outputs/apk/release/
```

---

## 📄 License

Private — Sri Siva Sai Seeds © 2025
