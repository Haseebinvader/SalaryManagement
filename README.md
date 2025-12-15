# Salary Management App

A professional Next.js application for managing employee salaries with admin authentication.

## Features

- **Single Admin Login**: Only one user can access the system.
- **Employee Management**: Add, edit, and delete employees with detailed salary information.
- **Salary Components**:
  - Earnings: Basic pay, Product rebate, Points rebate, Performance rebate (gross pay)
  - Deductions: House rent, Food expense, Loan deduction
- **Loan Management**: Track loan amounts and update repayments.
- **Branch Management**: Categorize employees into branches.
- **Terms and Conditions**: Display company rules, including resignation penalties.
- **Authentication**: Secure login with NextAuth and JWT.
- **Responsive UI**: Built with Material-UI for a professional interface.

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your MongoDB URI and NextAuth secret.

5. Seed the admin user:
   ```bash
   npx tsx scripts/seedAdmin.ts
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to access the app.

### Default Admin Credentials

- Email: admin@example.com
- Password: admin123

## Usage

- **Login**: Use the admin credentials to log in.
- **Dashboard**: Manage employees, branches, and view terms.
- **Employees**: Add/edit employee details, including salary components and loan information.
- **Branches**: Create and manage branches for employee categorization.
- **Terms**: View company policies and rules.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

- `app/` - Next.js app router pages and API routes
- `lib/` - Database connection
- `models/` - Mongoose schemas
- `components/` - Reusable React components
- `scripts/` - Utility scripts

## Technologies Used

- Next.js 16
- TypeScript
- MongoDB with Mongoose
- NextAuth.js
- Material-UI
- React Hook Form

## Deployment

Build the app for production:

```bash
npm run build
npm run start
```

For deployment to Vercel or other platforms, ensure environment variables are set.
