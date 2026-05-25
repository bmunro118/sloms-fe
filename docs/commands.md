# Project Commands

This document provides a quick reference for common commands used in this project. All commands should be run from the project root unless otherwise specified.

## Installation

### Install all dependencies
```bash
npm install && npm --prefix frontend install
```

## Development (from root)

### Start the application (Interactive)
```bash
npm start
```

### Run on Web
```bash
npm run web
```

### Run on Android
```bash
npm run android
```

### Run on iOS
```bash
npm run ios
```

## Testing & Linting (from root)

### Run tests (Vitest)
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run linting (ESLint)
```bash
npm run lint
```

## Advanced: Frontend Script Proxy
You can run any script defined in `frontend/package.json` directly from the root using the `frontend` script:

```bash
npm run frontend -- <script-name> [args]
```
Example: `npm run frontend -- lint`

## Direct Frontend Commands
If you are working directly in the `frontend` directory:

```bash
cd frontend
npx expo start        # Start Expo
npx expo start --web  # Start on Web
npm run test          # Run tests
npm run lint          # Run linting
```
