import React, { useState } from "react";
import { User } from "../types";
import { Truck, X } from "lucide-react";
import { supabaseDb } from "../lib/supabaseDatabase";

interface TransportFormProps {
  users: User[];
  onClose: () => void;
  onAdded: () => void;
}

const TransportForm: React.FC<TransportFormProps> = ({ users, onClose, onAdded }) => {
  const [formData, setFormData] = useState<{
    type: "van" | "truck";
    license_plate: string;
    capacity: string;
    status: "active" | "maintenance" | "retired";
    assigned_agent_id: string;
  }>({
    type: "van",
    license_plate: "",
    capacity: "",
    status: "active",
    assigned_agent_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.license_plate.trim())
      errs.license_plate = "License plate is required";
    if (
      !formData.capacity.trim() ||
      isNaN(Number(formData.capacity)) ||
      Number(formData.capacity) <= 0
    )
      errs.capacity = "Valid capacity is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    
    try {
      await supabaseDb.createVehicle({
        type: formData.type,
        license_plate: formData.license_plate,
        capacity: Number(formData.capacity),
        status: formData.status,
        assigned_agent_id: formData.assigned_agent_id
          ? Number(formData.assigned_agent_id)
          : null,
        assigned_agent_name: formData.assigned_agent_id 
          ? users.find(u => u.id === Number(formData.assigned_agent_id))?.first_name + ' ' + users.find(u => u.id === Number(formData.assigned_agent_id))?.last_name
          : null,
      });
      onAdded();
      onClose();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      setErrors({ submit: 'Failed to create vehicle. Please try again.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-blue-600" />
              Add New Transport
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    type: e.target.value as "van" | "truck",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="van">Van</option>
                <option value="truck">Truck</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Plate
              </label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, license_plate: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.license_plate ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter license plate"
              />
              {errors.license_plate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.license_plate}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (kg)
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, capacity: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.capacity ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter capacity in kg"
                min={0}
              />
              {errors.capacity && (
                <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
              )}
            </div>
            
            {/* Error Display */}
            {errors.submit && (
              <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded">
                {errors.submit}
              </div>
            )}
            
            <div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    status: e.target.value as
                      | "active"
                      | "maintenance"
                      | "retired",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign Delivery Agent (optional)
              </label>
              <select
                name="assigned_agent_id"
                value={formData.assigned_agent_id}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    assigned_agent_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {users
                  .filter((u) => u.role === "DeliveryAgent")
                  .map((agent) => (
                    <option
                      key={agent.id}
                      value={agent.id}
                    >
                      {agent.first_name} {agent.last_name} ({agent.email})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Vehicle
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransportForm;