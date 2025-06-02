# Frontend Documentation

The frontend is built with React and provides the user interface for the voting application.

## Directory Structure

```
front/
├── src/           # Source code
├── public/        # Static assets
├── build/         # Production build output
├── package.json   # Dependencies and scripts
└── tsconfig.json  # TypeScript configuration
```

## Prerequisites

- Node.js
- Yarn package manager

## Setup

1. Install dependencies:
   ```bash
   make front-install
   ```

## Development

Start the development server:
```bash
make front
```

The development server will be available at `http://localhost:3000`

## Building for Production

Build the frontend for production:
```bash
make build-front
```

The production build will be created in the `build/` directory.

## Available Scripts

- `yarn start` - Start development server
- `yarn build` - Build for production
- `yarn test` - Run tests
- `yarn eject` - Eject from Create React App

## Styling

The project uses Tailwind CSS for styling. Configuration can be found in `tailwind.config.tsx`.

## TypeScript

The project is written in TypeScript. Configuration can be found in `tsconfig.json`.
