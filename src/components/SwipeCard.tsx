import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { clsx } from "clsx";
import { Id } from "../../convex/_generated/dataModel";

interface SwipeCardProps {
  profile: {
    _id: string;
    userId: Id<"users">;
    name: string;
    bio: string;
    skills: string[];
    interests: string[];
    lookingFor: string;
    experience: string;
    location?: string;
    photos: Array<{ id: Id<"_storage">; url: string | null }>;
  };
  onSwipe: (direction: "left" | "right", isMatch?: boolean) => void;
  isTopCard: boolean;
  cardIndex: number;
}

export function SwipeCard({ profile, onSwipe, isTopCard, cardIndex }: SwipeCardProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const swipeProfile = useMutation(api.discovery.swipeProfile);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isTopCard) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isTopCard) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;

    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = async () => {
    if (!isDragging || !isTopCard) return;

    setIsDragging(false);

    const threshold = 120;
    const direction = Math.abs(dragOffset.x) > threshold ? (dragOffset.x > 0 ? "right" : "left") : null;

    if (direction) {
      try {
        const result = await swipeProfile({
          swipedUserId: profile.userId,
          direction,
        });

        if (result.isMatch) {
          toast.success(`🎉 It's a Match with ${profile.name}!`, {
            description: "You can now start chatting or try their AI assistant!",
            duration: 4000,
          });
        }

        onSwipe(direction, result.isMatch);
      } catch (error) {
        console.error("Error swiping:", error);
        toast.error("Failed to swipe. Please try again.");
      }
    }

    setDragOffset({ x: 0, y: 0 });
  };

  const handleActionClick = async (direction: "left" | "right") => {
    if (!isTopCard) return;

    try {
      const result = await swipeProfile({
        swipedUserId: profile.userId,
        direction,
      });

      if (result.isMatch) {
        toast.success(`🎉 It's a Match with ${profile.name}!`, {
          description: "You can now start chatting or try their AI assistant!",
          duration: 4000,
        });
      }

      onSwipe(direction, result.isMatch);
    } catch (error) {
      console.error("Error swiping:", error);
      toast.error("Failed to swipe. Please try again.");
    }
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === profile.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? profile.photos.length - 1 : prev - 1
    );
  };

  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) * 0.004;

  const cardStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg) scale(${isTopCard ? 1 : 0.95})`,
    opacity: isTopCard ? opacity : 1,
    zIndex: 10 - cardIndex,
  };

  const currentPhoto = profile.photos[currentPhotoIndex];

  return (
    <div
      ref={cardRef}
      className={clsx(
        "absolute inset-4 bg-white rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-transform",
        !isTopCard && "pointer-events-none",
        isDragging && "transition-none"
      )}
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Photo Section */}
      <div className="relative h-2/3 bg-muted">
        {currentPhoto?.url ? (
          <img
            src={currentPhoto.url}
            alt={profile.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-gray-400">
            {profile.name[0]}
          </div>
        )}

        {/* Photo Navigation */}
        {profile.photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur text-white flex items-center justify-center hover:bg-black/40 transition-colors"
            >
              ‹
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur text-white flex items-center justify-center hover:bg-black/40 transition-colors"
            >
              ›
            </button>

            {/* Photo Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {profile.photos.map((_, index) => (
                <div
                  key={index}
                  className={clsx(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentPhotoIndex ? "bg-white" : "bg-white/40"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Swipe Indicators */}
        {dragOffset.x > 50 && (
          <div className="absolute top-8 right-8 px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-lg transform rotate-12">
            LIKE
          </div>
        )}
        {dragOffset.x < -50 && (
          <div className="absolute top-8 left-8 px-4 py-2 bg-red-500 text-white rounded-lg font-bold text-lg transform -rotate-12">
            PASS
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="h-1/3 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
            <span className="text-sm text-gray-500 capitalize">{profile.experience}</span>
          </div>

          {profile.location && (
            <p className="text-gray-600 text-sm mb-2">📍 {profile.location}</p>
          )}

          <p className="text-gray-700 text-sm mb-3 line-clamp-2">{profile.bio}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {profile.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
            {profile.skills.length > 3 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{profile.skills.length - 3} more
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600">
            <span className="font-medium">Looking for:</span> {profile.lookingFor}
          </p>
        </div>

        {/* Action Buttons */}
        {isTopCard && (
          <div className="flex justify-center gap-6 mt-4">
            <button
              onClick={() => handleActionClick("left")}
              className="w-14 h-14 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors text-2xl"
            >
              ✕
            </button>
            <button
              onClick={() => handleActionClick("right")}
              className="w-14 h-14 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-green-500 hover:bg-green-50 hover:border-green-200 transition-colors text-2xl"
            >
              ♥
            </button>
          </div>
        )}
      </div>
    </div>
  );
}