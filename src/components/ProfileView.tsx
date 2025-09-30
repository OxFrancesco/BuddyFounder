import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { ShareProfileModal } from "./ShareProfileModal";

interface ProfileViewProps {
  onEdit: () => void;
}

export function ProfileView({ onEdit }: ProfileViewProps) {
  const profile = useQuery(api.profiles.getCurrentUserProfile);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (profile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile || profile.isComplete !== true) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Complete Your Profile
          </h2>
          <p className="text-gray-600 mb-6">
            Finish setting up your profile to start discovering co-founders
          </p>
          <button
            onClick={onEdit}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
      <div className="max-w-4xl mx-auto p-6">
      {/* Header with Edit and Share Buttons */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <span>📤</span>
            Share Profile
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Photos and Basic Info */}
        <div className="lg:col-span-1">
          {/* Photo Gallery */}
          {profile.photos && profile.photos.length > 0 ? (
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Show first photo large if only one, otherwise grid */}
              {profile.photos.length === 1 ? (
                <img
                  src={profile.photos[0].url || ""}
                  alt="Profile"
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="grid grid-cols-2 gap-0">
                  {profile.photos.map((photo, index) => (
                    <img
                      key={photo.id}
                      src={photo.url || ""}
                      alt={`Profile ${index + 1}`}
                      className="w-full aspect-square object-cover border-r border-b border-gray-200 last:border-r-0"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <span className="text-4xl mb-2 block">📷</span>
              <p className="text-gray-500">No photos added yet</p>
            </div>
          )}

          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Info</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Experience Level</span>
                <p className="font-medium">{profile.experience}</p>
              </div>
              {profile.location && (
                <div>
                  <span className="text-sm text-gray-500">Location</span>
                  <p className="font-medium">{profile.location}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500">Looking For</span>
                <p className="font-medium">{profile.lookingFor}</p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect</h3>
            <div className="space-y-3">
              {profile.twitter && (
                <a
                  href={profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <span>🐦</span>
                  <span>Twitter</span>
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors"
                >
                  <span>💼</span>
                  <span>LinkedIn</span>
                </a>
              )}
              {profile.discord && (
                <div className="flex items-center space-x-2 text-indigo-500">
                  <span>🎮</span>
                  <span>{profile.discord}</span>
                </div>
              )}
              {profile.portfolio && (
                <a
                  href={profile.portfolio.startsWith('http') ? profile.portfolio : `https://${profile.portfolio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-green-500 hover:text-green-600 transition-colors"
                >
                  <span>🌐</span>
                  <span>Portfolio</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Bio, Skills, and Interests */}
        <div className="lg:col-span-2">
          {/* Name and Bio */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{profile.name}</h2>
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills added yet</p>
            )}
          </div>

          {/* Interests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Interests</h3>
            {profile.interests && profile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No project interests added yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Share Profile Modal */}
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profile={{ name: profile.name, username: profile.username }}
      />
    </div>
    </div>
  );
}