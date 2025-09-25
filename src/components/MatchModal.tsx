import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { clsx } from "clsx";
import { Id } from "../../convex/_generated/dataModel";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedProfile: {
    name: string;
    bio: string;
    photos: Array<{ id: Id<"_storage">; url: string | null }>;
    userId: Id<"users">;
  };
  matchId: Id<"matches">;
}

export function MatchModal({ isOpen, onClose, matchedProfile, matchId }: MatchModalProps) {
  const [message, setMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const sendMessage = useMutation(api.matches.sendMessage);
  const sendAiMessage = useMutation(api.aiChat.sendAiMessage);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsSendingMessage(true);
    try {
      await sendMessage({
        matchId,
        content: message.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleTryAI = async () => {
    try {
      await sendAiMessage({
        profileOwnerId: matchedProfile.userId,
        message: "Hi! I'd love to know more about your background and experience.",
      });
      onClose();
    } catch (error) {
      console.error("Error starting AI chat:", error);
    }
  };

  const firstPhoto = matchedProfile.photos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with celebration */}
        <div className="relative bg-gradient-to-br from-primary to-secondary p-8 text-center">
          <div className="text-6xl mb-2">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-1">It's a Match!</h1>
          <p className="text-white/90 text-sm">
            You and {matchedProfile.name} liked each other!
          </p>
        </div>

        {/* Profile preview */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            {firstPhoto?.url ? (
              <img
                src={firstPhoto.url}
                alt={matchedProfile.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
                {matchedProfile.name[0]}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {matchedProfile.name}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2">
                {matchedProfile.bio}
              </p>
            </div>
          </div>

          {/* Message input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send a message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Say hello to ${matchedProfile.name}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {message.length}/500
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSendingMessage}
              className={clsx(
                "w-full px-4 py-3 rounded-lg font-medium transition-colors",
                message.trim() && !isSendingMessage
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {isSendingMessage ? "Sending..." : "Send Message"}
            </button>

            <button
              onClick={handleTryAI}
              className="w-full px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span className="text-lg">🤖</span>
              Try {matchedProfile.name}'s AI Assistant
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-lg font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Keep Swiping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}