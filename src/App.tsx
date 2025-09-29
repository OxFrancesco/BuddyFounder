import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { ProfileSetup } from "./components/ProfileSetup";
import { ProfileView } from "./components/ProfileView";
import { Discovery } from "./components/Discovery";
import { Matches } from "./components/Matches";
import { Chat } from "./components/Chat";
import { DocumentManager } from "./components/DocumentManager";
import { AiChat } from "./components/AiChat";
import { CofounderAgent } from "./components/CofounderAgent";

export default function App() {
  const [currentView, setCurrentView] = useState<"discovery" | "matches" | "profile" | "documents">("discovery");
  const [selectedMatchId, setSelectedMatchId] = useState<Id<"matches"> | null>(null);
  const [aiChatTarget, setAiChatTarget] = useState<{ userId: Id<"users">; name: string } | null>(null);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm h-16 flex justify-between items-center border-b border-border shadow-sm px-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          BuddyFounder
        </h2>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      
      <main className="flex-1">
        <Authenticated>
          <AuthenticatedApp
            currentView={currentView}
            setCurrentView={setCurrentView}
            selectedMatchId={selectedMatchId}
            setSelectedMatchId={setSelectedMatchId}
            aiChatTarget={aiChatTarget}
            setAiChatTarget={setAiChatTarget}
            isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile}
          />
        </Authenticated>
        
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-8">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Find Your Co-Founder
                </h1>
                <p className="text-xl text-gray-600">
                  Swipe to discover amazing people to build your next project with
                </p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
      </main>

      {/* Floating AI Agent Button */}
      <Authenticated>
        <button
          onClick={() => setIsAgentOpen(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-30 group"
          aria-label="Open Foundy assistant"
        >
          <div className="relative">
            <span className="text-xl">🤖</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
          </div>
          <div className="absolute right-full mr-3 px-3 py-1 bg-card text-card-foreground rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium">
            Chat with Foundy
          </div>
        </button>

        {/* AI Agent Component */}
        <CofounderAgent isOpen={isAgentOpen} onClose={() => setIsAgentOpen(false)} />
      </Authenticated>

      <Toaster />
    </div>
  );
}

function AuthenticatedApp({
  currentView,
  setCurrentView,
  selectedMatchId,
  setSelectedMatchId,
  aiChatTarget,
  setAiChatTarget,
  isEditingProfile,
  setIsEditingProfile
}: {
  currentView: "discovery" | "matches" | "profile" | "documents";
  setCurrentView: (view: "discovery" | "matches" | "profile" | "documents") => void;
  selectedMatchId: Id<"matches"> | null;
  setSelectedMatchId: (id: Id<"matches"> | null) => void;
  aiChatTarget: { userId: Id<"users">; name: string } | null;
  setAiChatTarget: (target: { userId: Id<"users">; name: string } | null) => void;
  isEditingProfile: boolean;
  setIsEditingProfile: (editing: boolean) => void;
}) {
  const profile = useQuery(api.profiles.getCurrentUserProfile);

  if (profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show profile setup if no profile exists or profile is incomplete
  // Treat undefined isComplete as incomplete (for backward compatibility)
  if (!profile || profile.isComplete !== true) {
    return <ProfileSetup />;
  }

  if (selectedMatchId) {
    return (
      <Chat 
        matchId={selectedMatchId} 
        onBack={() => setSelectedMatchId(null)} 
      />
    );
  }

  if (aiChatTarget) {
    return (
      <AiChat
        profileOwnerId={aiChatTarget.userId}
        profileOwnerName={aiChatTarget.name}
        onBack={() => setAiChatTarget(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1">
        {currentView === "discovery" && (
          <Discovery onStartAiChat={setAiChatTarget} />
        )}
        {currentView === "matches" && (
          <Matches onSelectMatch={setSelectedMatchId} onStartAiChat={setAiChatTarget} />
        )}
        {currentView === "profile" && (
          isEditingProfile ? (
            <ProfileSetup />
          ) : (
            <ProfileView onEdit={() => setIsEditingProfile(true)} />
          )
        )}
        {currentView === "documents" && <DocumentManager />}
      </div>
      
      {/* Bottom Navigation */}
      <nav className="bg-card border-t border-border px-4 py-2 relative z-20">
        <div className="flex justify-around">
          <button
            onClick={() => {
              setCurrentView("discovery");
              setIsEditingProfile(false);
            }}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === "discovery"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-2xl mb-1">🔍</span>
            <span className="text-xs">Discover</span>
          </button>
          
          <button
            onClick={() => {
              setCurrentView("matches");
              setIsEditingProfile(false);
            }}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === "matches"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-2xl mb-1">💬</span>
            <span className="text-xs">Matches</span>
          </button>

          <button
            onClick={() => {
              setCurrentView("documents");
              setIsEditingProfile(false);
            }}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === "documents"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-2xl mb-1">📄</span>
            <span className="text-xs">Docs</span>
          </button>
          
          <button
            onClick={() => {
              setCurrentView("profile");
              setIsEditingProfile(false);
            }}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === "profile"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="text-2xl mb-1">👤</span>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
