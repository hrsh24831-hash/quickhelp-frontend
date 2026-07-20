# QuickHelp Frontend Client

This is the frontend web application of **QuickHelp**—a premium, responsive, on-demand service marketplace designed with an UrbanCompany-inspired aesthetic. 

The client is built using React, Vite, and Tailwind CSS, featuring state management via Zustand, map integrations via MapLibre GL, and real-time synchronization through Socket.io.

---

## ✨ Features & Modules

### 👤 User Roles & Auth
- **Multi-Role Support:** Dynamic interfaces customized for **Customers**, **Providers**, and **Admins**.
- **Auth Flow:** Secure OTP login screen with automatic timer-based resend limits and role selection pages.
- **Dev Helper (`/dev-login`):** An embedded development dashboard permitting instant switching between a mockup Customer, Provider, and Admin session without needing SMS/OTP cycles.

### 🛍️ Customer Portal
- **Service Catalog:** Interactive grid search with categories, keyword debouncing, and geographical region filtering.
- **Booking Preview:** Estimation calculator highlighting surge coefficients, base fares, and interactive MapLibre map inputs.
- **Booking History:** Detailed status tracker showing current phase (e.g. `Pending`, `Assigned`, `In Progress`, `Completed`, `Cancelled`) with options to start chat or request disputes.
- **Live GPS Tracking:** High-fidelity MapLibre coordinate rendering of assigned provider positions using openfreemap tiles, live connection status indicators, and autopan safety locks.

### 🛵 Provider Dashboard
- **Booking Queue:** Job requests panel displaying active listings, quick accept buttons, and action panels.
- **Earnings & Payouts:** Analytics showing historical jobs, total revenue, and payout trigger forms.
- **Onboarding Verification:** Document upload interface for onboarding profiles.

### 👑 Admin Control Panel
- **Dashboard & Revenue:** Summary charts tracking transactional activities, booking volume, and provider earnings.
- **Service Manager:** Full CRUD interface to add, modify, delete, or suspend services.
- **Surge Engine:** Configurator for dynamic pricing multipliers based on active hours and zone boundaries.
- **Operations:** Management panels for pending provider credentials verification, dispute resolution, and payouts settlements.

---

## 🛠️ Tech Stack

- **Core Framework:** [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling:** [Tailwind CSS v3](https://tailwindcss.com/) & Vanilla CSS
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (with local storage persistence)
- **Routing:** [React Router DOM v7](https://reactrouter.com/)
- **Charts & Visuals:** [Recharts](https://recharts.org/), [Framer Motion](https://www.framer.com/motion/), [Lottie React](https://github.com/gamerson/lottie-react)
- **Mapping:** [MapLibre GL](https://maplibre.org/) & [React Map GL](https://visgl.github.io/react-map-gl/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **API Communication:** Axios & Socket.io-client

---

## 📁 Repository Structure

```filepath
quickhelp-frontend/
├── public/             # Static assets and icons
├── src/
│   ├── api/            # Axios interceptors and endpoints
│   ├── assets/         # Images, illustrations, and Lottie animations
│   ├── components/     # App-wide UI structures (Navbar, ProtectedRoute)
│   ├── features/       # Feature-specific routes & components
│   │   ├── admin/      # Surge pricing config, service CRUD, verifications
│   │   ├── auth/       # OTP Verification & Login flows
│   │   ├── chat/       # Live in-app messaging component
│   │   ├── customer/   # Catalog, Estimation Preview, Tracking view
│   │   ├── payment/    # Razorpay checkout wrapper
│   │   ├── provider/   # Verification uploads, Booking queue, Earnings
│   │   └── tracking/   # MapLibre GPS tracking component
│   ├── hooks/          # Custom hooks (useChat, useTracking)
│   ├── store/          # Zustand global state (authStore)
│   ├── utils/          # Formatting helpers (currencies, date-times)
│   ├── App.css         # Custom animations & utility classes
│   ├── App.jsx         # App router config & layout
│   └── main.jsx        # App mounting point
├── package.json        # Dependencies & running scripts
├── tailwind.config.js  # Tailwind design system configuration
└── vite.config.js      # Vite compilation settings
```

---

## 🚀 Getting Started

### 1. Installation
Navigate to the directory and install dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root of `quickhelp-frontend/`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000
VITE_ENABLE_DEV_LOGIN=true
```

### 3. Run Development Server
Start the local server:
```bash
npm run dev
```
The application will default to running on [http://localhost:5173](http://localhost:5173).

### 4. Build for Production
To build static production files:
```bash
npm run build
```
Preview the built files locally:
```bash
npm run preview
```
