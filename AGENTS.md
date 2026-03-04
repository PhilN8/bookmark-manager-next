# AGENTS.md

This file provides guidance to AI assistants when working on code in this repository.

## Project Overview

Bookmark Manager - A Next.js application for managing bookmarks with folders and tags.

## Design Direction

This project draws inspiration from the **Pearl** Framer template - a clean, modern, minimal portfolio design. The aesthetic direction is:

- **Style**: Clean, minimalistic, modern
- **Theme**: Light mode primary, support dark mode
- **Typography**: Distinctive, characterful fonts (avoid generic choices like Inter, Roboto)
- **Color**: Monochromatic with sharp accent colors, dominant colors with accents
- **Motion**: Scroll effects, smooth transitions, micro-interactions
- **Layout**: Generous negative space, refined spacing, grid-based but creative

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

## Frontend Design Guidelines

### Design Thinking

Before coding any frontend component or page:
1. **Understand the purpose** - What problem does this solve? Who is the audience?
2. **Commit to a bold aesthetic direction** - Pick an extreme: minimal, maximalist, retro-futuristic, organic, luxury, playful, editorial, brutalist, etc.
3. **Technical constraints** - Framework (Next.js), performance, accessibility
4. **Differentiation** - What makes this interface memorable?

### Aesthetic Principles

**Typography**:
- Choose distinctive, beautiful fonts that elevate the design
- Avoid generic fonts: Arial, Inter, Roboto, system fonts
- Pair a distinctive display font with a refined body font
- Use typography as a design feature (sizing, weight, spacing)

**Color & Theme**:
- Use CSS variables for consistency
- Commit to a cohesive aesthetic
- Dominant colors with sharp accents beat timid, evenly-distributed palettes
- Support both light and dark themes with careful consideration

**Motion & Animations**:
- Use animations for effects and micro-interactions
- Prioritize CSS-only solutions where possible
- Focus on high-impact moments: staggered reveals, scroll-triggering
- One well-orchestrated animation creates more delight than scattered micro-interactions

**Spatial Composition**:
- Unexpected layouts, asymmetry, overlap
- Generous negative space OR controlled density
- Grid-breaking elements where appropriate

**Visual Details**:
- Create atmosphere and depth (not just solid colors)
- Subtle shadows, layered transparencies, decorative borders
- Contextual effects and textures that match the aesthetic

### What to Avoid

NEVER use:
- Generic AI-generated aesthetics
- Overused fonts (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (purple gradients on white)
- Predictable layouts and component patterns
- Cookie-cutter design lacking character

## Rules

### Testing (Zod & General)

- All tests must be written in TypeScript
- Use Jest for testing framework
- Test both success and failure cases with edge cases
- No log statements (`console.log`, `debugger`) in tests or production code
- Features without tests are incomplete - every new feature or bug fix needs test coverage

#### Jest Best Practices

**Test Environment & Setup**:
- Use `@jest-environment jsdom` pragma for component/React tests to enable DOM APIs (rendering, events)
- Avoid mixing integration (DB-dependent) and unit tests in same suite
- Use `describe.skip` for integration tests when `DATABASE_URL` is unavailable
- Mock external dependencies (e.g., `next/navigation`, API calls) with `jest.mock()`

**Assertions & Mocking**:
- Use `jest.fn()` to track function calls and arguments
- Prefer query methods like `screen.getByRole()`, `screen.getByText()` over container refs
- Use `toHaveAttribute()` for loose matching of URLs (browsers normalize trailing slashes)
- Mock `useRouter()` from `next/navigation` when testing Next.js components

**Async & Timing**:
- Use `renderHook()` from `@testing-library/react` for custom hooks
- Use `jest.useFakeTimers()` and `act()` to control time for debounce/throttle tests
- Use `waitFor()` with appropriate timeout for async operations
- Always clean up fake timers: `jest.useRealTimers()` in afterEach

**High-Coverage Patterns**:
- Test component branches: rendered/not rendered, different states, interactions
- Test both success and error paths (e.g., validation failure, API error)
- Use realistic mock data that matches schema shapes
- Document complex mock setup inline for clarity

**CI/Test Organization**:
- Unit tests (`src/tests/unit/`) for hooks, utilities, schemas—fast, no external dependencies
- Component tests (`src/tests/components/`) for React components—jsdom required
- Feature tests (`src/tests/feature/`) for integration with Prisma—skip without `DATABASE_URL`
- Current coverage target: **50%+ statements; 100% on new/changed code**

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
- Skip DB-dependent tests gracefully when environment is missing (use `describe.skip`)

### Component Development

When creating or editing components:
1. Match implementation complexity to the aesthetic vision
2. For minimalist designs: precision, restraint, careful attention to spacing
3. For maximalist designs: elaborate code with extensive animations
4. Every component should feel genuinely designed, not AI-generated
5. Consider animations, hover states, transitions
6. Use the `cn()` utility for class merging
