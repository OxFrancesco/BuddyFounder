import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface LikedProfilesProps {
  onStartAiChat: (target: { userId: Id<"users">; name: string }) => void;
}

export function LikedProfiles({ onStartAiChat }: LikedProfilesProps) {
  const likedProfiles = useQuery(api.discovery.getLikedProfiles);

  if (!likedProfiles) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (likedProfiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">💙</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No likes yet
        </h2>
        <p className="text-gray-600">
          Start exploring profiles and like founders you're interested in!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-card">
        <h1 className="text-xl font-bold text-foreground">Liked Profiles</h1>
        <p className="text-sm text-muted-foreground">
          Profiles you've liked - chat with their AI anytime!
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {likedProfiles.map((profile) => (
          <div
            key={profile.userId}
            className="bg-card rounded-lg shadow-sm border border-border p-4"
          >
            <div className="flex items-start space-x-4">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                {profile.photos.length > 0 ? (
                  <img
                    src={profile.photos[0].url || ""}
                    alt={profile.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {profile.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {profile.isMatch ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        ✓ Matched
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        ❤️ Liked
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                    {profile.experience}
                  </span>
                  <span className="text-xs px-2 py-1 bg-muted text-foreground rounded-full">
                    {profile.lookingFor}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {profile.bio}
                </p>

                {/* Skills */}
                {profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {profile.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded">
                        +{profile.skills.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => onStartAiChat({ userId: profile.userId, name: profile.name })}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  💬 Chat with AI
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}