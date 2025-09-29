/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiChat from "../aiChat.js";
import type * as auth from "../auth.js";
import type * as cofounderAgent from "../cofounderAgent.js";
import type * as discovery from "../discovery.js";
import type * as documents from "../documents.js";
import type * as embeddings from "../embeddings.js";
import type * as http from "../http.js";
import type * as ingestion_pdfProcessor from "../ingestion/pdfProcessor.js";
import type * as ingestion_socialScraper from "../ingestion/socialScraper.js";
import type * as matches from "../matches.js";
import type * as notifications from "../notifications.js";
import type * as profiles from "../profiles.js";
import type * as router from "../router.js";
import type * as vapiWebhook from "../vapiWebhook.js";
import type * as vectorSearch from "../vectorSearch.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiChat: typeof aiChat;
  auth: typeof auth;
  cofounderAgent: typeof cofounderAgent;
  discovery: typeof discovery;
  documents: typeof documents;
  embeddings: typeof embeddings;
  http: typeof http;
  "ingestion/pdfProcessor": typeof ingestion_pdfProcessor;
  "ingestion/socialScraper": typeof ingestion_socialScraper;
  matches: typeof matches;
  notifications: typeof notifications;
  profiles: typeof profiles;
  router: typeof router;
  vapiWebhook: typeof vapiWebhook;
  vectorSearch: typeof vectorSearch;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
