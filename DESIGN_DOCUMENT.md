# System Design Document — Rent & Flatmate Finder

## Architecture

The system is a three-tier web application: a React SPA, a stateless
Express API, and a PostgreSQL database, with two supporting external
services (Gemini for scoring, Cloudinary for images) and one real-time
channel (Socket.io) layered on top of the same HTTP server.

The backend is organized in four layers with a strict dependency
direction — routes depend on controllers, controllers depend on services,
services depend on repositories, and only repositories touch Prisma.
Controllers stay thin (parse the request, call a service, shape the
response); all business rules — ownership checks, score caching,
notification triggers — live in services. This keeps the code testable in
isolation (a service can be unit tested with a mocked repository) and
means swapping Prisma for another ORM would only touch the repository
layer. The frontend mirrors this separation: a typed `api/endpoints.ts`
layer wraps Axios calls, React Query-style hooks aren't used here in favor
of simple `useEffect` + local state for scope reasons, and an `AuthContext`
holds the session.

## Compatibility scoring

Compatibility is computed per (tenant, listing) pair and persisted in a
`CompatibilityScore` table with a unique constraint on that pair — this is
the core performance decision in the system. Without caching, every
listing search would re-score against every visible listing on every
request, which is both slow and expensive against a rate-limited LLM API.
Instead, a score is generated once, on demand, the first time a tenant
views or searches a listing, and reused after that. Two events invalidate
the cache: editing a listing's material fields (`listingRepository`
deletes that listing's scores) and a tenant updating their profile
(deletes all of that tenant's scores). Both cases let the next search
regenerate lazily rather than eagerly recomputing every pairing up front,
which would waste calls on listings nobody ever looks at.

## LLM integration and rule-based fallback

The Gemini call is wrapped in a 10-second timeout via `Promise.race` and a
try/catch that treats *any* failure mode — network error, timeout, rate
limit, or a response that isn't parseable, in-range JSON — identically:
fall through to the deterministic rule-based scorer. That scorer awards
points for an exact (or partial) location match, budget fit, and move-in
proximity, capped at 100, and is intentionally simple enough to reason
about and to unit test without mocking a network call. Both paths write to
the same table with a `source` column (`LLM` or `RULE_BASED`) so the
distinction is visible for debugging without being exposed to the tenant —
they just see a score and an explanation either way. This means the
feature degrades gracefully rather than breaking: if a Gemini API key
isn't configured at all, the platform is fully functional on the
rule-based path alone.

## Database design

The schema is normalized around one central relationship: a `TenantProfile`
and a `Listing` combine into an `InterestRequest`, which — once accepted —
spawns exactly one `ChatRoom`, which holds many `Message` rows. Cascading
deletes are used throughout (deleting a `User` removes their profile,
listings, and messages) so the data never orphans. `Listing` and
`TenantProfile` are separate from `User` because only owners have listings
and only tenants have budgets — modeling them as optional one-to-one
relations off `User` keeps the core auth table role-agnostic instead of
having a wide table full of nullable columns.

## Authentication

JWTs are signed with a server-side secret and carry `{ id, role, email }`.
Passwords are hashed with bcrypt (10 rounds) and never returned from any
endpoint. Route-level protection is two-layered: `authenticate` verifies
the token and attaches `req.user`, then `authorize(...roles)` checks the
role against an allowlist per route. The same role is embedded in the JWT
and re-checked on the frontend to hide UI a user shouldn't reach, but the
backend check is the actual security boundary — the frontend check is
purely UX.

## Socket.io implementation

Sockets authenticate during the handshake using the same JWT as the REST
API, via a Socket.io middleware that verifies the token before the
connection is accepted. Each user joins a personal room (`user:<id>`) for
push notifications, and joins a chat room only after the server confirms,
via the same `chatService.getRoomForUser` check used by the REST endpoint,
that they're either the tenant or owner on an *accepted* interest request.
Messages are persisted to Postgres before being broadcast, so a page
refresh always shows full history via the REST `GET /chat/:roomId/messages`
endpoint — the socket layer is for live delivery, not the source of truth.

## Email notification flow

Email sends are fire-and-forget from the caller's perspective: the
`emailService` catches its own failures and logs them rather than
throwing, so a misconfigured SMTP server never breaks the interest-request
or accept/decline flow that triggered the email. Emails fire on two
events — a tenant with a compatibility score above 80 sends interest
(notifies the owner), and an owner accepts or declines a request (notifies
the tenant) — matching the two moments where a human on the other end
genuinely needs to know something happened outside the app.

## Scalability

The API is stateless aside from the in-memory Socket.io room membership,
so it can run multiple instances behind a load balancer for HTTP traffic;
Socket.io would need a Redis adapter to fan out events across instances if
scaled horizontally, which isn't wired in yet but is a contained change at
the `initSocket` call site. The database is the natural bottleneck first —
indexes exist on the columns actually filtered/sorted on (`location`,
`isFilled`, listing/tenant foreign keys) — and the compatibility cache
directly reduces both database and third-party API load as listing volume
grows.

## Security considerations

Helmet sets standard security headers, CORS is restricted to the
configured client origin, and rate limiting is applied globally with a
stricter limit on `/auth/*` to blunt credential-stuffing attempts. Every
mutating endpoint validates its body with Zod before touching the
database, and Prisma's parameterized queries rule out SQL injection by
construction. File uploads are limited by size and MIME type before ever
reaching Cloudinary. The one gap worth naming: JWTs are long-lived with no
refresh/rotation mechanism, which is acceptable for this scope but would
need addressing before handling more sensitive data at production scale.
