import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface CofounderAgentProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CofounderAgent({ isOpen, onClose }: CofounderAgentProps) {
  const [messages, setMessages] = useState<Array<{
    role: "user" | "assistant";
    content: string;
  }>>([
    {
      role: "assistant",
      content: "Hi! I'm your AI co-founder assistant. I can help you find the perfect co-founder match based on your profile and preferences. What are you looking for in a co-founder?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const profilesData = useQuery(api.cofounderAgent.getAllProfilesForAgent);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !profilesData) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Simulate AI processing with the profiles data
      const response = await generateCofounderRecommendations(userMessage, profilesData);

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-card border border-border rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Co-founder Assistant</h3>
            <p className="text-xs text-muted-foreground">Find your perfect match</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about co-founders..."
            className="flex-1 px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

// Simple AI recommendation logic using the profile data
async function generateCofounderRecommendations(
  userQuery: string,
  profilesData: { profiles: any[], currentUser: any }
) {
  const { profiles, currentUser } = profilesData;

  if (!currentUser) {
    return "It looks like you haven't completed your profile yet. Please complete your profile first so I can better understand what you're looking for in a co-founder!";
  }

  const query = userQuery.toLowerCase();

  // Simple keyword matching for different types of queries
  if (query.includes("technical") || query.includes("developer") || query.includes("engineer")) {
    const technicalProfiles = profiles.filter(p =>
      p.skills.some((skill: string) =>
        skill.toLowerCase().includes("development") ||
        skill.toLowerCase().includes("engineering") ||
        skill.toLowerCase().includes("technical")
      )
    );

    if (technicalProfiles.length === 0) {
      return "I couldn't find any technical co-founders right now. You might want to try expanding your search or check back later as new profiles are added!";
    }

    const recommendations = technicalProfiles.slice(0, 3).map((profile: any) =>
      `**${profile.name}** (${profile.experience})\n- Skills: ${profile.skills.join(", ")}\n- Interests: ${profile.interests.join(", ")}\n- Bio: ${profile.bio.substring(0, 100)}...`
    ).join("\n\n");

    return `Here are some technical co-founders that might be a great fit:\n\n${recommendations}\n\nWould you like me to help you connect with any of these people or find more specific matches?`;
  }

  if (query.includes("business") || query.includes("marketing") || query.includes("sales")) {
    const businessProfiles = profiles.filter(p =>
      p.skills.some((skill: string) =>
        skill.toLowerCase().includes("business") ||
        skill.toLowerCase().includes("marketing") ||
        skill.toLowerCase().includes("sales")
      )
    );

    if (businessProfiles.length === 0) {
      return "I couldn't find any business-focused co-founders right now. You might want to try expanding your search or check back later!";
    }

    const recommendations = businessProfiles.slice(0, 3).map((profile: any) =>
      `**${profile.name}** (${profile.experience})\n- Skills: ${profile.skills.join(", ")}\n- Interests: ${profile.interests.join(", ")}\n- Bio: ${profile.bio.substring(0, 100)}...`
    ).join("\n\n");

    return `Here are some business-minded co-founders that could complement your skills:\n\n${recommendations}\n\nWould you like more details about any of these matches?`;
  }

  if (query.includes("match") || query.includes("recommend") || query.includes("suggest")) {
    // Find profiles with complementary skills
    const currentSkills = currentUser.skills.map((s: string) => s.toLowerCase());
    const complementaryProfiles = profiles.filter(p => {
      const profileSkills = p.skills.map((s: string) => s.toLowerCase());
      // Look for profiles with different skills (complementary)
      return profileSkills.some((skill: string) => !currentSkills.includes(skill));
    });

    if (complementaryProfiles.length === 0) {
      return `Based on your profile, I'd suggest looking for co-founders with complementary skills. You have experience in: ${currentUser.skills.join(", ")}. Consider looking for someone with different but complementary expertise!`;
    }

    const topMatches = complementaryProfiles.slice(0, 3).map((profile: any) =>
      `**${profile.name}** (${profile.experience})\n- Complementary skills: ${profile.skills.join(", ")}\n- Shared interests: ${profile.interests.filter((i: string) => currentUser.interests.includes(i)).join(", ") || "Different focus areas"}\n- Bio: ${profile.bio.substring(0, 100)}...`
    ).join("\n\n");

    return `Based on your profile, here are some co-founders with complementary skills:\n\n${topMatches}\n\nThese matches could bring different expertise to balance your strengths. Want to learn more about any of them?`;
  }

  // Default response with general stats
  const totalProfiles = profiles.length;
  const experiences = profiles.map(p => p.experience);
  const experienceCounts = experiences.reduce((acc: any, exp: string) => {
    acc[exp] = (acc[exp] || 0) + 1;
    return acc;
  }, {});

  return `I currently have access to ${totalProfiles} active co-founder profiles. Here's what's available:\n\n${Object.entries(experienceCounts).map(([exp, count]) => `• ${count} ${exp} founders`).join("\n")}\n\nYou can ask me to find:\n- Technical co-founders\n- Business co-founders\n- Co-founders with specific skills\n- General recommendations based on your profile\n\nWhat type of co-founder are you looking for?`;
}