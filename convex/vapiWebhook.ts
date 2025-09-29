import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Vapi webhook handler
export const vapiWebhookHandler = httpAction(async (ctx, request) => {
    const body = await request.json();
    const { message } = body;

    console.log("Vapi webhook received:", message.type);

    try {
      switch (message.type) {
        case "function-call":
          return await handleFunctionCall(ctx, message);

        case "status-update":
          await handleStatusUpdate(ctx, message);
          break;

        case "transcript":
          await handleTranscript(ctx, message);
          break;

        case "call-start":
          await handleCallStart(ctx, message);
          break;

        case "call-end":
          await handleCallEnd(ctx, message);
          break;
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Vapi webhook error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
});

// Add the route to the http router
http.route({
  path: "/vapi/webhook",
  method: "POST",
  handler: vapiWebhookHandler,
});

async function handleFunctionCall(ctx: any, message: any) {
  const { functionCall, call } = message;
  const functionName = functionCall.name;
  const parameters = functionCall.parameters;

  console.log(`Handling function call: ${functionName}`, parameters);

  switch (functionName) {
    case "get_profile_info":
      return await getProfileInfo(ctx, parameters, call);

    case "send_message":
      return await sendMessageToProfile(ctx, parameters, call);

    case "check_compatibility":
      return await checkCompatibility(ctx, parameters, call);

    default:
      return new Response(JSON.stringify({
        error: `Unknown function: ${functionName}`
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
  }
}

async function getProfileInfo(ctx: any, parameters: any, call: any) {
  try {
    // Extract profile owner ID from call metadata or assistant config
    const profileOwnerId = call.metadata?.profileOwnerId;

    if (!profileOwnerId) {
      return new Response(JSON.stringify({
        error: "Profile owner ID not found in call metadata"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get profile information from our existing backend
    const profileInfo = await ctx.runQuery(internal.profiles.getProfileForVapi, {
      userId: profileOwnerId,
      infoType: parameters.info_type
    });

    if (!profileInfo) {
      return new Response(JSON.stringify({
        result: "I don't have that information available. You can ask them directly!"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    let response = "";
    switch (parameters.info_type) {
      case "skills":
        response = `My key skills include: ${profileInfo.skills.join(", ")}. ${profileInfo.experience === "expert" ? "I've been developing these skills for several years." : "I'm always learning and growing in these areas."}`;
        break;

      case "experience":
        response = `I'm at ${profileInfo.experience} level with ${profileInfo.bio ? profileInfo.bio.slice(0, 100) + "..." : "various projects and experiences."}`;
        break;

      case "interests":
        response = `I'm passionate about: ${profileInfo.interests.join(", ")}. These really drive my work and projects.`;
        break;

      case "projects":
        response = `I'm currently working on exciting projects in ${profileInfo.lookingFor}. I'd love to tell you more if we connect!`;
        break;

      case "contact":
        response = "If you'd like to connect further, you can like my profile and we can chat more in the app!";
        break;

      default:
        response = "That's a great question! Feel free to ask me anything else about my background.";
    }

    return new Response(JSON.stringify({ result: response }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error getting profile info:", error);
    return new Response(JSON.stringify({
      result: "Sorry, I'm having trouble accessing that information right now."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function sendMessageToProfile(ctx: any, parameters: any, call: any) {
  // This could be used to send a message request through the app
  return new Response(JSON.stringify({
    result: "Thanks for your interest! To continue our conversation, please connect with me through the app."
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

async function checkCompatibility(ctx: any, parameters: any, call: any) {
  // This could analyze compatibility between the current user and profile owner
  return new Response(JSON.stringify({
    result: "Based on what I know about you both, you might make great co-founders! Consider connecting to explore opportunities."
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

async function handleStatusUpdate(ctx: any, message: any) {
  const { call } = message;
  console.log(`Call ${call.id} status: ${call.status}`);

  // Could track call analytics or notify users
  // await ctx.runMutation(internal.analytics.trackVoiceCall, {
  //   callId: call.id,
  //   status: call.status,
  //   profileOwnerId: call.metadata?.profileOwnerId
  // });
}

async function handleTranscript(ctx: any, message: any) {
  const { transcript, role, call } = message;
  console.log(`${role}: ${transcript}`);

  // Could save conversation transcripts for later analysis
  // await ctx.runMutation(internal.conversations.saveTranscript, {
  //   callId: call.id,
  //   role,
  //   content: transcript,
  //   timestamp: Date.now()
  // });
}

async function handleCallStart(ctx: any, message: any) {
  const { call } = message;
  console.log(`Voice call started: ${call.id}`);

  // Could track that a voice conversation began
  // await ctx.runMutation(internal.analytics.trackVoiceCallStart, {
  //   callId: call.id,
  //   profileOwnerId: call.metadata?.profileOwnerId,
  //   startTime: Date.now()
  // });
}

async function handleCallEnd(ctx: any, message: any) {
  const { call } = message;
  console.log(`Voice call ended: ${call.id}`);

  // Could track call completion and duration
  // await ctx.runMutation(internal.analytics.trackVoiceCallEnd, {
  //   callId: call.id,
  //   profileOwnerId: call.metadata?.profileOwnerId,
  //   endTime: Date.now(),
  //   duration: call.duration
  // });
}

export default http;