# Scoreboard Update API - Specification

## Overview

This module handles updates to user scores and provides a live-updating scoreboard (top 10 users). It is a backend API service intended to be used by the website frontend and other internal services. The module must ensure integrity of score updates, prevent unauthorized or malicious increments, and deliver near real-time updates to connected clients.

Primary responsibilities:

- Accept score update requests (from frontend after user completes an action).
- Validate authorization and request integrity.
- Atomically update persistent store (leaderboard data).
- Publish changes to a real-time delivery layer (WebSocket / Server-Sent Events) so the scoreboard UI updates live.

This README documents the API contract, data shapes, sequence diagrams, security considerations, implementation guidance, edge cases and suggested improvements.

## Small contract (inputs / outputs / error modes)

- Inputs: authenticated request with user identity and score delta; optional action metadata.
- Outputs: success/failure JSON; realtime notification broadcasts (top10 snapshot or diff).
- Error modes: invalid auth (401), malformed payload (400), rate limit or abuse (429), server error (500). On partial failure, the server must not send live updates.

## Endpoints

1. GET /api/scoreboard/top10

- Description: Returns the current top 10 users (scoreboard snapshot).
- Auth: Optional read-only token for public scoreboard. Rate-limit per IP.
- Response 200:

  {
  "ranking": [
  {"rank":1, "userId":"u_123", "displayName":"Alice", "score":12345},
  ... up to 10 items
  ],
  "generatedAt": "2025-10-01T12:00:00Z"
  }

2. POST /api/score/update

- Description: Accepts a request to increment a user's score after completing an action.
- Auth: Required (see Security). Caller must authenticate as the user or as a trusted action-service on behalf of the user.
- Payload (application/json):

  {
  "userId": "u_123",
  "delta": 10,
  "actionId": "action-789", // optional, to dedupe
  "timestamp": "2025-10-01T12:00:00Z",
  "signature": "..." // optional HMAC when delegated
  }

- Responses:
  - 200 OK {"ok":true, "newScore": 12355}
  - 400 Bad Request {"error":"invalid_payload"}
  - 401 Unauthorized {"error":"unauthorized"}
  - 429 Too Many Requests {"error":"rate_limited"}
  - 500 Internal Error {"error":"server_error"}

3. WebSocket /ws/scoreboard (or SSE at /sse/scoreboard)

- Description: Real-time stream for scoreboard updates. Clients should subscribe and display the top 10 live.
- Auth: Optional token for private boards; public boards can allow anonymous with stricter rate limits.
- Events:
  - "snapshot": full top10 payload (same shape as GET /top10)
  - "update": incremental change {"userId":"u_123","oldRank":2,"newRank":1,"oldScore":12000,"newScore":12010}
  - "heartbeat": keep-alive

Recommendation: Use a small message schema and send occasional full snapshots to avoid client drift.

## Data model and storage

Persistent store options (pick one based on scale):

- Postgres with an indexed scores table (user_id primary, score numeric) and a materialized view for top10.
- Redis Sorted Set (ZSET) to maintain an in-memory leaderboard for fast reads and atomic increments.

Suggested hybrid approach (recommended):

- Primary write in Postgres (authoritative). Also perform an atomic update in Redis ZSET for low-latency reads.
- Periodic reconciliation/sync from Postgres -> Redis to fix drift.

Table example (Postgres):

users_scores (
user_id varchar primary key,
score bigint not null default 0,
updated_at timestamptz not null default now()
)

Redis: ZADD leaderboard score userId (use ZINCRBY for deltas)

Atomicity: Use DB transactions and/or Redis scripts (LUA) to ensure consistency when applying deltas and checking dedupe/actionId.

## Real-time flow and pub/sub

- When a score update is accepted and persisted, the service publishes a message to a pub/sub channel (Redis Pub/Sub, Redis Streams, Kafka, or a message broker).
- A real-time broadcaster process (or separate horizontally-scalable service) subscribes and broadcasts to connected WebSocket clients.
- Alternatively, the API workers can directly publish to connected WebSocket nodes via a shared channel (Redis) so the routing is stateless.

## Sequence Diagram (flow of execution)

Use the following mermaid sequence diagram to illustrate the typical flow from action completion to live scoreboard update.

```mermaid
sequenceDiagram
	autonumber
	participant Browser
	participant Frontend
	participant API
	participant Auth as AuthService
	participant DB as Postgres
	participant Redis as RedisZSET
	participant Bus as Broker
	participant WS as WebSocketSrv

	Browser->>Frontend: User completes action
	Frontend->>API: POST /api/score/update
	API->>Auth: Validate token/signature
	Auth-->>API: OK

	API->>DB: BEGIN tx
	API->>DB: Check actionId
	DB-->>API: new / duplicate?
	alt New action
		API->>DB: UPSERT score (+delta)
	else Duplicate action
		API-->>Frontend: 200 OK (idempotent)
		note over API,Frontend: No publish for duplicate
		API->>DB: COMMIT (no-op)
		API->>DB: (tx ends)
		Frontend-->>Browser: Display unchanged scoreboard
		note over API,DB: Path ends here
	end
	API->>DB: COMMIT

	API->>Redis: ZINCRBY leaderboard delta
	API->>Bus: publish score.updated
	Bus-->>WS: fan-out event
	WS->>Browser: push update
	Browser-->>Frontend: Re-render scoreboard

	alt DB failure
		API-->>Frontend: 500 error
	end

	note over API,Redis: Cache failure tolerated; recovery job later
```

## Architecture overview diagram

The following mermaid diagram shows the high-level components and the flow between them.

```mermaid
flowchart LR
    subgraph Client
        B[Browser]
        FE[Frontend App]
    end

    subgraph Core
        API[API Service]
        AUTH[Auth Service]
        DB[(Postgres)]
    end

    subgraph Realtime
        R[(Redis ZSET)]
        BR[(Kafka/Streams)]
        WS[WebSocket Cluster]
    end

    B --> FE --> API
    API --> AUTH
    API --> DB
    DB --> R
    API --> R
    API --> BR
    BR --> WS
    R -. optional pub/sub .- WS
    WS --> B

    classDef optional fill=#FFF6E5,stroke=#E6B800,stroke-width=1px
    class BR optional

    %% Broker (BR) is optional if Redis pub/sub used directly.
```

## Extra improvement and implementation notes

- Provide an OpenAPI (Swagger) definition and generate client SDKs for frontend to reduce integration bugs.
- Consider using Redis Streams or Kafka if you want durable event storage and replay for debugging and rebuilding leaderboards.
- For ultimate security, move the action validation fully server-side: the frontend only receives a short-lived claim and cannot craft deltas.
- Consider differential broadcasts: if many users are connected, broadcast only rank changes and relevant slice (e.g., top 10) to reduce bandwidth.
- For multi-region deployments, use a global message bus or replicate leaderboards per region and reconcile periodically.

## Files changed / created

- `src/problem5/README.md` - This file: full specification, diagrams, and notes for the backend engineering team.

## Completion summary

- Done: full API module spec document with endpoints, sequence and architecture diagrams, security, data model, and implementation guidance.
- Next steps (optional): generate OpenAPI YAML, example server skeleton, and CI test matrix.

## Security and anti-abuse

### Diagram Notes

Sequence diagram simplified for renderer compatibility:

- Removed unsupported 'rect' shading block and complex multiline notes.
- Explicit idempotent duplicate branch returns before publish.
- DB failure alt branch isolated; no side effects.

Architecture diagram changes:

- Removed embedded legend subgraph (some renderers choke on nested meta blocks).
- Added minimal optional edge label and class styling only.
- Broker node styled optional; Redis optional pub/sub path shown as dashed.

Goals: Only authorized sources (the authenticated user or trusted internal services) can increment a score. Mitigate replay and forged increments.

Recommendations:

- Authentication: Use JWT (short-lived access tokens) for browser-authenticated users. For server-to-server, use mutual TLS or signed requests (HMAC) with rotating keys.
- Authorization: Verify the user in the token matches the `userId` in the payload unless the caller is an internal trusted service.
- Action deduplication: Include an `actionId` per user action and persist it (or keep a short-lived cache entry) to prevent replay. e.g., store recent actionIds in Redis SET with TTL.
- Request integrity: When frontend cannot be fully trusted, require the action service (server-side) to call the API to claim the score (server-to-server). For web-only flows, require a signature computed server-side.
- Rate limiting: Per-user and per-IP limits to slow down brute-force or automated score inflation.
- Validation: limit `delta` to a reasonable range per action (e.g., 0 < delta <= 1000) and/or verify action metadata.
- Audit logging: Log who requested the update, the delta, actionId, and verification outcome for investigations.

Example anti-forgery flow (stronger):

- User completes action -> frontend calls Action Service to validate action -> Action Service issues a short-lived claim token -> Frontend calls API with claim token -> API validates claim token server-to-server and applies delta.

## Implementation guidance

1. Input validation and auth early: Reject unauthenticated requests quickly.
2. Deduplication: Check and record `actionId` atomically with score update to avoid double-applying.
3. Atomic update pattern:
   - In Postgres: UPDATE users_scores SET score = score + :delta, updated_at = now() WHERE user_id = :id; If row does not exist, INSERT ... ON CONFLICT DO UPDATE.
   - Maintain Redis ZSET using ZINCRBY so reads are O(log(N)). Use a Redis LUA script for multi-step checks when needed.
4. Publish after commit: Only publish update events after the DB commit succeeds.
5. Broadcast: Keep WebSocket nodes stateless - use Redis pub/sub or a broker to fan-out messages. Each WS node listens and broadcasts to its connected clients.

## Edge cases and how we handle them

- Duplicate requests (replay): Use `actionId` dedupe with TTL and persist in DB or Redis.
- High concurrency (many increments for same user): Use DB row-level locks or atomic Redis ZINCRBY and then sync back to DB or use optimistic increments with retry.
- Partial failure between DB and Cache: Treat DB as source-of-truth. If cache update fails, schedule a retry job and return success to the caller once DB commit succeeded. Consider compensating job to reconcile cache.
- Eventual consistency: Clients may see slight delays. Occasionally publish full snapshots to resync.
- Missing user row: create on-demand with INSERT ... ON CONFLICT.

## Observability and operational notes

- Metrics to collect: requests/sec, auth failures, invalid payloads, DB errors, publish latency, number of WS connections, message delivery failures, top10 cache hit/miss.
- Tracing: Add distributed tracing (e.g., OpenTelemetry) across API -> DB -> PubSub -> WS.
- Logging: Structured logs include userId, actionId, delta, requestId, and outcome.

## Testing guidance

- Unit tests: payload validation, auth checks, dedupe logic, DB updater functions.
- Integration tests: end-to-end tests simulating API update, Redis ZSET, pub/sub broadcast and WebSocket client receiving messages.
- Load testing: simulate high frequency updates to validate atomicity and leaderboard correctness under concurrency.

## Deployment and scaling

- Scale API stateless workers behind a load balancer.
- Use a central Redis (or Redis cluster) and ensure persistence or periodic snapshot to avoid data loss.
- For persistence, Postgres scalable with partitioning if user base grows; maintain periodic reconciliation tasks to sync Redis <-> Postgres.

## Open design decisions (to be resolved by the team)

- Choice of primary read store for leaderboard: Redis ZSET (fast) vs materialized Postgres view (stronger durability). Recommended hybrid.
- Broker choice: Redis Pub/Sub (simple) vs Redis Streams or Kafka (durable, replayable). For critical leaderboards and audit, prefer Streams/Kafka.

## Additional improvements (recommended after initial implementation)

- Add rate-limited admin endpoints for manual corrections with audit trails.
- Use signed claim tokens from an action-validation service to close client-side forgery vectors.
- Implement a per-action delta whitelist or rules engine to validate large deltas.
- Introduce feature flags for graceful rollout of real-time features.
- Provide a small SDK for frontends to standardize requests (including signature generation where applicable).
- Add unit and integration tests in CI, and create a local dev docker-compose with Postgres + Redis + an example WS server for local testing.

## Try-it (example requests)

Example update call:

    POST /api/score/update
    Authorization: Bearer eyJhbGci...
    Content-Type: application/json

    {
    	"userId": "u_123",
    	"delta": 10,
    	"actionId": "act-20251001-0001",
    	"timestamp": "2025-10-01T12:00:00Z"
    }

Example websocket message (update):

    {"type":"update","userId":"u_123","oldScore":12000,"newScore":12010,"oldRank":5,"newRank":3}

## Acceptance criteria for handoff

- API endpoints implemented and documented with OpenAPI/Swagger.
- Unit and integration tests covering happy-path and 2 edge cases (dedupe and concurrent updates).
- Real-time broadcaster that publishes to connected WS clients on score change.
- Authentication and basic rate-limiting in place.

---

If you'd like, I can also generate a minimal OpenAPI spec YAML and a tiny sequence-image export (PNG) for embedding in docs. I can also create example server skeleton code (Node.js/Express + Redis + Postgres) if the team wants a starter implementation.
