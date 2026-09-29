# 🚖 Corporate Fleet Dispatch Wall Map & Real-Time Operations Console

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-definition, flight-radar inspired corporate dispatch wall map and real-time fleet operations console built for enterprise corporate transport operations (Aparna Technopolis, Kondapur, Hyderabad).

Designed for large wall-mounted control room displays and dispatcher workstations, this console provides live GPS cab telemetry, multi-tenant coordinate clustering, mandatory women's safety compliance rules, automated escort guard enforcement, panic SOS siren alerts, and OTP-based boarding workflows.

---

## 🌟 Key Features & Architecture

### 1. 📡 Flight-Radar Live Map Canvas
- **High-Performance Vector Canvas**: Custom 2D projection rendering 100+ employee nodes, 32 live cabs, GPS heading chevrons, and active route trajectories at 60 FPS without DOM lag.
- **Flight-Radar Pulse Beacons**: Cabs emit rhythmic sonar pulses with color-coded status rings:
  - 🟢 **Emerald**: Security guard escort on board
  - 🟡 **Yellow**: Standard transit cab
  - 🟠 **Orange**: Security protocol violation / guard required
  - 🔴 **Flashing Red**: Active SOS panic emergency
- **Smart Coordinate Clustering & Radial Blossom**: Automatically collapses overlapping employee coordinates into numbered clusters with click-to-blossom radial petals for individual selection.
- **Dynamic Route Trajectory Vectors**: Dashed trajectory vectors connecting pickup stops with destination facility, complete with directional live GPS heading arrows.

### 2. 🛡️ Women's Safety & Mandatory Security Guard Enforcement
Strict adherence to corporate safety mandates for Hyderabad night shifts and transit:
- **First Pickup Rule (Login / To Office)**: If the first employee boarding the cab is female, a certified security guard escort is mandatory. If absent, a high-priority warning flag is raised: `⚠️ Security Flag: 1st pickup is female without security guard escort`.
- **Last Drop-Off Rule (Logout / From Office)**: If the final employee alighting from the cab is female, a certified security guard escort is mandatory.
- **All-Female Fleet Protocol**: Any cab transporting exclusively female employees requires an assigned escort guard with verified agency credentials.
- **Demo Compliance Scenarios**:
  - `Route R-02`: Configured with all-female passengers and assigned escort guard **Sunitha Rao** (*SIS Security Agency*, Badge `#SEC-8421`).
  - `Route R-04`: Configured with an unescorted female 1st pickup, triggering the safety compliance flag in both the map and the fleet matrix.

### 3. 🚨 Emergency Panic SOS Siren & Incident Protocol
- **Synthesized Web Audio Emergency Siren**: Zero-dependency dual-tone acoustic alarm (960Hz / 770Hz European emergency wail) generated in real time using HTML5 Web Audio API oscillators.
- **Concentric Strobe Radar**: The map canvas pulses with expanding concentric red shockwaves centered on the cab's GPS coordinates.
- **Urgent Incident Response HUD**:
  - Incident ID, real-time timestamp, cab registration, model, and live coordinates.
  - Driver contact details with direct 1-tap call action.
  - Victim passenger profile with direct contact action.
  - One-click `[ 🚨 DIAL POLICE (112) ]` emergency dialer.
  - `[ 🔕 Suppress & Acknowledge Alert ]` to silence the siren while keeping the visual incident banner active for administrative tracking.
  - `[ Resolve & Return to Live Fleet ]` to close the incident and restore normal beacon telemetry.
- **Demo SOS Trigger**: A dedicated `[ 🚨 Trigger SOS Demo ]` button is available strictly in Demo Mode to showcase end-to-end incident workflows without triggering false alarms in production.

### 4. 🧭 Search Isolation & Interactive Route Filtering
- **Employee Search Isolation**: Searching an employee name or ID (e.g., "Priya" or "EMP-042") instantly clears the other 31 routes and 99 employee nodes, isolating only that employee's assigned cab and trajectory path on screen.
- **Map Node Filtering**: Clicking any location cluster on the map auto-filters the right sidepanel and canvas to only the routes serving that stop.
- **Cab Beacon Inspection**: Clicking a blinking cab beacon isolates that route and opens its detailed passenger manifest in the sidebar.
- **Click-to-Reset**: Clicking empty canvas space resets all filters and restores the full 32-cab fleet view.

### 5. 🔄 URL-Driven Shift Management (Demo vs. Live Mode)
- **Live API Mode**:
  - The "To Office / From Office" toggle is **automatically hidden** to prevent accidental dispatch changes in production.
  - Shift direction is driven directly by URL query parameters (e.g., `?type=pickup` or `?type=drop`), with a clean read-only badge in the header.
- **Demo Mode**:
  - Interactive shift toggle (`Login: To Office` vs `Logout: From Office`) updates state and automatically pushes query parameters to the browser URL via `history.pushState`.
- **Supported URL Query Parameters**:
  - `?type=pickup`, `?type=login`, or `?direction=to_office` $\rightarrow$ Morning Login dispatch (Homes ──▶ Corporate HQ).
  - `?type=drop`, `?type=logout`, or `?direction=from_office` $\rightarrow$ Evening Logout dispatch (Corporate HQ ──▶ Homes).

### 6. ⚙️ Configuration & Backend Integration Matrix
Access the `/settings` page to configure:
- **Operation Mode**: Toggle between Demo Mode (mock data) and Live Mode (external APIs).
- **Authentication**: Set the Base API URL and Bearer Authorization Token.
- **Endpoint Contracts**: Complete request and response JSON schemas documented for BE integration:
  - `GET /api/v1/dispatch/routes` — Fleet routes & assigned passenger rosters
  - `GET /api/v1/dispatch/employees` — Scheduled employee locations & shift rosters
  - `GET /api/v1/telemetry/cabs/live` — Real-time GPS stream (coordinates, heading, speed)
  - `POST /api/v1/dispatch/boarding/verify-otp` — Driver/passenger OTP verification
  - `POST /api/v1/dispatch/routes/assign` — Manual route reassignment
  - `GET /api/v1/emergency/sos/active` — Active panic incident polling / webhook

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 16 (App Router)** | Framework, server components, and Turbopack bundler |
| **React 19** | UI components, state management, and hooks |
| **TypeScript** | Strict type safety for coordinates, fleets, and security models |
| **Tailwind CSS v4** | Dark-mode radar aesthetic and responsive layout |
| **HTML5 2D Canvas** | High-performance vector map projection and animations |
| **Web Audio API** | Real-time dual-frequency audio siren generation |
| **Lucide React** | Clean operational iconography |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.17+ or v20+ (recommended: Node v24 LTS)
- **npm** or **pnpm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/dispatch.git
cd dispatch

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the Turbopack development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- To test Login dispatch: [http://localhost:3000/?type=pickup](http://localhost:3000/?type=pickup)
- To test Logout dispatch: [http://localhost:3000/?type=drop](http://localhost:3000/?type=drop)
- To configure API settings: [http://localhost:3000/settings](http://localhost:3000/settings)

### Production Build

```bash
npm run build
npm start
```

---

## ☁️ Deployment on Vercel

### Method 1: Deploy with Vercel CLI (Manual)

1. Install the Vercel CLI globally or use via `npx`:
   ```bash
   npm i -g vercel
   # or
   npx vercel
   ```

2. Log in to your Vercel account:
   ```bash
   npx vercel login
   ```

3. Deploy preview:
   ```bash
   npx vercel
   ```

4. Deploy to production:
   ```bash
   npx vercel --prod
   ```

### Method 2: Deploy via Vercel Web Dashboard (One-Click)

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the `dispatch` repository.
4. Framework Preset will be automatically detected as **Next.js**.
5. Click **Deploy**.

---

## 📁 Project Structure

```
dispatch/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── config/
│   │   │       └── route.ts          # Server-side persistent settings API
│   │   ├── settings/
│   │   │   └── page.tsx              # Settings & API payload contract console
│   │   ├── globals.css               # Radar grid styling & animations
│   │   ├── layout.tsx                # App layout
│   │   └── page.tsx                  # Main interactive wall map dashboard
│   ├── components/
│   │   ├── ControlToolbar.tsx        # Top status bar, mode flags & shift badges
│   │   ├── WallMapCanvas.tsx         # HTML5 2D vector map canvas with radar beacons
│   │   ├── InspectorDrawer.tsx       # Fixed right sidebar with search & route cards
│   │   ├── RouteFleetModal.tsx       # Full fleet matrix modal
│   │   ├── SosEmergencyModal.tsx     # Emergency incident HUD & dialer
│   │   └── DatasetModal.tsx          # Raw JSON dataset viewer/editor
│   ├── data/
│   │   └── mockTelanganaData.ts      # 100 Hyderabad employee locations & 32 routes
│   ├── types/
│   │   ├── config.ts                 # AppConfig, EndpointDefinition, DispatchType
│   │   └── dispatch.ts               # Employee, CabRoute, SecurityGuard, SosAlert
│   └── utils/
│       ├── projection.ts             # Geographic lat/lng to 2D screen projection
│       ├── security.ts               # Women safety rules & escort guard validation
│       └── soundAlert.ts             # Web Audio API emergency siren oscillator
├── package.json
└── README.md
```

---

## 📄 License
This project is licensed under the MIT License.
