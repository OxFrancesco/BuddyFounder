import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    name: string;
    username?: string;
  };
}

export function ShareProfileModal({ isOpen, onClose, profile }: ShareProfileModalProps) {
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profile.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const updateUsername = useMutation(api.profiles.updateUsername);
  const generateUsername = useMutation(api.profiles.generateUniqueUsername);
  const checkAvailability = useQuery(
    api.profiles.checkUsernameAvailability,
    newUsername && newUsername !== profile.username ? { username: newUsername } : "skip"
  );

  const urlInputRef = useRef<HTMLInputElement>(null);

  const profileUrl = profile.username
    ? `${window.location.origin}/u/${profile.username}`
    : '';

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleGenerateUsername = async () => {
    try {
      console.log('Generating username for:', profile.name);
      setIsGenerating(true);
      const result = await generateUsername({ name: profile.name });
      console.log('Generated username result:', result);
      setNewUsername(result.username);
      setUsernameError('');
      setIsEditingUsername(true); // Switch to editing mode after generating
    } catch (error) {
      console.error('Username generation error:', error);
      setUsernameError('Failed to generate username');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameError('Username is required');
      return;
    }

    // Validate username format client-side
    const username = newUsername.trim().toLowerCase();
    if (username.length < 3 || username.length > 30) {
      setUsernameError('Username must be between 3 and 30 characters');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and hyphens');
      return;
    }
    if (username.startsWith('-') || username.endsWith('-')) {
      setUsernameError('Username cannot start or end with a hyphen');
      return;
    }

    if (checkAvailability && !checkAvailability.available) {
      setUsernameError('Username is already taken');
      return;
    }

    try {
      await updateUsername({ username });
      setIsEditingUsername(false);
      setUsernameError('');
    } catch (error: any) {
      setUsernameError(error.message || 'Failed to update username');
    }
  };

  const copyToClipboard = async () => {
    if (!profileUrl) return;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setIsCopied(true);
    } catch (error) {
      // Fallback for older browsers
      urlInputRef.current?.select();
      document.execCommand('copy');
      setIsCopied(true);
    }
  };

  const shareOnTwitter = () => {
    const text = `Check out ${profile.name}'s profile on BuddyFounder!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Share Your Profile</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Username Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Profile Username</label>

          {!profile.username ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Set up a username to create your shareable profile link</p>
              <button
                onClick={handleGenerateUsername}
                disabled={isGenerating}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Username'}
              </button>
              {usernameError && (
                <p className="text-red-500 text-sm mt-2">{usernameError}</p>
              )}
            </div>
          ) : isEditingUsername ? (
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => {
                    setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setUsernameError('');
                  }}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {usernameError && (
                  <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                )}
                {checkAvailability && (
                  <p className={`text-sm mt-1 ${checkAvailability.available ? 'text-green-500' : 'text-red-500'}`}>
                    {checkAvailability.available ? '✓ Username available' : '✗ Username taken'}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateUsername}
                  disabled={!newUsername || (checkAvailability && !checkAvailability.available)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingUsername(false);
                    setNewUsername(profile.username || '');
                    setUsernameError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-mono text-primary">@{profile.username}</span>
              <button
                onClick={() => setIsEditingUsername(true)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Share URL Section */}
        {profileUrl && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Link</label>
            <div className="flex gap-2">
              <input
                ref={urlInputRef}
                type="text"
                value={profileUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Social Share Buttons */}
        {profileUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Share on Social Media</label>
            <div className="flex gap-3">
              <button
                onClick={shareOnTwitter}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <span>🐦</span>
                Twitter
              </button>
              <button
                onClick={shareOnLinkedIn}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <span>💼</span>
                LinkedIn
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}