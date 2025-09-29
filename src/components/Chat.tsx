import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  const matches = useQuery(api.matches.getMatches);
  const profile = useQuery(api.profiles.getCurrentUserProfile);
  const sendMessage = useMutation(api.matches.sendMessage);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Add keyboard shortcut to exit chat + log scroll container sizing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        console.log("ESC pressed - exiting chat");
        onBack();
      }
    };

    const el = scrollContainerRef.current;
    if (el) {
      const { clientHeight, scrollHeight } = el;
      console.log("[Chat] Scroll container mounted", { clientHeight, scrollHeight });
    } else {
      console.warn("[Chat] Scroll container ref is null");
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [newMessage]);

  const currentUserId = profile?.userId ?? null;

  const activeMatch = useMemo(() => {
    if (!matches) return null;
    return matches.find((match) => match?.matchId === matchId) ?? null;
  }, [matches, matchId]);

  const matchName = activeMatch?.profile?.name ?? "Your match";
  const matchPhoto = activeMatch?.profile?.photos?.[0]?.url ?? null;
  const matchedAt = activeMatch?.matchedAt ?? null;

  const initials = useMemo(() => {
    const source = matchName.trim();
    if (!source) return "👤";
    const parts = source.split(/\s+/).slice(0, 2);
    const chars = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
    return chars || "👤";
  }, [matchName]);

  const processSend = useCallback(async () => {
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
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    }
  }, [newMessage, isSending, sendMessage, matchId]);

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

  if (messages === undefined || profile === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const resolvedMessages = messages ?? [];
  const isEmptyState = resolvedMessages.length === 0;

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden min-h-0 box-border bg-gradient-to-br from-[#f0e4d3] via-[#f7efe3] to-[#fdf8f1] px-3 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-10 -right-32 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden min-h-0 box-border rounded-3xl bg-white/80 shadow-2xl backdrop-blur-sm ring-1 ring-black/5">
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-white/70 bg-white/95 backdrop-blur-md px-4 py-4 sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              onClick={() => {
                console.log("Back button clicked - exiting chat");
                onBack();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Go back to matches"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-primary to-secondary text-sm font-semibold text-white shadow">
                {matchPhoto ? (
                  <img src={matchPhoto} alt={matchName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">
                  {matchName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Matched conversation
                  </span>
                  {matchedAt && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Since {new Date(matchedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Keep the momentum going ✨
          </div>
        </div>

        <div className="relative flex flex-1 flex-col min-h-0 bg-gradient-to-b from-white/70 via-white/40 to-white/10">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-8 sm:py-8">
            <div className="mx-auto flex max-w-3xl flex-col space-y-6">
              {isEmptyState ? (
                <div className="mx-auto flex w-full max-w-sm flex-col items-center rounded-3xl border border-dashed border-primary/30 bg-white/80 px-6 py-12 text-center shadow-sm">
                  <span className="mb-4 text-4xl">💬</span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Break the ice with {matchName}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Share what excites you right now or ask about their latest project to get the conversation rolling.
                  </p>
                </div>
              ) : (
                resolvedMessages.map((message) => {
                  const isOwnMessage = message.senderId === currentUserId;
                  const timestamp = new Date(message.sentAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={message._id}
                      className={`flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      {!isOwnMessage && (
                        <div className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-secondary text-[0.65rem] font-semibold text-white shadow-md">
                          {matchPhoto ? (
                            <img src={matchPhoto} alt={matchName} className="h-full w-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                      )}

                      <div className={`flex max-w-[min(85%,26rem)] flex-col gap-2 ${isOwnMessage ? "items-end" : "items-start"}`}>
                        <div
                          className={`whitespace-pre-wrap break-words rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ring-1 ring-black/5 ${
                            isOwnMessage
                              ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                              : "bg-white/90 text-gray-900 backdrop-blur"
                          }`}
                        >
                          {message.content}
                        </div>
                        <span className={`text-xs ${isOwnMessage ? "text-primary/70" : "text-muted-foreground"}`}>
                          {timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {isSending && (
                <div className="flex gap-3 justify-end">
                  <div className="rounded-3xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-sm font-medium text-white shadow-lg ring-1 ring-black/5">
                    Sending...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-white/60 bg-white/90 px-3 py-5 sm:px-8">
            <form onSubmit={handleSendMessage} className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-end">
              <label htmlFor="match-chat-message" className="sr-only">
                Message
              </label>
              <div className="relative flex-1">
                <textarea
                  id="match-chat-message"
                  ref={inputRef}
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={`Message ${matchName}...`}
                  rows={1}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl bg-white/90 px-4 py-3 text-sm leading-6 text-gray-900 shadow-sm outline-none ring-1 ring-black/5 transition focus:ring-2 focus:ring-primary sm:text-base"
                  disabled={isSending}
                  aria-label={`Message ${matchName}`}
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
