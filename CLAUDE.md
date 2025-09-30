# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BuddyFounder is a co-founder matchmaking platform ("Tinder for Co-founders") built with:
- **Frontend**: React 19, Vite, React Router DOM
- **Backend**: Convex (real-time database & serverless functions)
- **Auth**: Better Auth with email/password authentication
- **AI**: OpenAI for chat/RAG, Vapi for voice interactions
- **Styling**: Tailwind CSS
- **Deployment**: Connected to Convex deployment `original-ladybug-597`

## Development Commands

```bash
# Start both frontend and backend (recommended)
bun run dev

# Start only frontend (port 5173)
bun run dev:frontend

# Start only backend (Convex dev server)
bun run dev:backend

# Build for production
bun run build

# Type check, lint, and build (full validation)
bun run lint
```

## Architecture

### Frontend Structure (`src/`)
- **App.tsx**: Main router with authenticated/unauthenticated states, bottom navigation
- **Components**:
  - `Discovery.tsx`: Swipe interface for discovering co-founders
  - `Matches.tsx`: List of matched users
  - `Chat.tsx`: Direct messaging between matches
  - `AiChat.tsx`: RAG-powered chat with user profiles
  - `CofounderAgent.tsx`: Floating AI assistant ("Foundy")
  - `ProfileSetup.tsx`: Onboarding flow for new users
  - `ProfileView.tsx`: View/edit current user profile
  - `PublicProfile.tsx`: Public shareable profiles (`/u/:username`)
  - `DocumentManager.tsx`: Upload/manage PDFs and social media data for RAG
  - `FileUploader.tsx`, `SocialConnector.tsx`: Document ingestion components

### Backend Structure (`convex/`)

#### Core Tables (schema.ts)
- **profiles**: User profiles with skills, interests, photos, social links, username
- **swipes**: Track left/right swipes between users
- **matches**: Mutual likes between users
- **messages**: Direct messages between matched users
- **documents**: Uploaded content (PDFs, social media) for RAG
- **documentChunks**: Chunked content with embeddings for vector search
- **aiChats**: AI conversation history with RAG sources
- **socialConnections**: Linked social media accounts
- **notifications**: Match/message/system notifications

#### Key Backend Files
- **profiles.ts**: Profile CRUD operations
- **discovery.ts**: Fetch potential matches, handle swipes
- **matches.ts**: Create matches, fetch match lists
- **aiChat.ts**: RAG-powered AI chat using OpenAI embeddings
- **cofounderAgent.ts**: General AI assistant functions
- **documents.ts**: Document management for RAG
- **embeddings.ts**: Generate OpenAI embeddings for documents
- **vectorSearch.ts**: Semantic search over document embeddings
- **vapiWebhook.ts**: Webhook handlers for Vapi voice chat integration
- **router.ts**: HTTP routes (currently empty, webhook in vapiWebhook.ts)
- **auth.ts / auth.config.ts**: Convex Auth configuration

### Key Features

1. **Swipe Discovery**: Users swipe on potential co-founders, mutual likes create matches
2. **Direct Messaging**: Chat with matches in real-time
3. **AI Chat with RAG**: Ask questions about a user's profile, powered by their uploaded documents
4. **Document Ingestion**: Users upload PDFs, connect social media for AI context
5. **Voice Chat**: Vapi integration for voice conversations with AI profiles
6. **Shareable Profiles**: Public URLs at `/u/:username`
7. **AI Assistant "Foundy"**: Floating assistant for general help

## Convex Guidelines

### Function Syntax
Always use the new Convex function syntax:
```typescript
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";

export const myQuery = query({
  args: { userId: v.id("users") },
  returns: v.object({ name: v.string() }),
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

### Function Types
- **query**: Read-only, cacheable, called from frontend
- **mutation**: Write operations, transactional
- **action**: Non-transactional, can call external APIs (OpenAI, Vapi)
- **internalQuery/Mutation/Action**: Private functions, not exposed to frontend

### HTTP Routes
HTTP routes are defined in `convex/vapiWebhook.ts` (or `convex/router.ts` for new routes):
```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();
http.route({
  path: "/vapi/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Handle request
  }),
});
export default http;
```

### Schema Indexing
Always create indexes for common queries. Index names should describe all fields:
```typescript
.index("by_user_and_platform", ["userId", "platform"])
```

### File Storage
- Use `ctx.storage` for file uploads (images, PDFs)
- Store file IDs as `v.id("_storage")` in documents
- Get URLs with `ctx.storage.getUrl(fileId)`
- Query file metadata from `ctx.db.system.get(fileId)`

### RAG Implementation
1. Documents are chunked in `documentChunks` table
2. Embeddings generated via OpenAI in `embeddings.ts`
3. Semantic search in `vectorSearch.ts` using cosine similarity
4. AI responses use retrieved chunks as context

## Important Patterns

### Profile Setup Flow
- New users must complete `ProfileSetup` before accessing app
- Profile marked complete with `isComplete: true`
- Required fields: name, bio, skills, interests, lookingFor, photos, experience

### Authentication
- Uses Better Auth with email/password authentication
- Backend: Get user with `authComponent.getAuthUser(ctx)`, then extract `userId = user?._id`
- Always validate `user` and `user._id` exist before using them
- Frontend: Uses auth client from `src/lib/auth-client.ts` for sign in/sign up

### Real-time Updates
Convex provides automatic real-time subscriptions via `useQuery`:
```typescript
const profile = useQuery(api.profiles.getCurrentUserProfile);
```

### Vapi Voice Integration
- Webhook at `/vapi/webhook` handles function calls, transcripts, call lifecycle
- Profile owner ID passed via `call.metadata.profileOwnerId`
- Functions: `get_profile_info`, `send_message`, `check_compatibility`

## Environment Variables
Required in `.env.local`:
```
CONVEX_DEPLOYMENT=<deployment-url>
VITE_CONVEX_URL=<convex-url>
OPENAI_API_KEY=<key>
VAPI_PRIVATE_KEY=<key>
```

## Common Tasks

### Adding a New Table
1. Define in `convex/schema.ts` with validators and indexes
2. Add CRUD functions in new `convex/tableName.ts` file
3. Export from `convex/_generated/api.ts` (auto-generated)

### Adding a New Page
1. Create component in `src/components/`
2. Add route in `App.tsx` if public, or add view in `AuthenticatedApp`
3. Add navigation button if needed in bottom nav

### Modifying AI Chat
- RAG logic in `convex/aiChat.ts`
- Embeddings in `convex/embeddings.ts`
- Vector search in `convex/vectorSearch.ts`
- Frontend chat UI in `src/components/AiChat.tsx`

### Testing Webhooks
Use Convex dashboard or local testing:
```bash
curl -X POST https://your-deployment.convex.cloud/vapi/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": {"type": "function-call", ...}}'
```

## Type Safety
- All Convex functions have full TypeScript types via `convex/_generated/`
- Use `Id<"tableName">` for document IDs
- Use `Doc<"tableName">` for full document types
- Always specify `args` and `returns` validators

## Key Cursor Rules
See `.cursor/rules/convex_rules.mdc` for detailed Convex guidelines including:
- New function syntax patterns
- Validator usage for all types
- Schema design best practices
- Query ordering and indexing
- File storage patterns
- Full text search guidelines