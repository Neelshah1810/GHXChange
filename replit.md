# Overview

This is a Green Hydrogen Credit (GHC) System - a blockchain-based platform for tracking, trading, and auditing green hydrogen credits. The system provides role-based dashboards for producers (who generate hydrogen credits), buyers (who purchase credits), and auditors (who verify transactions and prevent double counting). The application features a React frontend with Express.js backend, PostgreSQL database with Drizzle ORM, and integration with blockchain wallet functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming and responsive design
- **Routing**: Wouter for lightweight client-side routing with role-based page protection
- **State Management**: TanStack Query for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Authentication**: Context-based auth provider with localStorage persistence

## Backend Architecture
- **Framework**: Express.js with TypeScript for REST API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Development Server**: Vite middleware integration for seamless full-stack development
- **API Structure**: RESTful endpoints organized by feature (auth, transactions, credits, certificates)
- **Error Handling**: Centralized error middleware with structured error responses

## Database Design
- **Users Table**: Stores user credentials, roles (producer/buyer/auditor), and wallet addresses
- **Wallets Table**: Manages blockchain wallet addresses, private keys, and credit balances
- **Transactions Table**: Records all credit transfers with blockchain-style transaction hashes
- **Certificates Table**: Tracks green hydrogen production certificates with verification data
- **Schema**: PostgreSQL with UUID primary keys and JSONB fields for flexible data storage

## Authentication & Authorization
- **Role-Based Access**: Three distinct user roles with different dashboard views and permissions
- **Session Management**: JWT-style authentication with localStorage for session persistence
- **Route Protection**: Client-side route guards that redirect unauthorized users to login
- **Wallet Integration**: Each user has an associated blockchain wallet for credit transactions

## Key Features
- **Producer Dashboard**: Issue new credits, view production certificates, track transaction history
- **Buyer Dashboard**: Purchase credits from producers, view compliance certificates, monitor balances
- **Auditor Dashboard**: System-wide transaction verification, reporting tools, prevent double counting
- **Transaction System**: Blockchain-style transaction recording with signatures and verification
- **Certificate Management**: Digital certificates for hydrogen production with cryptographic verification

# External Dependencies

## Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle Kit**: Database migration and schema management tool

## UI & Styling
- **Radix UI**: Headless UI primitives for accessible components
- **TailwindCSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for component variant management

## Development Tools
- **Vite**: Build tool and development server with HMR support
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment integration with runtime error overlay

## Blockchain & Crypto
- **Web3.js**: Ethereum blockchain interaction library
- **eth-account**: Ethereum account and wallet management
- **Cryptography**: RSA key generation and digital signature verification

## Form & Data Handling
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition
- **TanStack Query**: Server state management, caching, and data fetching