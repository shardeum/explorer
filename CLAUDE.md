# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shardeum Explorer is a blockchain data indexing and visualization platform for the Shardeum Network. It consists of three main services:
- **Collector**: Gathers blockchain data from the distributor
- **Server**: Provides REST APIs and Next.js web interface
- **Aggregator**: Calculates statistical data

## Essential Commands

### Development
```bash
npm install           # Install dependencies
npm run prepare       # Compile TypeScript (required before running)
npm run dev           # Start Next.js development server
npm run server:watch  # Start backend server with auto-reload
```

### Testing & Code Quality
```bash
npm run test          # Run tests
npm run lint          # Run ESLint
npm run format-check  # Check code formatting
npm run fix           # Fix linting and formatting issues
```

### Production Services
```bash
npm run collector     # Start data collector service
npm run server        # Start API/UI server (default port: 6001)
npm run aggregator    # Start statistics aggregator
```

### Build & Release
```bash
npm run build         # Build Next.js frontend
npm run build:release # Full build (TypeScript + Next.js)
npm run flush         # Clean database files
```

## Architecture & Code Structure

### Backend Architecture
- **Framework**: Fastify.js with TypeScript
- **Database**: SQLite3 (db.sqlite3 for main data, statsDB.sqlite3 for statistics)
- **Messaging**: RabbitMQ for inter-service communication
- **Real-time**: Socket.io for WebSocket connections

Key backend modules:
- `/src/server.ts` - Main API server entry point
- `/src/collector.ts` - Blockchain data collection service
- `/src/aggregator.ts` - Statistics calculation service
- `/src/storage/` - Database models and data access layer
- `/src/stats/` - Statistics calculation logic
- `/src/routes/` - API endpoint definitions

### Frontend Architecture
- **Framework**: Next.js with React and TypeScript
- **Styling**: SCSS modules (`.module.scss`)
- **Data Fetching**: SWR hooks for API calls
- **Charts**: Highcharts for visualizations

Key frontend structure:
- `/src/pages/` - Next.js page routes
- `/src/frontend/api/` - API hooks using SWR
- `/src/frontend/components/` - Reusable UI components
- `/src/frontend/[feature]/` - Feature-specific components (account, transaction, cycle, etc.)

### Code Style
- **Formatting**: Prettier with single quotes, no semicolons, 120-char lines
- **Linting**: Google TypeScript Style (gts)
- **Components**: React functional components with TypeScript
- **Imports**: Use relative imports within modules

### Configuration
Main configuration is in `/src/config/index.ts`. Key settings:
- `distributorInfo` - Connection to blockchain distributor
- `collectorInfo` - Collector service identity
- `rpcUrl` - JSON-RPC server endpoint

### Development Workflow
1. Always run `npm run prepare` after pulling changes
2. Use `npm run fix` to auto-fix linting/formatting issues
3. Test files go in `/test/` directory
4. Frontend components should have accompanying SCSS modules
5. API routes follow RESTful conventions in `/src/routes/`

### Database Schema
The project uses SQLite with models defined in `/src/storage/`:
- Accounts, Transactions, Cycles, Receipts
- Original transaction data stored alongside decoded data
- Statistics stored in separate statsDB.sqlite3

### Service Dependencies
- Requires running Shardeum distributor and JSON-RPC server
- Uses RabbitMQ for message queuing between services
- Services can be managed with PM2 in production