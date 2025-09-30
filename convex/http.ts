import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { vapiWebhookHandler } from "./vapiWebhook";

const http = httpRouter();

// Register Better Auth route handlers with CORS enabled
// CORS handling is required for client side frameworks
authComponent.registerRoutes(http, createAuth, { cors: true });

// Add Vapi webhook route
http.route({
  path: "/vapi/webhook",
  method: "POST",
  handler: vapiWebhookHandler,
});

export default http;