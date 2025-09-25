import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface MatchesProps {
  onSelectMatch: (matchId: Id<"matches">) => void;
}

export function Matches({ onSelectMatch }: MatchesProps) {
  const matches = useQuery(api.matches.getMatches);

  if (!matches) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">💔</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No matches yet
        </h2>
        <p className="text-gray-600">
          Keep swiping to find your perfect co-founder!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Matches</h1>
      
      <div className="space-y-4">
        {matches.map((match) => match && (
          <div
            key={match.matchId}
            onClick={() => onSelectMatch(match.matchId)}
            className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer p-4"
          >
            <div className="flex items-center space-x-4">
              {/* Profile Photo */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {match.profile.photos.length > 0 ? (
                  <img
                    src={match.profile.photos[0].url || ""}
                    alt={match.profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
              </div>

              {/* Match Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {match.profile.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(match.matchedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {match.profile.lookingFor}
                </p>

                {match.latestMessage ? (
                  <p className="text-sm text-gray-500 truncate">
                    {match.latestMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-primary font-medium">
                    Say hello! 👋
                  </p>
                )}
              </div>

              {/* Arrow */}
              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        )).filter(Boolean)}
      </div>
    </div>
  );
}
