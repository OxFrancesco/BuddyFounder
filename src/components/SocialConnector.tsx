import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { clsx } from "clsx";

const PLATFORMS = [
  {
    id: "github",
    name: "GitHub",
    icon: "🐙",
    placeholder: "https://github.com/yourusername",
    description: "Show your coding projects and contributions",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    placeholder: "https://linkedin.com/in/yourusername",
    description: "Display your professional experience",
  },
  {
    id: "twitter",
    name: "Twitter/X",
    icon: "🐦",
    placeholder: "https://twitter.com/yourusername",
    description: "Share your thoughts and personality",
  },
  {
    id: "website",
    name: "Personal Website",
    icon: "🌐",
    placeholder: "https://yourwebsite.com",
    description: "Your portfolio or personal site",
  },
] as const;

type Platform = typeof PLATFORMS[number]["id"];

interface SocialConnection {
  _id: string;
  platform: Platform;
  username: string;
  profileUrl: string;
  isActive: boolean;
  scrapingEnabled: boolean;
  lastScrapedAt?: number;
  metadata?: any;
}

export function SocialConnector() {
  const [newConnections, setNewConnections] = useState<Record<Platform, string>>({
    github: "",
    linkedin: "",
    twitter: "",
    website: "",
  });
  const [isScraping, setIsScraping] = useState<Set<string>>(new Set());

  const connections = useQuery(api.ingestion.socialScraper.getSocialConnections) || [];
  const addSocialConnection = useMutation(api.ingestion.socialScraper.addSocialConnection);
  const scrapeSocialProfile = useMutation(api.ingestion.socialScraper.scrapeSocialProfile);
  const scrapeAllSocialProfiles = useMutation(api.ingestion.socialScraper.scrapeAllSocialProfiles);

  const handleAddConnection = async (platform: Platform) => {
    const url = newConnections[platform].trim();
    if (!url) return;

    try {
      // Extract username from URL
      const username = extractUsernameFromUrl(platform, url);
      if (!username) {
        toast.error("Invalid URL format");
        return;
      }

      await addSocialConnection({
        platform,
        username,
        profileUrl: url,
        scrapingEnabled: true,
      });

      setNewConnections(prev => ({ ...prev, [platform]: "" }));
      toast.success(`${PLATFORMS.find(p => p.id === platform)?.name} connection added!`);
    } catch (error) {
      console.error("Error adding connection:", error);
      toast.error("Failed to add connection");
    }
  };

  const handleScrapeProfile = async (connectionId: string, platform: string) => {
    setIsScraping(prev => new Set(prev).add(connectionId));

    try {
      await scrapeSocialProfile({ connectionId });
      toast.success(`${platform} profile scraped successfully!`);
    } catch (error) {
      console.error("Error scraping profile:", error);
      toast.error(`Failed to scrape ${platform} profile`);
    } finally {
      setIsScraping(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const handleScrapeAll = async () => {
    const activeConnections = connections.filter(c => c.isActive && c.scrapingEnabled);
    if (activeConnections.length === 0) {
      toast.error("No active connections to scrape");
      return;
    }

    setIsScraping(new Set(activeConnections.map(c => c._id)));

    try {
      const result = await scrapeAllSocialProfiles();

      if (result.successful > 0) {
        toast.success(
          `Successfully scraped ${result.successful}/${result.totalConnections} profiles`
        );
      }

      if (result.failed > 0) {
        toast.warning(`${result.failed} profiles failed to scrape`);
      }
    } catch (error) {
      console.error("Error scraping all profiles:", error);
      toast.error("Failed to scrape profiles");
    } finally {
      setIsScraping(new Set());
    }
  };

  const extractUsernameFromUrl = (platform: Platform, url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      switch (platform) {
        case "github":
          return pathname.split("/")[1] || null;
        case "linkedin":
          return pathname.split("/in/")[1]?.split("/")[0] || null;
        case "twitter":
          return pathname.split("/")[1] || null;
        case "website":
          return urlObj.hostname;
        default:
          return null;
      }
    } catch {
      return null;
    }
  };

  const getPlatformInfo = (platform: Platform) =>
    PLATFORMS.find(p => p.id === platform);

  const getConnectionByPlatform = (platform: Platform) =>
    connections.find(c => c.platform === platform);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connect Your Social Profiles
        </h3>
        <p className="text-gray-600 text-sm">
          Import your data to create a richer AI chat experience
        </p>
      </div>

      {/* Platform Connections */}
      <div className="space-y-4">
        {PLATFORMS.map((platform) => {
          const connection = getConnectionByPlatform(platform.id);
          const isConnected = !!connection;
          const isScrapingThis = connection && isScraping.has(connection._id);

          return (
            <div
              key={platform.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{platform.icon}</div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{platform.name}</h4>
                      <p className="text-xs text-gray-500">{platform.description}</p>
                    </div>

                    {isConnected && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Connected
                        </span>
                        {connection.lastScrapedAt && (
                          <span className="text-xs text-gray-500">
                            Scraped {new Date(connection.lastScrapedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isConnected ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 truncate">
                          {connection.profileUrl}
                        </p>
                        {connection.metadata && (
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            {connection.metadata.followers && (
                              <span>{connection.metadata.followers} followers</span>
                            )}
                            {connection.metadata.repositories && (
                              <span>{connection.metadata.repositories.length} repos</span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleScrapeProfile(connection._id, platform.name)}
                        disabled={isScrapingThis}
                        className={clsx(
                          "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isScrapingThis
                            ? "bg-orange-100 text-orange-700 cursor-not-allowed"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        )}
                      >
                        {isScrapingThis ? "Scraping..." : "Re-scrape"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <input
                        type="url"
                        value={newConnections[platform.id]}
                        onChange={(e) =>
                          setNewConnections(prev => ({
                            ...prev,
                            [platform.id]: e.target.value,
                          }))
                        }
                        placeholder={platform.placeholder}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <button
                        onClick={() => handleAddConnection(platform.id)}
                        disabled={!newConnections[platform.id].trim()}
                        className={clsx(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                          newConnections[platform.id].trim()
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        Connect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Actions */}
      {connections.some(c => c.isActive && c.scrapingEnabled) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Bulk Actions</h4>
              <p className="text-sm text-gray-600">
                Scrape all connected profiles to update your AI chat context
              </p>
            </div>

            <button
              onClick={handleScrapeAll}
              disabled={isScraping.size > 0}
              className={clsx(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                isScraping.size > 0
                  ? "bg-orange-100 text-orange-700 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              )}
            >
              {isScraping.size > 0 ? "Scraping..." : "Scrape All Profiles"}
            </button>
          </div>

          {isScraping.size > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                <span>Scraping {isScraping.size} profile{isScraping.size !== 1 ? "s" : ""}...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Make sure your profiles are public for better scraping results</li>
          <li>• Re-scrape periodically to keep your AI context up-to-date</li>
          <li>• Connected profiles help create more personalized AI responses</li>
        </ul>
      </div>
    </div>
  );
}