# AGENTS.md

This file provides guidance to AI assistants when working with code in this repository.

## Project Overview

Bookmark Manager - A Next.js application for managing bookmarks with folders and tags.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:local` - Build with local environment
- `npm run build:prod` - Build with production environment
- `npm run db:setup` - Run database migrations
- `npm run db:migrate` - Deploy migrations
- `npm run db:push` - Push schema to database
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage

## Rules

### Testing (Zod & General)

- All tests must be written in TypeScript
- Use Jest for testing framework
- Test both success and failure cases with edge cases
- No log statements (`console.log`, `debugger`) in tests or production code
- Features without tests are incomplete - every new feature or bug fix needs test coverage

### Zod Validation

- Use `safeParse()` instead of `parse()` for validation (never throw on invalid input)
- Test both successful parses and validation failures
- Test edge cases: empty strings, max lengths, invalid formats
- Define reusable schemas in `src/lib/schemas.ts`
- Use custom error messages for better UX

### Code Style

- Follow existing patterns in the codebase
- Use TypeScript strictly
- Use Zod for runtime validation
- Keep validation logic centralized in schemas

### Database

- Use Prisma for database operations
- Follow migrations carefully - ensure backward compatibility
- Test database operations with proper setup/teardown
