import React, { useState } from "react";
import { TransportVehicle, User } from "../types";
import {
  Truck,
  User as UserIcon,
  Wrench,
  CheckCircle,
  XCircle,
  List as ListIcon,
  LayoutGrid as GridIcon,
  X,
  Plus,
  Search,
} from "lucide-react";
import { auth } from "../lib/auth";
import { db } from "../lib/database";

interface TransportListProps {
  vehicles: TransportVehicle[];
  users: User[];
  onVehicleChange: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "maintenance":
      return <Wrench className="w-4 h-4 text-yellow-500" />;
    case "retired":
      return <XCircle className="w-4 h-4 text-gray-400" />;
    default:
      return <Truck className="w-4 h-4 text-gray-400" />;
  }
};

const TransportForm: React.FC<{
  users: User[];
  onClose: () => void;
  onAdded: () => void;
}> = ({ users, onClose, onAdded }) => {
  const [formData, setFormData] = useState<{
    type: "van" | "truck";
    name: string;
    license_plate: string;
    capacity: string;
    status: "active" | "maintenance" | "retired";
    assigned_agent_id: string;
    notes: string;
  }>({
    type: "van",
    name: "",
    license_plate: "",
    capacity: "",
    status: "active",
    assigned_agent_id: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Name is required";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    db.createTransportVehicle({
      type: formData.type,
      name: formData.name,
      license_plate: formData.license_plate,
      capacity: Number(formData.capacity),
      status: formData.status,
      assigned_agent_id: formData.assigned_agent_id
        ? Number(formData.assigned_agent_id)
        : undefined,
      notes: formData.notes.trim() || undefined,
    });
    onAdded();
    onClose();
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
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, name: e.target.value }))
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter vehicle name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, notes: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any notes about the vehicle"
                rows={2}
              />
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

const TransportList: React.FC<TransportListProps> = ({
  vehicles,
  users,
  onVehicleChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string | "all">("all");
  const [view, setView] = useState<"card" | "list">("card");
  const [showForm, setShowForm] = useState(false);

  const canEditTransport = auth.hasPermission([
    "Admin",
    "Management",
    "Manager",
  ]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const agent = users.find((u) => u.id === vehicle.assigned_agent_id);
    const matchesSearch =
      searchTerm === "" ||
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent &&
        (`${agent.first_name} ${agent.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          agent.email.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesStatus =
      statusFilter === "all" || vehicle.status === statusFilter;
    const matchesType = typeFilter === "all" || vehicle.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Truck className="w-7 h-7 mr-2 text-blue-600" />
            Transport Vehicles
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              placeholder="Search by name, license, or agent..."
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("card")}
              className={`p-2 rounded-md transition-colors ${
                view === "card"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="Card View"
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-md transition-colors ${
                view === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
          {canEditTransport && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Add New Transport
            </button>
          )}
        </div>
      </div>
      {showForm && (
        <TransportForm
          users={users}
          onClose={() => setShowForm(false)}
          onAdded={onVehicleChange}
        />
      )}
      {view === "card" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => {
            const agent = users.find((u) => u.id === vehicle.assigned_agent_id);
            return (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl shadow p-6 border border-gray-200 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(vehicle.status)}
                  <span className="font-bold text-lg text-gray-900">
                    {vehicle.name}
                  </span>
                  <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                    {vehicle.type}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold">License Plate:</span>{" "}
                    {vehicle.license_plate}
                  </div>
                  <div>
                    <span className="font-semibold">Capacity:</span>{" "}
                    {vehicle.capacity} kg
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>{" "}
                    {vehicle.status}
                  </div>
                  {vehicle.notes && (
                    <div>
                      <span className="font-semibold">Notes:</span>{" "}
                      {vehicle.notes}
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  {agent ? (
                    <span>
                      {agent.first_name} {agent.last_name}{" "}
                      <span className="text-xs text-gray-500">
                        ({agent.email})
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">
                      No delivery agent assigned
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  License Plate
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Capacity
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Agent
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => {
                const agent = users.find(
                  (u) => u.id === vehicle.assigned_agent_id
                );
                return (
                  <tr
                    key={vehicle.id}
                    className="border-t"
                  >
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {vehicle.name}
                    </td>
                    <td className="px-4 py-2 capitalize">{vehicle.type}</td>
                    <td className="px-4 py-2">{vehicle.license_plate}</td>
                    <td className="px-4 py-2">{vehicle.capacity} kg</td>
                    <td className="px-4 py-2 capitalize flex items-center gap-2">
                      {getStatusIcon(vehicle.status)} {vehicle.status}
                    </td>
                    <td className="px-4 py-2">
                      {agent ? (
                        <span>
                          {agent.first_name} {agent.last_name}{" "}
                          <span className="text-xs text-gray-500">
                            ({agent.email})
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">
                          No delivery agent assigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {vehicle.notes || (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransportList;
