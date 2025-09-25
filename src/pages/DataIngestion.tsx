import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FileUploader } from "../components/FileUploader";
import { SocialConnector } from "../components/SocialConnector";
import { clsx } from "clsx";

type TabType = "overview" | "documents" | "social";

export function DataIngestion() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const userDocuments = useQuery(api.documents.getUserDocuments) || [];
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount);

  const documentsByType = userDocuments.reduce((acc, doc) => {
    acc[doc.sourceType] = (acc[doc.sourceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalDocuments = userDocuments.length;
  const processedDocuments = userDocuments.filter(doc => doc.isProcessed).length;

  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: "📊",
    },
    {
      id: "documents" as const,
      label: "Documents",
      icon: "📄",
    },
    {
      id: "social" as const,
      label: "Social Media",
      icon: "🔗",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">BuddyFounder</h1>
              <span className="ml-3 text-sm text-gray-600">Data Management</span>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 mb-8 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Documents</p>
                      <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
                    </div>
                    <div className="text-3xl">📚</div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    {processedDocuments} processed for AI chat
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">PDF Documents</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {documentsByType.pdf || 0}
                      </p>
                    </div>
                    <div className="text-3xl">📄</div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    Resumes, portfolios, reports
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Social Profiles</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {documentsByType.social || 0}
                      </p>
                    </div>
                    <div className="text-3xl">🔗</div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    GitHub, LinkedIn, Twitter
                  </div>
                </div>
              </div>

              {/* Getting Started */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🚀 Getting Started
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">1. Upload Documents</h4>
                    <p className="text-sm text-gray-600">
                      Upload your resume, portfolio, or any PDF documents that describe your
                      background, projects, and experience.
                    </p>
                    <button
                      onClick={() => setActiveTab("documents")}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Upload PDFs →
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">2. Connect Social Profiles</h4>
                    <p className="text-sm text-gray-600">
                      Connect your GitHub, LinkedIn, and other profiles to import your
                      professional information automatically.
                    </p>
                    <button
                      onClick={() => setActiveTab("social")}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Connect Profiles →
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {userDocuments.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📋 Recent Documents
                  </h3>
                  <div className="space-y-3">
                    {userDocuments
                      .sort((a, b) => b.uploadedAt - a.uploadedAt)
                      .slice(0, 5)
                      .map((doc) => (
                        <div
                          key={doc._id}
                          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-lg">
                              {doc.sourceType === "pdf" ? "📄" :
                               doc.sourceType === "social" ? "🔗" : "📝"}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {doc.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {doc.sourceType === "social" && doc.metadata?.platform
                                  ? `${doc.metadata.platform} • `
                                  : ""}
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.isProcessed ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Processed
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                Processing...
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Upload</h2>
                <p className="text-gray-600">
                  Upload PDF documents to enhance your AI chat responses
                </p>
              </div>

              <FileUploader onUploadComplete={() => {
                // Refresh documents list or show success
              }} />

              {/* Document List */}
              {userDocuments.filter(doc => doc.sourceType === "pdf").length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📄 Your Documents
                  </h3>
                  <div className="space-y-3">
                    {userDocuments
                      .filter(doc => doc.sourceType === "pdf")
                      .sort((a, b) => b.uploadedAt - a.uploadedAt)
                      .map((doc) => (
                        <div
                          key={doc._id}
                          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-lg">📄</div>
                            <div>
                              <p className="font-medium text-gray-900">{doc.title}</p>
                              <p className="text-sm text-gray-500">
                                Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                {doc.processedAt &&
                                  ` • Processed ${new Date(doc.processedAt).toLocaleDateString()}`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.isPublic && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Available for AI
                              </span>
                            )}
                            {doc.isProcessed ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                ✓ Processed
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                Processing...
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Media Integration</h2>
                <p className="text-gray-600">
                  Connect your social profiles to import professional information
                </p>
              </div>

              <SocialConnector />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}