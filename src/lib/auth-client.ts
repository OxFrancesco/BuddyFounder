import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";

const siteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
if (!siteUrl || typeof siteUrl !== "string") {
  throw new Error("VITE_CONVEX_SITE_URL must be set");
}

export const authClient = createAuthClient({
  baseURL: siteUrl,
  plugins: [convexClient(), crossDomainClient()],
});