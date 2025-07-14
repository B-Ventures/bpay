# replit.md

## Overview

This is a full-stack web application called "getBPay" - a secure, modular split-payment PWA (Progressive Web App) that generates virtual cards from multiple user payment methods. The application is built with modern web technologies and follows a client-server architecture with database persistence.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React-based SPA with TypeScript/JavaScript support
- **Backend**: Node.js/Express API server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build System**: Vite for frontend bundling and esbuild for backend
- **Styling**: TailwindCSS with Radix UI components
- **Authentication**: Passport.js with local strategy
- **Payment Processing**: Stripe integration for card issuing and payments

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript support
- **Build Tool**: Vite with React plugin
- **UI Framework**: Radix UI components with custom theming
- **Styling**: TailwindCSS with custom design tokens
- **State Management**: React hooks with context patterns
- **Payment Integration**: Stripe React components for payment flows

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle with PostgreSQL dialect
- **Authentication**: Passport.js with session management
- **Payment Processing**: Stripe API integration
- **File Uploads**: Multer for handling media uploads

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following main entities:
- **Users**: Authentication and profile management
- **Payment Methods**: Multiple payment source support (cards, bank accounts, digital wallets)
- **Virtual Cards**: Generated cards with funding source allocation
- **Transactions**: Payment processing and tracking
- **System Settings**: Configuration management
- **CMS Content**: Built-in content management system

### Authentication & Authorization
- **Strategy**: Local username/password authentication
- **Session Management**: Express-session with configurable storage
- **Password Security**: Scrypt-based password hashing
- **Role-Based Access**: Admin and user roles with middleware protection

## Data Flow

1. **User Registration/Login**: Users authenticate via username/password
2. **Payment Method Setup**: Users connect various payment sources (cards, bank accounts, etc.)
3. **Virtual Card Creation**: Users create virtual cards funded by multiple sources
4. **Payment Processing**: Virtual cards are used for transactions with automatic fund allocation
5. **Transaction Tracking**: All payments and fund movements are tracked and recorded

## External Dependencies

### Payment Processing
- **Stripe**: Primary payment processor and virtual card issuer
- **Supported Methods**: Credit/debit cards, bank accounts, digital wallets

### Database
- **Neon Database**: PostgreSQL hosting with serverless connection pooling
- **Connection**: WebSocket-based connection for optimal performance

### UI Components
- **Radix UI**: Headless UI components for accessibility
- **TailwindCSS**: Utility-first CSS framework
- **Custom Theming**: JSON-based theme configuration

### Development Tools
- **TypeScript**: Static type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Drizzle Kit**: Database migration management

## Deployment Strategy

### Development
- **Dev Server**: `npm run dev` starts concurrent frontend and backend development servers
- **Database**: `npm run db:push` synchronizes schema changes
- **Type Checking**: `npm run check` validates TypeScript code

### Production Build
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: esbuild compiles TypeScript server to `dist/index.js`
- **Static Assets**: Served from multiple directories (public, dist/public)

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **STRIPE_SECRET_KEY**: Stripe API key for payment processing
- **STRIPE_PUBLIC_KEY**: Stripe publishable key for frontend

### Additional Features
- **Browser Extension**: Planned Chrome extension for payment form detection
- **CMS Integration**: Built-in Henry CMS for content management
- **WordPress Plugin**: WooCommerce integration for e-commerce stores
- **PWA Support**: Progressive Web App capabilities for mobile experience

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```