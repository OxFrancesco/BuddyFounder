import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ChatProps {
  matchId: Id<"matches">;
  onBack: () => void;
}

export function Chat({ matchId, onBack }: ChatProps) {
  const messages = useQuery(api.matches.getMessages, { matchId });
  const sendMessage = useMutation(api.matches.sendMessage);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      await sendMessage({
        matchId,
        content: messageContent,
      });
    } catch (error) {
      toast.error("Failed to send message");
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  if (!messages) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center space-x-3">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-2">💬</div>
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${
                message.senderId === messages[0]?.senderId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.senderId === messages[0]?.senderId
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === messages[0]?.senderId
                    ? "text-pink-100"
                    : "text-gray-500"
                }`}>
                  {new Date(message.sentAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
