import { useNavigate } from "react-router-dom";

export function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm h-16 flex justify-between items-center border-b border-border shadow-sm px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="BuddyFounder Logo" className="h-10 w-10" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            BuddyFounder
          </h2>
        </div>
        <button
          onClick={handleGetStarted}
          className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Find Your Perfect{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Co-Founder
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Swipe, match, and connect with talented founders who share your vision.
          Build the next big thing together.
        </p>
        <button
          onClick={handleGetStarted}
          className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-2xl hover:shadow-lg transition-all duration-300 text-lg"
        >
          Get Started Free
        </button>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👤</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Create Your Profile
              </h3>
              <p className="text-gray-600">
                Share your skills, interests, and what you're looking for in a co-founder.
                Add photos and connect your social profiles.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💫</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Discover & Match
              </h3>
              <p className="text-gray-600">
                Swipe through potential co-founders. Right for yes, left for no.
                When you both swipe right, it's a match!
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Connect & Build
              </h3>
              <p className="text-gray-600">
                Chat with your matches, have voice conversations, and start building
                your dream project together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
          Why BuddyFounder?
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                AI-Powered Matching
              </h3>
              <p className="text-gray-600">
                Our smart algorithm suggests the best co-founders based on your skills,
                interests, and project goals.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎤</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Voice Chat
              </h3>
              <p className="text-gray-600">
                Have real conversations with AI-powered voice chat to learn more about
                potential co-founders before you match.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Smart Profiles
              </h3>
              <p className="text-gray-600">
                Share your portfolio, projects, and documents. Our AI helps others
                understand your expertise better.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Real-time Messaging
              </h3>
              <p className="text-gray-600">
                Instant messaging with your matches. Share ideas, discuss projects,
                and plan your next venture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Find Your Co-Founder?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join BuddyFounder today and start building your dream team.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-white text-primary font-semibold rounded-2xl hover:shadow-xl transition-all duration-300 text-lg"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-white border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p>&copy; 2025 BuddyFounder. Find your perfect co-founder.</p>
        </div>
      </footer>
    </div>
  );
}