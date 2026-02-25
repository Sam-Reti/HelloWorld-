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
