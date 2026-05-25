# Ledger 360 — Personal Finance OS

Ledger 360 is a modern, full-stack financial operating system designed to go beyond basic expense tracking. It provides a comprehensive suite of tools for managing transactions, budgets, long-term goals, loans, and overall net worth, all wrapped in a premium, responsive "Fintech OS" visual identity.

## The Problem

Most financial tools are built for businesses. Individuals are left with spreadsheets or basic expense apps that track spending but do not build financial clarity. Ledger 360 exists to close that gap, giving individuals the same financial operating visibility that businesses take for granted, built on the same institutional-grade engineering principles.

## 🚀 Features

*   **Smart Upload & AI Parsing:** Drag and drop your bank statements (CSV, Excel, PDF). The system auto-categorizes transactions using intelligent keyword mapping and optional OpenAI GPT-4o Vision integration.
*   **Comprehensive Dashboards:** Live tracking of Cashflow, Savings Rate, and spending velocity. 
*   **Intelligent Budgeting:** Set weekly, monthly, or yearly limits per category with real-time progress bars (Success, Warning, Danger states).
*   **Goal Tracking & Forecasting:** Track savings goals with visual progress rings.
*   **Loan Management:** Track personal loans, interest rates, and monthly payments.
*   **Net Worth Engine:** Real-time aggregation of liquid assets, illiquid assets, and liabilities.
*   **Production-Ready Security:** Full server-side input validation using Zod, scoped database queries via NextAuth, and secure parameterized Prisma operations.

## 🛠️ Tech Stack

*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
*   **Database:** PostgreSQL (hosted on [Neon](https://neon.tech/))
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Authentication:** [NextAuth.js](https://next-auth.js.org/)
*   **Styling:** Vanilla CSS (CSS Modules) + Custom Design System
*   **Validation:** [Zod](https://zod.dev/)
*   **Charts:** [Recharts](https://recharts.org/)

## 📂 Architecture Overview

The codebase is structured for scalability and separation of concerns:

*   `/src/app`: Next.js App Router pages and Server Components (data fetching).
*   `/src/components`: Reusable client-side UI components and layouts.
*   `/src/lib/actions`: Server Actions for database mutations (all protected by `requireAuth` and `Zod`).
*   `/src/lib/validation.ts`: Centralized single source of truth for all form and API validation schemas.
*   `/prisma`: Database schemas and migrations.

## 💻 Local Setup

1.  **Clone the repository**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables:**
    Copy `.env.production.example` to `.env` and fill in your Neon database URLs and NextAuth secret.
    ```bash
    cp .env.production.example .env
    ```
4.  **Initialize the Database:**
    ```bash
    npx prisma db push
    npx prisma generate
    ```
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗺️ Roadmap & Future Enhancements

*   [ ] **Background Job Queues:** Move AI parsing to an asynchronous queue (e.g., Upstash/Redis) for extreme stability with massive PDF files.
*   [ ] **Financial Intelligence:** Implement anomaly detection for unusual spending spikes and recurring bill predictions.
*   [ ] **Rate Limiting:** Protect authentication and upload endpoints against brute-force attacks.

---
*Built with product-minded engineering for the modern web.*
