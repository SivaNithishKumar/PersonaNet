# PersonaNet Project Documentation

**Version:** 0.1.0 (from package.json)

### 1. Project Overview

PersonaNet is a Next.js web application focused on a "virtual try-on" experience, leveraging AI for generating images or experiences. The project integrates Genkit for AI functionalities, specifically with Google AI (Gemini), and uses Firebase for hosting.

The initial landing screen is a WhatsApp screen mockup designed to guide users to the main application.

### 2. Technologies Used

*   **Frontend:**
    *   **Next.js:** Version 15.2.3 (React framework with App Router).
    *   **React:** Version 18.3.1.
    *   **TypeScript:** For static typing.
    *   **Tailwind CSS:** For utility-first styling.
    *   **shadcn/ui:** UI components (indicated by `components.json` and various `@radix-ui` dependencies).
    *   **Lucide React:** For icons.
    *   **Recharts:** For charts.
    *   **date-fns:** For date manipulation.
    *   **react-hook-form & Zod:** For form handling and validation.
    *   **Next-Themes:** For theme (dark/light mode) management.
*   **AI & Backend:**
    *   **Genkit:** Version 1.10.0 (AI framework).
    *   **@genkit-ai/googleai:** For integrating Google AI models (e.g., Gemini).
    *   **@google/generative-ai:** Google's generative AI SDK.
*   **Deployment & Hosting:**
    *   **Firebase App Hosting:** Indicated by `apphosting.yaml`.
*   **Development Tools:**
    *   **ESLint & Prettier (implied):** Standard for Next.js projects.
    *   **Turbopack:** Used in the `dev` script for faster development builds.
    *   **patch-package:** For applying patches to npm dependencies.

### 3. Project Structure

```
PersonaNet/
├── .env                     # Environment variables (e.g., GOOGLE_API_KEY)
├── .git/                    # Git repository data
├── .gitignore               # Files and directories ignored by Git
├── .idx/                    # IDX project configuration (likely)
├── .modified                # (Purpose unclear from content)
├── .next/                   # Next.js build output
├── .vscode/                 # VS Code editor settings
├── apphosting.yaml          # Firebase App Hosting configuration
├── components.json          # shadcn/ui configuration
├── docs/                    # Project documentation (e.g., blueprint.md)
├── next-env.d.ts            # Next.js TypeScript environment declarations
├── next.config.ts           # Next.js configuration file
├── node_modules/            # Project dependencies
├── package-lock.json        # Exact dependency versions
├── package.json             # Project metadata, scripts, and dependencies
├── postcss.config.mjs       # PostCSS configuration (for Tailwind CSS)
├── README.md                # Project overview and setup instructions (this file)
├── src/                     # Main source code directory
│   ├── ai/                  # AI-related code (Genkit flows, models)
│   │   ├── dev.ts           # Genkit development server setup (likely)
│   │   ├── genkit.ts        # Main Genkit configuration (plugins, models)
│   │   └── flows/           # Genkit flows
│   │       ├── generate-ai-try-on.ts # AI flow for virtual try-on
│   │       └── validate-image.ts     # AI flow for image validation
│   ├── app/                 # Next.js App Router directory
│   │   ├── favicon.ico      # Application favicon
│   │   ├── globals.css      # Global CSS styles (Tailwind base, custom)
│   │   ├── layout.tsx       # Root layout component
│   │   ├── page.tsx         # Main landing page component (WhatsApp mockup)
│   │   └── (main)/          # Route group for main application section
│   │       ├── layout.tsx   # Layout for the main section
│   │       └── [gender]/    # Dynamic route for gender
│   │           ├── page.tsx
│   │           └── [itemId]/# Dynamic route for item ID
│   │               └── page.tsx
│   ├── components/          # Reusable React components
│   │   ├── GenderSelector.tsx
│   │   ├── Header.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── TryOnClient.tsx  # Client-side component for try-on feature
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   └── lib/                 # Utility functions and libraries
│       ├── products.ts      # Product data (likely)
│       └── utils.ts         # General utility functions (e.g., `cn` for classnames)
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

### 4. Key Configuration Files

*   **`package.json`:**
    *   Defines project scripts: `dev` (starts Next.js dev server with Turbopack), `genkit:dev` & `genkit:watch` (for Genkit development), `build`, `start`, `lint`, `typecheck`.
    *   Lists all project dependencies (frontend, AI, utilities) and devDependencies (types, Genkit CLI, Tailwind).
*   **`next.config.ts`:**
    *   Configures Next.js.
    *   Ignores TypeScript build errors (`ignoreBuildErrors: true`).
    *   Ignores ESLint during builds (`ignoreDuringBuilds: true`).
    *   Configures remote image patterns for `next/image` (e.g., `placehold.co`, `images.unsplash.com`).
*   **`tailwind.config.ts`:**
    *   Sets up Tailwind CSS, including dark mode (`darkMode: ["class"]`).
    *   Defines content paths for Tailwind to scan.
    *   Extends the default theme with custom colors (background, foreground, primary, secondary, accent, destructive, card, popover, border, input, ring, chart, sidebar), border radius, and keyframe animations (`accordion-down`, `accordion-up`).
    *   Includes the `tailwindcss-animate` plugin.
*   **`tsconfig.json`:**
    *   Configures the TypeScript compiler.
    *   Targets ES2017, includes DOM and ESNext libraries.
    *   Enables JSX, module resolution (`bundler`), path aliases (`@/*`).
    *   Includes the `next` TypeScript plugin.
*   **`components.json`:**
    *   Schema for `shadcn/ui`.
    *   Defines style (`default`), RSC (`true`), TSX (`true`).
    *   Specifies Tailwind configuration path, CSS path, base color, and CSS variables.
    *   Sets up aliases for components, utils, UI, lib, and hooks.
*   **`.env`:**
    *   Stores environment variables. Currently shows `GOOGLE_API_KEY`.
*   **`apphosting.yaml`:**
    *   Configures Firebase App Hosting.
    *   Sets `runConfig.maxInstances: 1`.
*   **`postcss.config.mjs`:**
    *   Basic PostCSS setup, primarily for integrating Tailwind CSS.

### 5. Core Functionality & Components (Preliminary)

*   **Routing:** Uses Next.js App Router with nested dynamic routes (e.g., `/[gender]/[itemId]/`).
*   **Layouts:**
    *   `src/app/layout.tsx`: Root layout, likely sets up global providers (e.g., `ThemeProvider`).
    *   `src/app/(main)/layout.tsx`: Layout for the main application section.
*   **Landing Page (`src/app/page.tsx`):** This is the WhatsApp mockup screen.
*   **UI Components (`src/components/`):**
    *   A mix of custom components (`Header`, `ImageUploader`, `TryOnClient`) and `shadcn/ui` components.
    *   `ThemeProvider` and `ThemeToggle` manage light/dark themes.
*   **AI Integration (`src/ai/`):**
    *   Uses Genkit, configured in `src/ai/genkit.ts`.
    *   Defines flows like `generate-ai-try-on` and `validate-image`.
*   **Styling:**
    *   Primarily uses Tailwind CSS, configured in `tailwind.config.ts`.
    *   Global styles are in `src/app/globals.css`.
    *   `shadcn/ui` components are styled according to the theme defined.

### 6. AI Integration (Genkit & Google AI)

*   The project uses Genkit (`genkit`, `@genkit-ai/next`, `@genkit-ai/googleai`) for its AI capabilities.
*   `GOOGLE_API_KEY` in `.env` suggests integration with Google's AI services (likely Gemini via `@google/generative-ai`).
*   AI flows are defined in `src/ai/flows/`, such as `generate-ai-try-on.ts`.
*   A Genkit development server can be run using `npm run genkit:dev` or `npm run genkit:watch`.

### 7. Deployment

*   The `apphosting.yaml` file indicates that the project is configured for deployment on Firebase App Hosting.

### 8. Getting Started

To get started with development:
1.  Ensure you have Node.js (>=18.18.0) and npm installed.
2.  Clone the repository.
3.  Install dependencies: `npm install`
4.  Set up your `.env` file with the necessary API keys (e.g., `GOOGLE_API_KEY`).
5.  Run the development server: `npm run dev` (for Next.js app)
6.  If working with AI flows, run the Genkit development server: `npm run genkit:dev`

The main application landing page (WhatsApp mockup) can be found at `src/app/page.tsx`. The core application logic for the virtual try-on likely resides within the `src/app/(main)/` routes and related components.

### 9. Areas for Further Detail (Pending File Review)

To make this documentation more complete, the following files/areas need a detailed review:

*   **`PersonaNet/src/app/page.tsx`:** Crucial for understanding the landing page (WhatsApp mockup) implementation.
*   **`PersonaNet/src/app/layout.tsx`:** To understand global context providers and overall page structure.
*   **`PersonaNet/src/ai/genkit.ts`:** To detail the Genkit plugin configurations, model initializations, and any core AI setup.
*   **`PersonaNet/src/ai/flows/*.ts`:** To document the specifics of each AI flow (input, output, logic).
*   **`PersonaNet/src/components/TryOnClient.tsx`:** And other key custom components to understand their functionality.
*   **`PersonaNet/src/lib/products.ts`:** To understand the data structure for products used in the app.
*   **`PersonaNet/docs/blueprint.md`:** To incorporate any existing design or architectural notes.
