# BuddyFounder - Co-Founder Matchmaking Platform

> Tinder for co-founders: Find your perfect business partner through AI-powered matching, voice chat, and intelligent discovery.

## 🎯 What We're Building

BuddyFounder is a matchmaking platform designed specifically for entrepreneurs and founders to find their ideal co-founders. Unlike traditional networking platforms, we use AI-powered matching, RAG (Retrieval Augmented Generation) for personalized AI conversations, and modern real-time features to create meaningful connections.

### Key Features

- **Swipe-Based Discovery**: Tinder-style interface for discovering potential co-founders
- **AI-Powered Matching**: Intelligent matching algorithm based on skills, interests, and project goals
- **Voice Chat Integration**: Real-time voice conversations powered by Vapi
- **AI Chat Assistants**: Each profile has an AI that can answer questions using RAG from uploaded documents and social media
- **Document Upload & RAG**: Upload PDFs, connect social media to train your AI assistant
- **Real-time Messaging**: Chat with matches instantly
- **Shareable Profiles**: Unique username-based profile URLs
- **Smart Notifications**: Real-time updates for matches, messages, and interactions

---

## 🏗️ Architecture Overview

### Tech Stack

```
Frontend:
├── React 19 (with modern concurrent features)
├── Vite (fast build tool)
├── TanStack Router (type-safe routing)
├── Tailwind CSS (utility-first styling)
└── shadcn/ui (component library)

Backend:
├── Convex (serverless backend platform)
│   ├── Real-time database
│   ├── Serverless functions (queries, mutations, actions)
│   ├── File storage
│   └── Scheduled functions
└── Better Auth (authentication library)

AI/ML:
├── OpenAI API (GPT models for AI chat)
├── Vector Embeddings (for semantic search)
└── Vapi (voice chat integration)

Authentication:
└── Better Auth with Convex Integration
    ├── Email/Password authentication
    ├── Cross-domain support
    └── Session management
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Discovery  │  │  AI Chat     │  │  Voice Chat      │  │
│  │  (Swipe)    │  │  (RAG)       │  │  (Vapi)          │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Better Auth (Cross-Domain)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Email/Password Auth  │  Session Management          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Convex Backend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Queries    │  │  Mutations   │  │    Actions      │  │
│  │  (Read Data) │  │ (Write Data) │  │ (External API)  │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Database   │  │  File Store  │  │  Vector Search  │  │
│  │  (Real-time) │  │   (S3-like)  │  │  (Embeddings)   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  OpenAI API  │  │  Vapi Voice  │  │  Social Media   │  │
│  │  (AI Chat)   │  │  (Calls)     │  │  (Scraping)     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication System

### Better Auth with Convex Integration

We use **Better Auth** integrated with **Convex** for authentication. This provides:

1. **Component-based architecture**: Better Auth runs as a Convex component
2. **Cross-domain support**: Seamless auth across different domains
3. **Type-safe**: Full TypeScript support with generated types
4. **Real-time**: Automatic session management with Convex subscriptions

#### How It Works

```typescript
// Backend: convex/auth.ts
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true },
    plugins: [
      crossDomain({ siteUrl }),
      convex(),
    ],
  });
};

// Frontend: src/lib/auth-client.ts
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  plugins: [convexClient(), crossDomainClient()],
});
```

#### User ID Handling

**Important**: Better Auth creates a `user` table (singular), but our application uses `users` (plural) as the foreign key reference. We handle this with type casting:

```typescript
const user = await authComponent.getAuthUser(ctx);
const userId = user?._id as any; // Cast from Id<"user"> to match Id<"users"> references
```

This pattern is used consistently across all Convex functions that require authentication.

---

## 💾 Database Schema

### Core Tables

#### 1. **profiles**
User profile information and preferences
```typescript
{
  userId: Id<"users">,          // Foreign key to auth user
  name: string,
  bio: string,
  skills: string[],
  interests: string[],
  lookingFor: string,           // "technical co-founder", "business co-founder"
  photos: Id<"_storage">[],     // Profile photos
  experience: string,           // "beginner", "intermediate", "expert"
  username: string,             // Unique username for shareable URLs
  isActive: boolean,
  isComplete: boolean,
  // Social links
  twitter?: string,
  discord?: string,
  linkedin?: string,
  portfolio?: string,
}
```

#### 2. **swipes**
User interactions (like/pass)
```typescript
{
  swiperId: Id<"users">,
  swipedId: Id<"users">,
  direction: "left" | "right",  // left = pass, right = like
}
```

#### 3. **matches**
When two users like each other
```typescript
{
  user1Id: Id<"users">,
  user2Id: Id<"users">,
  matchedAt: number,
}
```

#### 4. **aiChats**
AI-powered conversations
```typescript
{
  participantId: Id<"users">,      // Person chatting
  profileOwnerId: Id<"users">,     // Whose AI they're chatting with
  messages: Array<{
    role: "user" | "assistant",
    content: string,
    timestamp: number,
    sources?: Array<{               // RAG sources
      documentId: Id<"documents">,
      title: string,
      relevanceScore: number,
    }>,
  }>,
  lastMessageAt: number,
  totalMessages: number,
}
```

#### 5. **documents**
Uploaded documents for RAG
```typescript
{
  userId: Id<"users">,
  title: string,
  content: string,
  sourceType: "pdf" | "social" | "manual" | "website",
  sourceUrl?: string,
  fileId?: Id<"_storage">,
  metadata?: {
    platform?: string,
    author?: string,
    publishedAt?: number,
    tags?: string[],
  },
  uploadedAt: number,
  processedAt?: number,
  isPublic: boolean,
  isProcessed: boolean,
}
```

#### 6. **documentChunks**
Chunked documents for vector search
```typescript
{
  documentId: Id<"documents">,
  userId: Id<"users">,
  content: string,
  chunkIndex: number,
  startIndex: number,         // Position in original document
  endIndex: number,
  embedding?: number[],       // Vector embedding
  embeddingModel?: string,
  keywords?: string[],        // For hybrid search
}
```

---

## 🤖 AI Chat & RAG System

### How RAG (Retrieval Augmented Generation) Works

1. **Document Ingestion**
   - User uploads PDFs or connects social media
   - Documents are chunked into ~1000 character segments
   - Each chunk is embedded using OpenAI embeddings
   - Chunks stored in `documentChunks` table

2. **Query Processing**
   - User asks AI a question
   - Question is embedded into vector
   - Vector similarity search finds relevant chunks
   - Top chunks are retrieved with relevance scores

3. **Response Generation**
   - Relevant chunks + user profile info → system prompt
   - Conversation history + new question → context
   - OpenAI generates personalized response
   - Sources are tracked and displayed

### AI Chat Flow

```typescript
// 1. User sends message
await sendAiMessage({
  profileOwnerId: "...",
  message: "What projects have you worked on?"
});

// 2. Backend schedules AI response generation
await generateAiResponse({
  chatId,
  profileOwnerId,
  userMessage: "What projects have you worked on?"
});

// 3. RAG retrieval
const context = await vectorSearch.search({
  query: userMessage,
  userId: profileOwnerId,
  limit: 5
});

// 4. Build enhanced prompt
const systemPrompt = `
You are ${profile.name}. Respond in first person.

Profile: ${profile.bio}
Skills: ${profile.skills.join(", ")}

Relevant Context:
${context.map(c => c.content).join("\n\n")}

Answer as if you're the actual person.
`;

// 5. Generate response
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
  ],
});

// 6. Save response with sources
await addAiMessage({
  chatId,
  message: response.content,
  sources: context.map(c => ({
    documentId: c.documentId,
    title: c.title,
    relevanceScore: c.score,
  })),
});
```

---

## 📞 Voice Chat Integration (Vapi)

### How Voice Chat Works

1. User initiates voice call from a profile
2. Frontend requests call token from Vapi
3. Vapi connects to AI assistant configured for that user
4. Real-time voice conversation with AI persona
5. Conversation stored in Convex for history

### Vapi Webhook Handler

```typescript
// convex/vapiWebhook.ts
export const vapiWebhookHandler = httpAction(async (ctx, request) => {
  const payload = await request.json();

  switch (payload.event) {
    case "call.started":
      // Log call start
      break;
    case "call.ended":
      // Save transcript to database
      await ctx.runMutation(internal.calls.saveCallRecord, {
        userId: payload.userId,
        transcript: payload.transcript,
        duration: payload.duration,
      });
      break;
  }
});
```

---

## 🔄 Real-time Features

### Convex Subscriptions

All queries are automatically reactive. When data changes, components re-render:

```typescript
// Frontend component
function DiscoveryView() {
  // This automatically updates when new profiles are added
  const nextProfile = useQuery(api.discovery.getNextProfile);

  return (
    <div>
      <h2>{nextProfile?.name}</h2>
      <p>{nextProfile?.bio}</p>
    </div>
  );
}
```

### How It Works

1. Component calls `useQuery(api.discovery.getNextProfile)`
2. Convex opens WebSocket connection
3. Query executes on server, result streamed to client
4. If underlying data changes, query re-executes automatically
5. New results pushed to client in real-time
6. Component re-renders with fresh data

---

## 🚀 Deployment & Environment

### Environment Variables

```bash
# Frontend (.env.local)
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CONVEX_SITE_URL=https://your-project.convex.site

# Backend (Convex Dashboard or CLI)
CONVEX_OPENAI_API_KEY=sk-...
CONVEX_OPENAI_BASE_URL=https://api.openai.com/v1
BETTER_AUTH_SECRET=<random-64-char-string>
SITE_URL=http://localhost:5173  # or production URL
```

### Development Setup

```bash
# Install dependencies
bun install

# Start both frontend and backend
bun dev

# Or run separately:
bun dev:frontend  # Vite dev server on :5173
bun dev:backend   # Convex dev with hot reload
```

### Production Deployment

```bash
# Deploy Convex backend
npx convex deploy --prod

# Build frontend
bun run build

# Deploy frontend (Vercel/Netlify/etc)
vercel deploy
```

---

## 📁 Project Structure

```
BuddyFounder/
├── convex/                      # Backend code
│   ├── _generated/              # Auto-generated types
│   ├── auth.ts                  # Better Auth configuration
│   ├── http.ts                  # HTTP routes (auth, webhooks)
│   ├── schema.ts                # Database schema
│   ├── profiles.ts              # Profile queries/mutations
│   ├── discovery.ts             # Swipe/matching logic
│   ├── aiChat.ts                # AI chat with RAG
│   ├── documents.ts             # Document upload/processing
│   ├── vectorSearch.ts          # Semantic search
│   ├── matches.ts               # Match management
│   ├── notifications.ts         # Notification system
│   └── convex.config.ts         # Component registration
│
├── src/                         # Frontend code
│   ├── components/              # React components
│   │   ├── Landing.tsx          # Landing page
│   │   ├── ProfileView.tsx      # Profile display
│   │   ├── Discovery.tsx        # Swipe interface
│   │   ├── AiChat.tsx           # AI chat UI
│   │   └── ...
│   ├── lib/                     # Utilities
│   │   └── auth-client.ts       # Better Auth client
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.html               # HTML template
│
├── public/                      # Static assets
│   └── logo.png                 # App logo
│
├── docs/                        # Documentation
│   └── CONVEX_RULES.md         # Convex best practices
│
├── .env.local                   # Environment variables
├── package.json                 # Dependencies
├── vite.config.ts              # Vite configuration
└── README.md                    # This file
```

---

## 🔧 Common Patterns & Best Practices

### 1. Authentication in Convex Functions

Always extract user ID at the start of functions:

```typescript
export const myQuery = query({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    const userId = user?._id as any;
    if (!userId) throw new Error("Not authenticated");

    // Continue with logic...
  },
});
```

### 2. Type-Safe Queries

Use generated API types:

```typescript
import { api } from "../convex/_generated/api";

// Type-safe, autocomplete works
const profile = useQuery(api.profiles.getCurrentProfile);
```

### 3. Error Handling

Always handle errors gracefully:

```typescript
try {
  await swipe({ direction: "right", profileId });
} catch (error) {
  if (error.message.includes("already swiped")) {
    toast.info("You've already seen this profile");
  } else {
    toast.error("Something went wrong");
  }
}
```

### 4. Optimistic Updates

For better UX, update UI before server confirms:

```typescript
const sendMessage = useMutation(api.aiChat.sendAiMessage);

const handleSend = async (message: string) => {
  // Optimistically add message to UI
  setMessages(prev => [...prev, { role: "user", content: message }]);

  // Send to server
  await sendMessage({ message, profileOwnerId });
};
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Type errors with `Id<"user">` vs `Id<"users">`

**Problem**: Better Auth creates `user` table (singular) but app uses `users` references.

**Solution**: Always cast user IDs:
```typescript
const userId = user?._id as any;
```

#### 2. `authComponent.getAuthUserId` doesn't exist

**Problem**: Old Convex Auth API.

**Solution**: Use `getAuthUser()` instead:
```typescript
// ❌ Old
const userId = await authComponent.getAuthUserId(ctx);

// ✅ New
const user = await authComponent.getAuthUser(ctx);
const userId = user?._id as any;
```

#### 3. Schema errors about `authTables`

**Problem**: Old auth package import.

**Solution**: Remove old import:
```typescript
// ❌ Remove this
import { authTables } from "@convex-dev/auth/server";

// ✅ Better Auth manages its own tables
export default defineSchema(applicationTables);
```

#### 4. Missing `startIndex` and `endIndex` in document chunks

**Problem**: Schema requires these fields but chunking code doesn't provide them.

**Solution**: Track character positions when chunking:
```typescript
const chunks = [];
let currentPosition = 0;

for (const paragraph of paragraphs) {
  const startIndex = currentPosition;
  const endIndex = currentPosition + paragraph.length;

  chunks.push({
    content: paragraph,
    startIndex,
    endIndex,
  });

  currentPosition = endIndex + 2; // +2 for \n\n
}
```

---

## 📚 Additional Resources

- **Convex Docs**: https://docs.convex.dev
- **Better Auth Docs**: https://better-auth.com
- **Vapi Docs**: https://docs.vapi.ai
- **TanStack Router**: https://tanstack.com/router
- **OpenAI API**: https://platform.openai.com/docs

---

## 🤝 Contributing

We follow these conventions:

1. **Commit Messages**: Use conventional commits
   ```bash
   feat: add voice chat feature
   fix: resolve profile loading issue
   chore: update dependencies
   ```

2. **Code Style**:
   - 2-space indentation
   - Functional components + hooks
   - TypeScript strict mode
   - No `any` types (except for auth ID casting)

3. **Pull Requests**:
   - Create feature branch
   - Write descriptive PR title
   - Include test plan
   - Request review

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🙏 Acknowledgments

Built with:
- ❤️ for the founder community
- ⚡ Convex for real-time backend
- 🤖 OpenAI for AI capabilities
- 🎙️ Vapi for voice integration
- 🔐 Better Auth for authentication

---

**Happy Founder Matching! 🚀**
