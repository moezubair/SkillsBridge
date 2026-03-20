# Frontend — UniPath

React + TypeScript + Vite frontend with Tailwind CSS v4, Radix UI, and shadcn/ui components.

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui base components
│   │   │   ├── figma/               # Figma-specific components
│   │   │   ├── filter-pill.tsx
│   │   │   ├── match-checklist-row.tsx
│   │   │   ├── nav-bar.tsx
│   │   │   ├── priority-action-card.tsx
│   │   │   ├── program-card.tsx
│   │   │   ├── progress-stepper.tsx
│   │   │   └── status-badge.tsx
│   │   ├── screens/
│   │   │   ├── landing.tsx          # Landing page
│   │   │   ├── profile-wizard.tsx   # Profile wizard flow
│   │   │   ├── processing.tsx       # Processing screen
│   │   │   ├── results-dashboard.tsx# Results dashboard
│   │   │   ├── program-detail.tsx   # Program detail view
│   │   │   ├── study-plan.tsx       # Study plan view
│   │   │   └── not-found.tsx        # 404 page
│   │   ├── data/
│   │   │   └── mock-data.ts         # Mock data for development
│   │   ├── routes.ts               # Route definitions
│   │   └── App.tsx                  # Root app component
│   ├── styles/
│   │   ├── index.css                # Global styles
│   │   ├── tailwind.css             # Tailwind imports
│   │   ├── theme.css                # Theme variables
│   │   └── fonts.css                # Font imports
│   └── main.tsx                     # Application entry point
├── index.html
├── vite.config.ts
├── postcss.config.mjs
├── package.json
└── .gitignore
```

## Tech Stack

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool and dev server
- **Tailwind CSS v4** — Utility-first CSS
- **Radix UI** — Accessible headless components
- **shadcn/ui** — Pre-built component library
- **React Router v7** — Client-side routing
- **React Hook Form** — Form handling
- **Recharts** — Charts and data visualization
- **Motion** — Animations
- **Sonner** — Toast notifications

## Setup

### Prerequisites

- Node.js (v18+)
- npm

### Install dependencies

```bash
cd frontend
npm install
```

### Start development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Path Aliases

`@` is aliased to `./src`, so you can import like:

```tsx
import { Button } from "@/app/components/ui/button";
```

## Screens

| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Landing | Landing page |
| `/profile-wizard` | Profile Wizard | Multi-step profile setup |
| `/processing` | Processing | Loading/processing state |
| `/results` | Results Dashboard | Program match results |
| `/program/:id` | Program Detail | Individual program view |
| `/study-plan` | Study Plan | Personalized study plan |
| `*` | Not Found | 404 page |

## Adding New Screens

1. **Create the screen component**

```tsx
// src/app/screens/my-screen.tsx
export default function MyScreen() {
  return <div>My Screen</div>;
}
```

2. **Add the route** in `src/app/routes.ts`

3. **Register in App.tsx** if needed
