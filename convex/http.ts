import { auth } from "./auth";
import router from "./router";
import { vapiWebhookHandler } from "./vapiWebhook";

const http = router;

auth.addHttpRoutes(http);

// Add Vapi webhook routes
http.route({
  path: "/vapi/webhook",
  method: "POST",
  handler: vapiWebhookHandler
});

export default http;
