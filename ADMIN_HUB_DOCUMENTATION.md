# 🏛️ Unified Admin Parent Hub Documentation

Welcome to the **CSA Kirinyaga Admin Command Center**. We have unified all administrative panels created by different collaborators into a single, cohesive experience.

## 🗺️ Navigation Structure

The Admin Hub is now located at the `/admin` route. All legacy admin panels have been integrated as modules (pages) within this hub.

### 1. Dashboard (The Overview)
- **Path**: `/admin`
- **Purpose**: Provides a high-level snapshot of the church's health, including total members, recent donations, and engagement trends.
- **Maintainer**: System Core

### 2. Officials Management (Legacy: Officials Admin)
- **Path**: `/admin/officials-hub`
- **Purpose**: Specialized dashboard for managing CSA and Jumuiya officials, including archiving terms and exporting data to XLSX.
- **Original Path**: `/admin/officials` (now redirected)

### 3. Devotions & AI (Legacy: Quiz Admin)
- **Path**: `/admin/devotions-hub`
- **Purpose**: AI-powered question generator for spiritual growth and Jumuiya performance tracking.
- **Original Path**: `/admin/quiz` (now redirected)

### 4. Records Explorer (Legacy: Database Modal)
- **Path**: `/admin/records`
- **Purpose**: A full-page database explorer allowing direct CRUD operations on all system tables (Members, Events, Projects, etc.).
- **Original Component**: `Landing/components/AdminPanel.tsx`

### 5. Donation Monitor
- **Path**: `/admin/donations`
- **Purpose**: Real-time tracking of M-Pesa STK Push transactions. Monitor "Paid", "Failed", and "Pending" states.

---

## 🛠️ Developer Guide: Adding New Admin Pages

To add a new administrative feature, follow these steps:

1. **Create your component** in `src/pages/Admin/pages/`.
2. **Add a link** to the `menuItems` array in `src/pages/Admin/UniversalAdmin.tsx`.
3. **Define the route** in `src/App.tsx` inside the nested `/admin` group.



## 🔐 Security
- Access to `/admin` and its sub-routes is gated by the `ProtectedRoute` component.
- In production, only users with the `admin` role can see the navigation buttons.
- In development (`npm run dev`), a yellow **"Dev Admin"** button is provided for easier testing.
