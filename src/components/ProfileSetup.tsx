import { useState, useRef, useEffect } from "react";
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

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  name: string;
  bio: string;
  location: string;
  skills: string[];
  interests: string[];
  lookingFor: string;
  experience: string;
  twitter: string;
  discord: string;
  linkedin: string;
  portfolio: string;
  photos: { file: File; preview: string }[];
}

export function ProfileSetup({ isEditing = false }: { isEditing?: boolean }) {
  const profile = useQuery(api.profiles.getCurrentUserProfile);
  const createProfile = useMutation(api.profiles.createProfile);
  const createIncompleteProfile = useMutation(api.profiles.createIncompleteProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const addPhoto = useMutation(api.profiles.addPhoto);
  const removePhoto = useMutation(api.profiles.removePhoto);
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    name: profile?.name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    skills: profile?.skills || [],
    interests: profile?.interests || [],
    lookingFor: profile?.lookingFor || "",
    experience: profile?.experience || "",
    twitter: profile?.twitter || "",
    discord: profile?.discord || "",
    linkedin: profile?.linkedin || "",
    portfolio: profile?.portfolio || "",
    photos: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when profile loads (for editing)
  useEffect(() => {
    if (profile && isEditing) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        skills: profile.skills || [],
        interests: profile.interests || [],
        lookingFor: profile.lookingFor || "",
        experience: profile.experience || "",
        twitter: profile.twitter || "",
        discord: profile.discord || "",
        linkedin: profile.linkedin || "",
        portfolio: profile.portfolio || "",
      }));
    }
  }, [profile, isEditing]);

  const steps = [
    { number: 1, title: "Basic Info", description: "Tell us about yourself" },
    { number: 2, title: "Skills & Interests", description: "What are you good at?" },
    { number: 3, title: "What you seek", description: "What are you looking for?" },
    { number: 4, title: "Social Links", description: "Connect your social profiles" },
    { number: 5, title: "Photos", description: "Add some photos" },
  ];

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name.trim() && formData.bio.trim());
      case 2:
        return true; // Optional step
      case 3:
        return !!(formData.lookingFor && formData.experience);
      case 4:
        return true; // Social links are optional
      case 5:
        return true; // Photos are optional
      default:
        return false;
    }
  };

  const canProceedToStep = (step: Step): boolean => {
    for (let i = 1; i < step; i++) {
      if (!validateStep(i as Step)) return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (currentStep === 5) {
      await handleFinalSubmit();
    } else {
      // Save progress and move to next step
      await saveProgress();
      setCurrentStep((prev) => Math.min(5, prev + 1) as Step);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const saveProgress = async () => {
    if (!profile) {
      try {
        await createIncompleteProfile({
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          skills: formData.skills,
          interests: formData.interests,
          lookingFor: formData.lookingFor,
          experience: formData.experience,
          twitter: formData.twitter,
          discord: formData.discord,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio,
        });
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    } else {
      try {
        await updateProfile({
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          skills: formData.skills,
          interests: formData.interests,
          lookingFor: formData.lookingFor,
          experience: formData.experience,
          twitter: formData.twitter,
          discord: formData.discord,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio,
        });
      } catch (error) {
        console.error("Failed to update progress:", error);
      }
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Upload photos first
      const uploadedPhotoIds: Id<"_storage">[] = [];

      for (const photo of formData.photos) {
        try {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": photo.file.type },
            body: photo.file,
          });

          if (result.ok) {
            const { storageId } = await result.json();
            uploadedPhotoIds.push(storageId);
          }
        } catch (error) {
          console.error("Failed to upload photo:", error);
        }
      }

      if (isEditing && profile) {
        await updateProfile({
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          skills: formData.skills,
          interests: formData.interests,
          lookingFor: formData.lookingFor,
          experience: formData.experience,
          twitter: formData.twitter,
          discord: formData.discord,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio,
          isComplete: true,
        });

        // Add photos
        for (const photoId of uploadedPhotoIds) {
          await addPhoto({ storageId: photoId });
        }

        toast.success("Profile updated successfully!");
      } else if (profile) {
        // Complete existing incomplete profile
        await updateProfile({
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          skills: formData.skills,
          interests: formData.interests,
          lookingFor: formData.lookingFor,
          experience: formData.experience,
          twitter: formData.twitter,
          discord: formData.discord,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio,
          isComplete: true,
        });

        // Add photos
        for (const photoId of uploadedPhotoIds) {
          await addPhoto({ storageId: photoId });
        }

        toast.success("Profile completed successfully!");
      } else {
        // Create new complete profile
        await createProfile({
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          skills: formData.skills,
          interests: formData.interests,
          lookingFor: formData.lookingFor,
          experience: formData.experience,
          twitter: formData.twitter,
          discord: formData.discord,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio,
        });

        // Add photos
        for (const photoId of uploadedPhotoIds) {
          await addPhoto({ storageId: photoId });
        }

        toast.success("Profile created successfully!");
      }
    } catch (error) {
      toast.error("Failed to save profile");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (formData.photos.length >= 6) {
      toast.error("Maximum 6 photos allowed");
      return;
    }

    const preview = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, { file, preview }]
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhotoRemove = (index: number) => {
    setFormData(prev => {
      const newPhotos = [...prev.photos];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return { ...prev, photos: newPhotos };
    });
  };

  const handleRemoveExistingPhoto = async (storageId: Id<"_storage">) => {
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

  const getStepProgress = () => {
    const completedSteps = steps.filter((_, index) => validateStep((index + 1) as Step)).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? "Edit Profile" : "Create Your Profile"}
          </h1>
          <p className="text-gray-600 mb-6">
            {steps[currentStep - 1].description}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mb-6">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => canProceedToStep(step.number as Step) && setCurrentStep(step.number as Step)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  step.number === currentStep
                    ? "bg-muted text-foreground"
                    : step.number < currentStep
                    ? "text-green-600"
                    : canProceedToStep(step.number as Step)
                    ? "text-gray-400 hover:text-gray-600"
                    : "text-gray-300"
                }`}
                disabled={!canProceedToStep(step.number as Step)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1 ${
                  step.number === currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.number < currentStep
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {step.number < currentStep ? "✓" : "●"}
                </div>
                <span className="text-xs font-medium">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <div className="space-y-6">
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
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
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
                          ? "bg-primary text-primary-foreground"
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        formData.interests.includes(interest)
                          ? "bg-gradient-to-r from-primary to-secondary text-white shadow ring-2 ring-primary/40"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
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
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter Profile
                </label>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="@yourusername or https://twitter.com/yourusername"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discord
                </label>
                <input
                  type="text"
                  value={formData.discord}
                  onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="yourusername#1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="text"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio Website
                </label>
                <input
                  type="text"
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <p className="text-sm text-gray-500 mt-4">
                These are optional but help others connect with you and see your work.
              </p>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Photos (Optional)
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Add up to 6 photos to help others get to know you better.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Existing photos (for editing) */}
                  {profile?.photos?.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url || ""}
                        alt="Profile"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto(photo.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* New photos */}
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.preview}
                        alt="Profile preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Add photo button */}
                  {((profile?.photos?.length || 0) + formData.photos.length) < 6 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors"
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
                  onChange={handlePhotoAdd}
                  className="hidden"
                />

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleNext()}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Skip photos for now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="text-sm text-gray-500 flex items-center">
            Step {currentStep} of {steps.length}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!validateStep(currentStep) || isSubmitting}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Saving..."
              : currentStep === 5
                ? "Complete Profile"
                : "Next"
            }
          </button>
        </div>
      </div>
    </div>
  );
}