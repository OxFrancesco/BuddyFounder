import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SwipeCard } from "../components/SwipeCard";
import { MatchModal } from "../components/MatchModal";
import { clsx } from "clsx";
import { Id } from "../../convex/_generated/dataModel";

interface MatchedProfile {
  name: string;
  bio: string;
  photos: Array<{ id: Id<"_storage">; url: string | null }>;
  userId: Id<"users">;
}

export function Discovery() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [matchModal, setMatchModal] = useState<{
    isOpen: boolean;
    profile?: MatchedProfile;
    matchId?: Id<"matches">;
  }>({
    isOpen: false,
  });

  const profiles = useQuery(api.discovery.getDiscoveryProfiles);
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount);

  const handleSwipe = useCallback(
    (direction: "left" | "right", isMatch?: boolean) => {
      // Show match modal if it's a match
      if (isMatch && profiles && profiles[currentCardIndex]) {
        const matchedProfile = profiles[currentCardIndex];
        setMatchModal({
          isOpen: true,
          profile: {
            name: matchedProfile.name,
            bio: matchedProfile.bio,
            photos: matchedProfile.photos,
            userId: matchedProfile.userId,
          },
          matchId: undefined, // We'll need to pass this from the swipe response
        });
      }

      // Move to next card
      setCurrentCardIndex((prev) => prev + 1);
    },
    [profiles, currentCardIndex]
  );

  const closeMatchModal = () => {
    setMatchModal({ isOpen: false });
  };

  if (profiles === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  const remainingProfiles = profiles.slice(currentCardIndex);
  const hasMoreProfiles = remainingProfiles.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">BuddyFounder</h1>
            </div>

            <nav className="flex items-center space-x-6">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <span className="text-lg">🔔</span>
                {unreadCount && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <span className="text-lg">💬</span>
              </button>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <span className="text-lg">👤</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm h-[600px]">
          {hasMoreProfiles ? (
            <>
              {/* Card Stack */}
              {remainingProfiles.slice(0, 3).map((profile, index) => (
                <SwipeCard
                  key={`${profile._id}-${currentCardIndex + index}`}
                  profile={profile}
                  onSwipe={handleSwipe}
                  isTopCard={index === 0}
                  cardIndex={index}
                />
              ))}

              {/* Instructions */}
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center">
                <p className="text-gray-600 text-sm mb-2">
                  Swipe right to like • Swipe left to pass
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-200"></div>
                    <span>Pass</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-200"></div>
                    <span>Like</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-4 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                That's everyone for now!
              </h2>
              <p className="text-gray-600 mb-6">
                Check back later for more founder profiles, or update your preferences to see different matches.
              </p>
              <button
                onClick={() => setCurrentCardIndex(0)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Reset Cards
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Stats */}
      {hasMoreProfiles && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <p className="text-sm text-gray-600 font-medium">
            {remainingProfiles.length} founder{remainingProfiles.length !== 1 ? "s" : ""} remaining
          </p>
        </div>
      )}

      {/* Match Modal */}
      {matchModal.profile && matchModal.matchId && (
        <MatchModal
          isOpen={matchModal.isOpen}
          onClose={closeMatchModal}
          matchedProfile={matchModal.profile}
          matchId={matchModal.matchId}
        />
      )}
    </div>
  );
}