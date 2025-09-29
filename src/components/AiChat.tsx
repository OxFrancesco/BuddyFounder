import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useVoiceChat } from "../hooks/useVoiceChat";

interface AiChatProps {
  profileOwnerId: Id<"users">;
  profileOwnerName: string;
  onBack: () => void;
}

export function AiChat({ profileOwnerId, profileOwnerName, onBack }: AiChatProps) {
  const chat = useQuery(api.aiChat.getAiChat, { profileOwnerId });
  const accessInfo = useQuery(api.aiChat.canAccessAiChat, { profileOwnerId });
  const sendMessage = useMutation(api.aiChat.sendAiMessage);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Voice chat integration
  const voiceChat = useVoiceChat({
    profileOwnerId,
    profileOwnerName,
    onTranscript: (transcript, role) => {
      console.log(`Voice transcript - ${role}: ${transcript}`);
    },
    onMessage: (message) => {
      console.log(`Voice message: ${message}`);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages, isSending]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [newMessage]);

  const processSend = useCallback(async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      await sendMessage({
        profileOwnerId,
        message: messageContent,
      });
    } catch (error) {
      toast.error("Failed to send message");
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    }
  }, [newMessage, isSending, sendMessage, profileOwnerId]);

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void processSend();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void processSend();
    }
  };

  const textMessages = chat?.messages || [];
  const voiceTranscripts = voiceChat.transcript || [];

  // Combine text messages and voice transcripts, sorted by timestamp
  const allMessages = [
    ...textMessages.map(msg => ({ ...msg, source: 'text' as const })),
    ...voiceTranscripts.map(transcript => ({
      role: transcript.role,
      content: transcript.text,
      timestamp: transcript.timestamp,
      source: 'voice' as const
    }))
  ].sort((a, b) => a.timestamp - b.timestamp);

  const isEmptyState = allMessages.length === 0;

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-gradient-to-br from-[#f0e4d3] via-[#f7efe3] to-[#fdf8f1] px-3 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-10 -right-32 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white/80 shadow-2xl backdrop-blur-sm ring-1 ring-black/5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/70 bg-white/90 px-4 py-4 sm:px-8">
          <div className="flex flex-1 items-center gap-4 min-w-0">
            <button
              onClick={onBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary text-sm font-semibold text-white shadow">
                  AI
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">
                    Chat with {profileOwnerName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      AI-powered conversation
                    </span>
                    {accessInfo && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                          accessInfo.isMatched
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {accessInfo.isMatched ? "Matched" : "Preview"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Voice Mode Toggle */}
            <button
              onClick={() => {
                if (isVoiceMode && voiceChat.isConnected) {
                  voiceChat.stopVoiceChat();
                  setIsVoiceMode(false);
                } else if (!isVoiceMode) {
                  setIsVoiceMode(true);
                  voiceChat.startVoiceChat();
                }
              }}
              disabled={!voiceChat.isInitialized}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
                isVoiceMode && voiceChat.isConnected
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isVoiceMode ? "End voice chat" : "Start voice chat"}
            >
              {isVoiceMode && voiceChat.isConnected ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  {voiceChat.isSpeaking ? "AI Speaking" : voiceChat.isListening ? "Listening" : "Connected"}
                </>
              ) : (
                <>
                  🎤 Voice Chat
                </>
              )}
            </button>

            <div className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Smart responses in seconds
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="relative flex flex-1 flex-col bg-gradient-to-b from-white/70 via-white/40 to-white/10">
          <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-8 sm:py-8">
            <div className="mx-auto flex max-w-3xl flex-col space-y-6">
              {isEmptyState ? (
                <div className="mx-auto flex w-full max-w-sm flex-col items-center rounded-3xl border border-dashed border-primary/30 bg-white/80 px-6 py-12 text-center shadow-sm">
                  <span className="mb-4 text-4xl">🤖</span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Meet {profileOwnerName}'s co-pilot
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Ask about their projects, experience, goals, or anything you would explore during a real conversation.
                  </p>
                  <p className="mt-2 text-xs text-blue-600">
                    💡 Try voice chat for a more natural conversation experience
                  </p>
                  {accessInfo && !accessInfo.isMatched && (
                    <p className="mt-4 rounded-full bg-rose-50 px-4 py-2 text-xs font-medium text-rose-600">
                      💡 You liked {profileOwnerName}. Match to unlock direct messages.
                    </p>
                  )}
                </div>
              ) : (
                allMessages.map((message, index) => {
                  const isUser = message.role === "user";
                  const isVoiceMessage = message.source === "voice";
                  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={`${message.source}-${index}`}
                      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-[0.65rem] font-semibold text-white shadow-md">
                          AI
                        </div>
                      )}

                      <div className={`flex max-w-[min(85%,26rem)] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
                        <div
                          className={`whitespace-pre-wrap break-words rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ring-1 ring-black/5 ${
                            isUser
                              ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                              : "bg-white/90 text-gray-900 backdrop-blur"
                          } ${isVoiceMessage ? "border-l-4 border-blue-400" : ""}`}
                        >
                          {message.content}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${isUser ? "text-primary/70" : "text-muted-foreground"}`}>
                            {timestamp}
                          </span>
                          {isVoiceMessage && (
                            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                              🎤 Voice
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-[0.65rem] font-semibold text-white shadow-md">
                    AI
                  </div>
                  <div className="rounded-3xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-black/5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.1s" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}

              {voiceChat.error && (
                <div className="mx-auto max-w-sm">
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
                    <p className="text-sm text-red-700 font-medium">Voice Chat Error</p>
                    <p className="text-xs text-red-600 mt-1">{voiceChat.error}</p>
                    <button
                      onClick={() => {
                        setIsVoiceMode(false);
                        voiceChat.stopVoiceChat();
                      }}
                      className="mt-2 text-xs text-red-600 underline hover:text-red-800"
                    >
                      Switch to text chat
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-white/60 bg-white/90 px-3 py-5 sm:px-8">
            <form onSubmit={handleSendMessage} className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-end">
              <label htmlFor="ai-chat-message" className="sr-only">
                Message
              </label>
              <div className="relative flex-1">
                <textarea
                  id="ai-chat-message"
                  ref={inputRef}
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={`Ask ${profileOwnerName} anything...`}
                  rows={1}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl bg-white/90 px-4 py-3 text-sm leading-6 text-gray-900 shadow-sm outline-none ring-1 ring-black/5 transition focus:ring-2 focus:ring-primary sm:text-base"
                  disabled={isSending}
                  aria-label={`Message ${profileOwnerName}'s AI`}
                />
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    Sending
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    Send
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
