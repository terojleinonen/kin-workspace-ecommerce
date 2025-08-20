# Kin Workspace E-commerce

**Create Calm. Work Better.**

A modern e-commerce platform for workspace furniture and accessories, built with Next.js 15 and TypeScript.

## Features

- **Modern Design**: Clean, minimal interface following Kin Workspace brand guidelines
- **Product Catalog**: Browse workspace furniture, lighting, seating, and accessories
- **Shopping Cart**: Full cart functionality with context management
- **Responsive**: Optimized for all devices and screen sizes
- **Performance**: Built with Next.js App Router for optimal performance

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Headless UI, Heroicons
- **Animations**: Framer Motion
- **State Management**: React Context

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## Project Structure

```
app/
├── components/          # Reusable UI components
├── contexts/            # React Context providers
├── lib/                 # Utilities and data
├── api/                 # API routes
├── globals.css          # Global styles + Tailwind
├── layout.tsx           # Root layout
└── page.tsx             # Homepage
```

## Brand Guidelines

- **Colors**: Soft white, warm beige, slate gray, matte black
- **Typography**: Satoshi (headings) + Inter (body)
- **Spacing**: Custom section spacing (80px desktop, 40px mobile)
- **Max Width**: 1440px site container

## Development

This project follows clean code principles and includes:

- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component-based architecture
- Responsive design patterns

## License

MIT License - see LICENSE file for details.