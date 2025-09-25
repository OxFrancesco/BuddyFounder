import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { ProfileSetup } from "./components/ProfileSetup";
import { Discovery } from "./components/Discovery";
import { Matches } from "./components/Matches";
import { Chat } from "./components/Chat";
import { DocumentManager } from "./components/DocumentManager";
import { AiChat } from "./components/AiChat";

export default function App() {
  const [currentView, setCurrentView] = useState<"discovery" | "matches" | "profile" | "documents">("discovery");
  const [selectedMatchId, setSelectedMatchId] = useState<Id<"matches"> | null>(null);
  const [aiChatTarget, setAiChatTarget] = useState<{ userId: Id<"users">; name: string } | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 to-purple-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
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
  setAiChatTarget
}: {
  currentView: "discovery" | "matches" | "profile" | "documents";
  setCurrentView: (view: "discovery" | "matches" | "profile" | "documents") => void;
  selectedMatchId: Id<"matches"> | null;
  setSelectedMatchId: (id: Id<"matches"> | null) => void;
  aiChatTarget: { userId: Id<"users">; name: string } | null;
  setAiChatTarget: (target: { userId: Id<"users">; name: string } | null) => void;
}) {
  const profile = useQuery(api.profiles.getCurrentUserProfile);

  if (profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!profile) {
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
          <Matches onSelectMatch={setSelectedMatchId} />
        )}
        {currentView === "profile" && <ProfileSetup isEditing />}
        {currentView === "documents" && <DocumentManager />}
      </div>
      
      {/* Bottom Navigation */}
      <nav className="bg-white border-t px-4 py-2">
        <div className="flex justify-around">
          <button
            onClick={() => setCurrentView("discovery")}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === "discovery" 
                ? "text-pink-500 bg-pink-50" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="text-2xl mb-1">🔍</span>
            <span className="text-xs">Discover</span>
          </button>
          
          <button
            onClick={() => setCurrentView("matches")}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === "matches" 
                ? "text-pink-500 bg-pink-50" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="text-2xl mb-1">💬</span>
            <span className="text-xs">Matches</span>
          </button>

          <button
            onClick={() => setCurrentView("documents")}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === "documents" 
                ? "text-pink-500 bg-pink-50" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="text-2xl mb-1">📄</span>
            <span className="text-xs">Docs</span>
          </button>
          
          <button
            onClick={() => setCurrentView("profile")}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === "profile" 
                ? "text-pink-500 bg-pink-50" 
                : "text-gray-500 hover:text-gray-700"
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
