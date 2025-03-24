# Thena Assignment

## 🌐 Live Demo
[Visit the Application](https://thena-flight-booking.vercel.app/)

## 📝 About the Application
The application features are:
- Flight Search based on "From" and "To" Airports and journey date
- Sorting the flights by price Low to High
- User Profile
- Booking Section
- Coupon Discount Section
- Responsive design for all devices

A modern web application built with Next.js 15, React 19, and Supabase, featuring a beautiful UI powered by Tailwind CSS and Radix UI components.

## 🚀 Features

- Next.js 15 with App Router
- React 19 for modern UI development
- Supabase Authentication and Database
- Beautiful UI components using Radix UI
- Responsive design with Tailwind CSS
- Type safety with TypeScript
- React Query for efficient data fetching

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- Yarn package manager
- A Supabase account and project

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/PratikChakraborty10/thena-flight-booking
cd thena-assignment
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Development

To start the development server:
```bash
yarn dev
```
The application will be available at `http://localhost:3000`

## 🏗️ Build

To create a production build:
```bash
yarn build
```

To start the production server:
```bash
yarn start
```

## 🧰 Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **Payment Processing**: Stripe
- **Development Tools**:
  - ESLint for code linting
  - Prettier for code formatting
  - PostCSS for CSS processing

## 📝 Project Structure

```
├── app/            # Next.js app directory
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── lib/            # Utility libraries
├── public/         # Static assets
├── utils/          # Supabase functions
|-- helpers/api/    # Database queries
└── middleware.ts   # Next.js middleware
```

