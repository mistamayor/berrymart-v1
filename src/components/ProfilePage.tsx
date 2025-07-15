import React from "react";
import { User } from "../types";
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Phone,
  Briefcase,
  UserCheck,
} from "lucide-react";

interface ProfilePageProps {
  user: User;
}

const getInitials = (first: string, last: string) => {
  return ((first || "")[0] || "") + ((last || "")[0] || "");
};

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8 flex flex-col sm:flex-row items-center gap-8">
      {/* Avatar/Profile Picture */}
      <div className="flex-shrink-0 w-full sm:w-[35%] flex flex-col items-center">
        <div className="w-40 h-40 rounded-full bg-blue-100 flex items-center justify-center text-5xl font-bold text-blue-700 border-4 border-blue-200 shadow mb-4">
          {getInitials(user.first_name, user.last_name)}
        </div>
        <div className="text-lg font-semibold text-gray-800 mt-2">
          {user.first_name} {user.last_name}
        </div>
        <div className="text-gray-500">{user.role}</div>
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
      {/* Bio Information */}
      <div className="flex-1 w-full sm:w-[65%]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center text-gray-700 mb-3">
              <Mail className="w-4 h-4 mr-2" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center text-gray-700 mb-3">
              <Phone className="w-4 h-4 mr-2" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center text-gray-700 mb-3">
              <Briefcase className="w-4 h-4 mr-2" />
              <span>{user.department}</span>
            </div>
            <div className="flex items-center text-gray-700 mb-3">
              <Calendar className="w-4 h-4 mr-2" />
              <span>
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-800 mb-2 flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Manager
            </div>
            <div className="flex items-center text-gray-700 mb-2">
              <span className="mr-2">
                {user.manager_first_name} {user.manager_last_name}
              </span>
            </div>
            <div className="flex items-center text-gray-700 mb-2">
              <Mail className="w-4 h-4 mr-2" />
              <span>{user.manager_email}</span>
            </div>
          </div>
        </div>
        {/* Future: Add edit profile, change password, etc. */}
      </div>
    </div>
  );
};

export default ProfilePage;
