import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface DiscoveryProps {
  onStartAiChat: (target: { userId: Id<"users">; name: string }) => void;
}

export function Discovery({ onStartAiChat }: DiscoveryProps) {
  const profiles = useQuery(api.discovery.getDiscoveryProfiles);
  const swipeProfile = useMutation(api.discovery.swipeProfile);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!profiles) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No more profiles!
        </h2>
        <p className="text-gray-600">
          Check back later for new potential co-founders
        </p>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  const handleSwipe = async (direction: "left" | "right") => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    try {
      const result = await swipeProfile({
        swipedUserId: currentProfile.userId,
        direction,
      });

      if (result.isMatch) {
        toast.success("🎉 It's a match! You can now chat with each other.");
      }

      // Move to next profile
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    } catch (error) {
      toast.error("Something went wrong");
      setIsAnimating(false);
    }
  };

  const handleAiChat = () => {
    onStartAiChat({
      userId: currentProfile.userId,
      name: currentProfile.name,
    });
  };

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No more profiles!
        </h2>
        <p className="text-gray-600">
          Check back later for new potential co-founders
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-4">
      {/* Profile Card */}
      <div className={`flex-1 bg-white rounded-2xl shadow-xl overflow-hidden transition-transform duration-300 ${
        isAnimating ? "scale-95 opacity-50" : "scale-100 opacity-100"
      }`}>
        {/* Photos */}
        <div className="h-96 relative">
          {currentProfile.photos.length > 0 ? (
            <img
              src={currentProfile.photos[0].url || ""}
              alt={currentProfile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-6xl">👤</div>
            </div>
          )}
          
          {/* Photo indicators */}
          {currentProfile.photos.length > 1 && (
            <div className="absolute top-4 left-4 right-4 flex space-x-1">
              {currentProfile.photos.map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-1 rounded ${
                    index === 0 ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}

          {/* AI Chat Button */}
          <button
            onClick={handleAiChat}
            className="absolute top-4 right-4 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
            title="Chat with AI"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <span className="text-sm font-bold">AI</span>
            </div>
          </button>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentProfile.name}
            </h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              {currentProfile.experience}
            </span>
          </div>

          {currentProfile.location && (
            <p className="text-gray-600 mb-4 flex items-center">
              <span className="mr-2">📍</span>
              {currentProfile.location}
            </p>
          )}

          <p className="text-gray-700 mb-4 leading-relaxed">
            {currentProfile.bio}
          </p>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Looking for:</h3>
            <span className="px-3 py-1 bg-muted text-foreground rounded-full text-sm">
              {currentProfile.lookingFor}
            </span>
          </div>

          {currentProfile.skills.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Skills:</h3>
              <div className="flex flex-wrap gap-2">
                {currentProfile.skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {skill}
                  </span>
                ))}
                {currentProfile.skills.length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                    +{currentProfile.skills.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {currentProfile.interests.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Interests:</h3>
              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.slice(0, 4).map((interest) => (
                  <span
                    key={interest}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
                  >
                    {interest}
                  </span>
                ))}
                {currentProfile.interests.length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                    +{currentProfile.interests.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-8 py-6">
        <button
          onClick={() => handleSwipe("left")}
          disabled={isAnimating}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform disabled:opacity-50"
        >
          ❌
        </button>
        <button
          onClick={handleAiChat}
          disabled={isAnimating}
          className="w-16 h-16 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full shadow-lg flex items-center justify-center font-bold hover:scale-110 transition-transform disabled:opacity-50"
        >
          AI
        </button>
        <button
          onClick={() => handleSwipe("right")}
          disabled={isAnimating}
          className="w-16 h-16 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform disabled:opacity-50"
        >
          ❤️
        </button>
      </div>
    </div>
  );
}
