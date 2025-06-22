# Discord Bot Management Platform - DB 14

## Overview

DB 14 is a comprehensive Discord bot management platform that allows users to create, deploy, and monitor Discord bots with an intuitive web interface. The application provides a full-stack solution with real-time bot management, collaboration features, and code editing capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Discord-themed color scheme
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with WebSocket support for real-time features
- **Authentication**: Discord OAuth integration
- **Session Management**: Express sessions with PostgreSQL store

### Database Architecture
- **Database**: PostgreSQL with Neon serverless connector
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management

## Key Components

### Database Schema
The application uses a relational database with the following core tables:
- **users**: Discord user information and authentication tokens
- **bots**: Bot instances with status tracking and server counts
- **commands**: Bot commands with usage statistics
- **activities**: Activity logs for bot events and system notifications
- **collaborators**: Bot collaboration and permission management

### Authentication System
- Discord OAuth 2.0 integration for user authentication
- Development mode supports password-based authentication
- Session-based authentication with secure token storage
- Automatic token refresh handling

### Real-time Communication
- WebSocket server for real-time bot status updates
- Client-side WebSocket management with automatic reconnection
- Real-time activity feed and bot status synchronization

### Bot Management Features
- Bot creation and deployment workflow
- Real-time bot status monitoring (online/offline)
- Server count tracking and command usage analytics
- Collaborative bot management with role-based permissions
- Integrated code editor for bot development

## Data Flow

### User Authentication Flow
1. User initiates Discord OAuth login
2. Backend exchanges OAuth code for access/refresh tokens
3. User information stored in database with session creation
4. Frontend receives authentication status via API queries

### Bot Management Flow
1. User creates bot through web interface
2. Bot configuration stored in database
3. WebSocket connection established for real-time updates
4. Bot status and metrics streamed to dashboard
5. Activity logs generated for all bot events

### Real-time Updates
1. Bot instances connect via WebSocket to report status
2. Server processes status updates and stores in database
3. Updates broadcast to connected clients
4. Frontend updates UI reactively using query invalidation

## External Dependencies

### Authentication & Discord Integration
- Discord OAuth 2.0 API for user authentication
- Discord API for bot avatar and user information
- Discord CDN for asset delivery

### Database & Hosting
- Neon PostgreSQL for serverless database hosting
- WebSocket support for real-time features
- Session storage in PostgreSQL

### Development & Deployment
- Replit environment with Node.js 20
- PostgreSQL 16 module
- Vite development server with HMR
- ESBuild for production bundling

## Deployment Strategy

### Development Environment
- Replit-based development with live reload
- Vite development server on port 5000
- PostgreSQL database provisioned via Replit modules
- Environment variables managed through Replit secrets

### Production Build
- Vite builds client-side assets to `dist/public`
- ESBuild bundles server code to `dist/index.js`
- Static file serving through Express
- Autoscale deployment target on Replit

### Environment Configuration
- `NODE_ENV` determines development/production behavior
- `DATABASE_URL` for PostgreSQL connection
- Discord OAuth credentials for authentication
- WebSocket and session configuration

## Changelog

```
Changelog:
- June 22, 2025. Initial setup with Discord OAuth and visual block editor
- June 22, 2025. Implemented 24/7 bot hosting system with deployment infrastructure
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```