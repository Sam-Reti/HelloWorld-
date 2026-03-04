# Dev World — Project Document

**Domain**: itshelloworld.com
**Stack**: Angular 21 · Firebase · Hiyve SDK · Gemini AI
**Status**: Active development (dev environment, us-west-2)

---

## What It Is

Dev World is a social platform built for developers. Think Twitter/LinkedIn meets a coding gym — users share posts, follow each other, chat, practice debugging with AI, and jump into live video calls with each other.

---

## What We Have (Shipped)

### Auth
- Email/password signup and login
- Email verification flow
- Forgot password / reset password
- Auth guards protecting all app routes
- Admin role flag on user documents

### Social Feed
- Create posts with text (markdown supported) and images
- Follow-based feed — only see posts from people you follow + your own
- Infinite scroll pagination (30 posts per page)
- Like and unlike posts
- Comments per post
- Edit and delete your own posts
- Avatar colors per user

### Profiles
- Display name, bio, role, skill level
- Languages list, GitHub URL, website URL, location
- Follower / following counts
- Theme selector (light + dark themes)
- Edit profile page

### Discover & Social Graph
- Browse all users
- Follow / unfollow from discover page or user profile pages
- Following list page
- Per-user public profile pages (`/app-home/user/:uid`)

### Direct Messaging
- Real-time 1:1 conversations via Firestore
- Chat inbox listing all conversations, sorted by latest activity
- Unread message indicators
- Floating chat popup / sidebar accessible from anywhere in the app
- Denormalized participant names + colors for zero-lookup inbox rendering

### AI Practice (Code Debugging)
- Powered by **Gemini 2.5 Flash** via Firebase AI (client-side, no backend needed)
- User selects: language · category · difficulty
  - **Languages**: JavaScript, TypeScript, Python, Java, Go, Rust, C#, C++
  - **Categories**: Logic Bugs, Security Vulnerabilities, Performance Issues, Code Style, Algorithm Errors, Edge Case Handling
  - **Levels**: Easy, Medium, Hard
- AI generates a buggy code snippet with no comments (no hints)
- User edits the code in a built-in code editor to fix the bugs
- AI grades the fix: score (0–100), letter grade (A–F), detailed feedback, correct solution
- Sessions saved to Firestore (`practiceSessions`) with full history
- Practice session cards shown in the feed when shared

### Video Calling (Partial — Blocked)
- Call initiation, ringing state, accept / reject / end call logic complete
- Call state tracked in Firestore (`calls` collection)
- Incoming call banner wired up app-wide
- Call overlay UI built (connecting state, cancel button)
- **Blocked**: Hiyve SDK packages can't install — `@hiyve/utilities` tarball URL points to unreachable `api.hiyve.dev` domain. Dev team fix pending.

---

## What's In Progress

### Hiyve SDK Integration (Video Calling)
Once `@hiyve/utilities` tarball URL is fixed and packages install, these steps complete video:

1. `npm install @hiyve/angular @hiyve/core @hiyve/rtc-client @hiyve/utilities @angular/material @angular/cdk --legacy-peer-deps`
2. `npm install @hiyve/admin` inside `functions/`
3. Uncomment 6 TODO lines across:
   - `app.config.ts` — `provideHiyve({ generateRoomToken })`
   - `video-call.service.ts` — `ConnectionService`, `RoomService`, `joinRoom()`, `leaveRoom()`
   - `video-call-overlay.ts` — `VideoGridComponent`, `ControlBarComponent`
   - `video-call-overlay.html` — `<hiyve-video-grid>` and `<hiyve-control-bar>` blocks
4. Set Firebase Function env vars: `APIKEY`, `CLIENT_SECRET`, `SERVER_REGION`, `SERVER_REGION_URL`, `ENVIRONMENT`
5. Deploy Firebase Function (`functions/src/index.ts`) — Express app using `@hiyve/admin`'s `mountHiyveRoutes`

### Hiyve Cloud Migration
Migrating from the old MuzieAuth identity system to Hiyve Cloud.
Two environments:
- **Production**: us-east-1 (not live yet)
- **Development**: us-west-2 (active — use `sk_test_*` keys, `ENVIRONMENT=development`)

All references to the production Hiyve Cloud will fail until that environment is ready.

---

## Planned / Wanted

### Near-term
- [ ] Full live video grid once Hiyve SDK installs (VideoGrid + ControlBar components)
- [ ] Screen sharing during calls (`showScreenShare` already wired in overlay template)
- [ ] Participant count and room info in call overlay header
- [ ] Call history / missed calls

### Product
- [ ] Notifications (in-app + push) — new followers, mentions, messages, incoming calls
- [ ] Post search and hashtag support
- [ ] Rich link previews in posts
- [ ] Code snippet posts with syntax highlighting (separate from practice)
- [ ] Public practice leaderboard / streak tracking
- [ ] Group video rooms (not just 1:1 calls)
- [ ] Collaborative coding sessions during video calls
- [ ] Mobile app (React Native — Hiyve has an RN SDK)

---

## Infrastructure

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone, signals, async pipe) |
| Backend | Firebase (Firestore, Auth, Storage, Hosting) |
| Functions | Firebase Cloud Functions (Node 20, TypeScript) |
| AI | Firebase AI — Gemini 2.5 Flash |
| Video | Hiyve SDK (`@hiyve/angular`, `@hiyve/core`, `@hiyve/rtc-client`) |
| Auth | Firebase Auth (email/password) |
| Package registry | `@hiyve/*` via `console.hiyve.dev/api/registry` |

### Key Environment Variables (Firebase Functions)
```
APIKEY=mk_...
CLIENT_SECRET=...
SERVER_REGION=us-west-2
SERVER_REGION_URL=.rtc.muziemedia.com
ENVIRONMENT=development
```

### Firestore Collections
| Collection | Purpose |
|---|---|
| `users` | User profiles, follower counts, admin flag |
| `posts` | Feed posts with text, images, likes |
| `conversations` | DM threads with denormalized participant info |
| `conversations/{id}/messages` | Individual messages |
| `calls` | Active/ringing video call state |
| `practiceSessions` | AI practice session history |
| `follows` | Follow graph |

---

## Current Blockers

1. **`@hiyve/utilities` tarball URL** — `api.hiyve.dev` is unreachable. Needs dev team to republish with correct domain. This blocks all Hiyve SDK installation.
2. **Hiyve Cloud prod environment** — us-east-1 not live yet. Dev environment (us-west-2) is the only active target.
