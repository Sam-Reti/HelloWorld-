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

1. **Prefer Interfaces Over Concrete Types** — Define contracts using interfaces/types before implementations. Depend on abstractions, not concrete classes. Avoid unnecessary coupling between components and services.

2. **Single Responsibility Principle (SRP)** — Each function, class, and component must have one clear responsibility. Split logic when multiple concerns appear. Avoid multipurpose or ambiguous units.

3. **Pure Functions With Safe Defaults** — Favor deterministic, side-effect-free functions. Use default parameters instead of defensive branching. Avoid hidden state or implicit dependencies.

4. **File Size Limits** — No TypeScript/logic files over 300 lines. No HTML/template files over 100 lines. Refactor immediately when limits are approached.

5. **Loop Isolation** — Do not embed complex loops directly inside components. Move iteration logic into helper functions or child components. Avoid mixing loops with state mutation or rendering logic.

6. **Avoid Conditional Complexity** — Minimize if/else and switch statements. Prefer strategy patterns or polymorphism when behavior varies. Use conditionals only when they simplify clarity.

7. **Early Returns Required** — Exit immediately on invalid, empty, or trivial conditions. Avoid deep nesting. Keep the primary execution path obvious.

8. **No Conditional Wrapping of Large Blocks** — Do not wrap entire logic sections inside conditionals. Extract branching logic into functions. Prefer guard clauses.

9. **Eliminate Redundant Conditionals** — Avoid defensive checks for impossible states. Validate inputs at boundaries. Remove duplicated logical branches.

10. **Prefer Async Pipe and Signals** — Use the Angular async pipe instead of manual subscriptions. Prefer signals for reactive state when appropriate. Avoid imperative subscription management unless strictly necessary.

11. **Prefer Modern Angular Control Flow** — Use `@for` instead of `*ngFor`. Use `@if` instead of `*ngIf`. Default to modern template syntax unless compatibility requires otherwise.
