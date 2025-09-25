import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

const SKILLS_OPTIONS = [
  "Frontend Development", "Backend Development", "Mobile Development", "UI/UX Design",
  "Product Management", "Marketing", "Sales", "Business Development", "Data Science",
  "Machine Learning", "DevOps", "Blockchain", "Game Development", "Content Creation"
];

const INTERESTS_OPTIONS = [
  "SaaS", "E-commerce", "FinTech", "HealthTech", "EdTech", "Gaming", "Social Media",
  "AI/ML", "Blockchain", "IoT", "Climate Tech", "Food Tech", "Travel", "Fitness"
];

const LOOKING_FOR_OPTIONS = [
  "Technical Co-founder", "Business Co-founder", "Designer Co-founder", 
  "Marketing Co-founder", "Any Co-founder"
];

const EXPERIENCE_OPTIONS = [
  "First-time founder", "Some startup experience", "Serial entrepreneur"
];

export function ProfileSetup({ isEditing = false }: { isEditing?: boolean }) {
  const profile = useQuery(api.profiles.getCurrentUserProfile);
  const createProfile = useMutation(api.profiles.createProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const addPhoto = useMutation(api.profiles.addPhoto);
  const removePhoto = useMutation(api.profiles.removePhoto);
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    bio: profile?.bio || "",
    skills: profile?.skills || [],
    interests: profile?.interests || [],
    lookingFor: profile?.lookingFor || "",
    location: profile?.location || "",
    experience: profile?.experience || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.bio || !formData.lookingFor || !formData.experience) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateProfile(formData);
        toast.success("Profile updated successfully!");
      } else {
        await createProfile(formData);
        toast.success("Profile created successfully!");
      }
    } catch (error) {
      toast.error("Failed to save profile");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      await addPhoto({ storageId });
      toast.success("Photo added successfully!");
    } catch (error) {
      toast.error("Failed to upload photo");
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async (storageId: Id<"_storage">) => {
    try {
      await removePhoto({ storageId });
      toast.success("Photo removed");
    } catch (error) {
      toast.error("Failed to remove photo");
      console.error(error);
    }
  };

  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEditing ? "Edit Profile" : "Create Your Profile"}
        </h1>
        <p className="text-gray-600 mb-8">
          Tell potential co-founders about yourself and what you're looking for
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photos Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Photos
            </label>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {profile?.photos?.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url || ""}
                    alt="Profile"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              {(!profile?.photos || profile.photos.length < 6) && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-pink-400 hover:text-pink-500 transition-colors"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                  ) : (
                    <>
                      <span className="text-2xl mb-1">+</span>
                      <span className="text-xs">Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio *
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Tell us about yourself, your background, and what you're passionate about..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="City, Country"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Skills
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SKILLS_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleArrayItem(
                    formData.skills, 
                    skill, 
                    (skills) => setFormData({ ...formData, skills })
                  )}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    formData.skills.includes(skill)
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Project Interests
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INTERESTS_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleArrayItem(
                    formData.interests, 
                    interest, 
                    (interests) => setFormData({ ...formData, interests })
                  )}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    formData.interests.includes(interest)
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Looking For */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Looking For *
            </label>
            <select
              value={formData.lookingFor}
              onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">Select what you're looking for</option>
              {LOOKING_FOR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level *
            </label>
            <select
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">Select your experience level</option>
              {EXPERIENCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Update Profile" : "Create Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
