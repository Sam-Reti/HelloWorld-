# CLAUDE.md

## Project Overview

Angular 21 social app with Firebase backend (Firestore, Auth, Hosting, Functions).

## Tech Stack

- **Framework**: Angular 21 (standalone components)
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **Auth/DB client**: @angular/fire
- **Testing**: Vitest (`ng test`)
- **Hosting**: Firebase Hosting

## Commands

```bash
npm start          # dev server at localhost:4200
npm run build      # production build → dist/dev-world-v1/browser/
npm test           # run unit tests with Vitest
firebase deploy    # deploy hosting + functions
```

## Code Style

- Prettier: `printWidth: 100`, `singleQuote: true`, angular HTML parser
- Package manager: npm

## Project Structure

```
src/app/
  services/        # postservice.ts, user.ts, scroll.service.ts
  auth/            # auth guard/service
  feed/            # main feed
  home/            # home/landing
  app-home/        # app shell
  profile/         # user profiles
  editprofile/     # profile editing
  login/ signup/   # auth pages
  external-nav/    # external navigation
  background-image/
src/environments/  # environment.ts, environment.prod.ts
functions/         # Firebase Cloud Functions
```

## Key Patterns

- Standalone components (no NgModules)
- @angular/fire for all Firebase interactions
- Markdown rendered via `marked` + sanitized with `dompurify`

## Engineering Rules

1. **Design With Interfaces First**
   - Define clear contracts using interfaces or types before building implementations.
   - Depend on abstractions to keep components and services flexible.
   - Embrace loose coupling for easier testing and reuse.

2. **Give Every Piece One Clear Purpose**
   - Each function, class, and component should own one well-defined responsibility.
   - When multiple concerns emerge, split them into focused units.
   - Clarity of purpose makes code easier to read and maintain.

3. **Write Pure Functions With Safe Defaults**
   - Favor deterministic, side-effect-free functions for predictable behavior.
   - Use default parameters to keep logic clean and straightforward.
   - Let dependencies be explicit so the code is easy to follow.

4. **Keep Files Lean and Focused**
   - Aim for TypeScript/logic files under 300 lines.
   - Aim for HTML/template files under 100 lines.
   - Proactively refactor as files grow — smaller files are easier to navigate.

5. **Isolate Loop Logic for Clarity**
   - Move iteration logic into helper functions or child components.
   - Keep loops focused on a single task for readability.
   - Separate data transformation from rendering for cleaner templates.

6. **Simplify Conditional Logic**
   - Favor strategy patterns or polymorphism when behavior varies by type.
   - Use conditionals when they genuinely improve clarity.
   - Simpler branching leads to more maintainable code.

7. **Return Early, Stay Flat**
   - Exit immediately on invalid, empty, or trivial conditions.
   - Keep the primary execution path obvious and easy to follow.
   - Flat code is readable code.

8. **Extract Branching Into Focused Functions**
   - Use guard clauses to handle edge cases upfront.
   - Move branching logic into well-named helper functions.
   - Let the main flow of each function tell a clear story.

9. **Trust Your Boundaries**
   - Validate inputs at the edges of your system.
   - Once validated, let the inner logic stay clean and confident.
   - Consolidate duplicate checks into shared validation.

10. **Embrace Async Pipe and Signals**
    - Use Angular's async pipe for clean, declarative template bindings.
    - Use signals for reactive state to keep components responsive.
    - Let Angular manage subscription lifecycles for you.

11. **Use Modern Angular Control Flow**
    - Use `@for` for iteration in templates.
    - Use `@if` for conditional rendering.
    - Modern template syntax is cleaner and more performant — default to it.

12. **Audit After Every Task — Always**
    - Audit After Every Task — Always
