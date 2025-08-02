import React, { useState, useRef } from "react";
import { User } from "../types";
import { supabaseDb } from "../lib/supabaseDatabase";
import { supabaseAuth } from "../lib/supabaseAuth";
import PasswordChangeModal from "./PasswordChangeModal";
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Phone,
  Briefcase,
  UserCheck,
  Edit,
  Save,
  X,
  Camera,
  Upload,
  Lock,
} from "lucide-react";

interface ProfilePageProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

const getInitials = (first: string, last: string) => {
  return (first?.[0] || "") + (last?.[0] || "");
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone || "",
    department: user.department || "",
    bio: user.bio || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Update profile picture if a new one was uploaded
      let updatedUser = user;
      if (profileImageFile && profileImagePreview) {
        updatedUser = await supabaseDb.updateProfilePicture(user.id, profileImagePreview);
      }
      
      // Update profile information
      const profileUpdates = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        department: formData.department || null,
        bio: formData.bio || null,
      };
      
      updatedUser = await supabaseDb.updateUserProfile(user.id, profileUpdates);
      
      onUserUpdate(updatedUser);
      setIsEditing(false);
      setProfileImageFile(null);
      setProfileImagePreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || "",
      department: user.department || "",
      bio: user.bio || "",
    });
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setErrors({});
    setIsEditing(false);
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    // Note: In a real implementation, you'd need to verify the current password first
    // For now, we'll just change the password using Supabase Auth
    const result = await supabaseAuth.changePassword(newPassword);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to change password');
    }
  };

  const currentProfileImage = profileImagePreview || user.profile_picture;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      {/* Header with Edit Button */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
        </div>
        {!isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Profile Picture Section */}
        <div className="flex-shrink-0 w-full lg:w-auto flex flex-col items-center">
          <div className="relative group">
            {currentProfileImage ? (
              <img
                src={currentProfileImage}
                alt="Profile"
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-200 shadow"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-blue-100 flex items-center justify-center text-5xl font-bold text-blue-700 border-4 border-blue-200 shadow">
                {getInitials(formData.first_name, formData.last_name)}
              </div>
            )}
            
            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Upload Image"
                  >
                    <Upload className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={handleCameraCapture}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Take Photo"
                  >
                    <Camera className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center mt-4">
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`text-lg font-semibold text-center bg-transparent border-b-2 ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 outline-none mb-2`}
                  placeholder="First Name"
                />
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`text-lg font-semibold text-center bg-transparent border-b-2 ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  } focus:border-blue-500 outline-none block w-full`}
                  placeholder="Last Name"
                />
                {(errors.first_name || errors.last_name) && (
                  <p className="text-red-500 text-sm mt-1">{errors.first_name || errors.last_name}</p>
                )}
              </>
            ) : (
              <div className="text-lg font-semibold text-gray-800">
                {user.first_name} {user.last_name}
              </div>
            )}
            <div className="text-gray-500 mt-1">{user.role}</div>
            <div
              className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                user.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {user.is_active ? "Active" : "Inactive"}
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Profile Information */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Contact Information</h3>
              
              <div className="flex items-center text-gray-700">
                <Mail className="w-4 h-4 mr-3 flex-shrink-0" />
                <span>{user.email}</span>
              </div>
              
              <div className="flex items-center text-gray-700">
                <Phone className="w-4 h-4 mr-3 flex-shrink-0" />
                {isEditing ? (
                  <div className="flex-1">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      } focus:border-blue-500 outline-none`}
                      placeholder="Phone number"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                ) : (
                  <span>{user.phone || "Not provided"}</span>
                )}
              </div>
              
              <div className="flex items-center text-gray-700">
                <Briefcase className="w-4 h-4 mr-3 flex-shrink-0" />
                {isEditing ? (
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                    placeholder="Department"
                  />
                ) : (
                  <span>{user.department || "Not specified"}</span>
                )}
              </div>
              
              <div className="flex items-center text-gray-700">
                <Calendar className="w-4 h-4 mr-3 flex-shrink-0" />
                <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              
              {user.last_login && (
                <div className="flex items-center text-gray-700">
                  <UserCheck className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span>Last login: {new Date(user.last_login).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Bio Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">About</h3>
              
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-700">
                  {user.bio || "No bio available"}
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordChange={handlePasswordChange}
      />
    </div>
  );
};

export default ProfilePage;