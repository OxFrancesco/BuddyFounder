import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";

export function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const profile = useQuery(api.profiles.getProfileByUsername,
    username ? { username } : "skip"
  );

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0e4d3] via-[#f7efe3] to-[#fdf8f1]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Profile URL</h1>
          <p className="text-gray-600">The profile link you're looking for is invalid.</p>
        </div>
      </div>
    );
  }

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0e4d3] via-[#f7efe3] to-[#fdf8f1]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0e4d3] via-[#f7efe3] to-[#fdf8f1]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">The profile you're looking for doesn't exist or has been removed.</p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to BuddyFounder
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0e4d3] via-[#f7efe3] to-[#fdf8f1]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/70 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              BuddyFounder
            </a>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Join BuddyFounder
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto p-6 py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Photos and Basic Info */}
              <div className="lg:col-span-1">
                {/* Photo Gallery */}
                {profile.photos && profile.photos.length > 0 ? (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-2">
                      {profile.photos.map((photo, index) => (
                        <img
                          key={photo.id}
                          src={photo.url || ""}
                          alt={`${profile.name} ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <span className="text-4xl mb-2 block">👤</span>
                    <p className="text-gray-500">No photos added</p>
                  </div>
                )}

                {/* Basic Info Card */}
                <div className="bg-white/90 rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Info</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Experience Level</span>
                      <p className="font-medium capitalize">{profile.experience}</p>
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
                {(profile.twitter || profile.linkedin || profile.portfolio) && (
                  <div className="bg-white/90 rounded-lg shadow-sm border border-gray-200 p-6">
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
                )}
              </div>

              {/* Right Column - Bio, Skills, and Interests */}
              <div className="lg:col-span-2">
                {/* Name and Bio */}
                <div className="bg-white/90 rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{profile.name}</h1>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>

                {/* Skills */}
                <div className="bg-white/90 rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
                <div className="bg-white/90 rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Interests</h3>
                  {profile.interests && profile.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-3 py-1 bg-secondary/20 text-secondary-foreground rounded-full text-sm font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No project interests added yet</p>
                  )}
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Interested in collaborating?</h3>
                  <p className="text-gray-600 mb-4">Join BuddyFounder to connect with {profile.name} and other co-founders</p>
                  <a
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Join BuddyFounder
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}