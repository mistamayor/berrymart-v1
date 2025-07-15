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
  const [view, setView] = useState<"card" | "list">("list");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Truck className="w-7 h-7 mr-2 text-blue-600" />
            Transport Vehicles
          </h2>
          <p className="text-gray-600 mt-1">
            Manage delivery vehicles and assignments
          </p>
        </div>

        {canEditTransport && (
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Transport
          </button>
        )}
      </div>

      {/* Filters and View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              placeholder="Search by name, license, or agent..."
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="van">Van</option>
            <option value="truck">Truck</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
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
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{filteredVehicles.length}</p>
            </div>
            <Truck className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredVehicles.filter(v => v.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredVehicles.filter(v => v.status === 'maintenance').length}
              </p>
            </div>
            <Wrench className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Retired</p>
              <p className="text-2xl font-bold text-gray-600">
                {filteredVehicles.filter(v => v.status === 'retired').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Add Transport Form Modal */}
      {showForm && (
        <TransportForm
          users={users}
          onClose={() => setShowForm(false)}
          onAdded={onVehicleChange}
        />
      )}

      {/* No vehicles message */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No vehicles found
          </h3>
          <p className="text-gray-500">
            {vehicles.length === 0 
              ? "Add your first transport vehicle to get started."
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      ) : view === "list" ? (
        /* List View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Plate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => {
                  const agent = users.find(
                    (u) => u.id === vehicle.assigned_agent_id
                  );
                  return (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <Truck className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {vehicle.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {vehicle.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {vehicle.license_plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.capacity.toLocaleString()} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vehicle.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : vehicle.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusIcon(vehicle.status)}
                          <span className="ml-1 capitalize">{vehicle.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent ? (
                          <div className="flex items-center">
                            <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {agent.first_name} {agent.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {agent.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            No agent assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {vehicle.notes || (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => {
            const agent = users.find((u) => u.id === vehicle.assigned_agent_id);
            return (
              <div
                key={vehicle.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{vehicle.name}</h3>
                      <p className="text-sm text-gray-600">ID: {vehicle.id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : vehicle.status === 'maintenance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusIcon(vehicle.status)}
                    <span className="ml-1 capitalize">{vehicle.status}</span>
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="font-medium">Type:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {vehicle.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="font-medium">License:</span>
                    <span className="font-mono">{vehicle.license_plate}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="font-medium">Capacity:</span>
                    <span>{vehicle.capacity.toLocaleString()} kg</span>
                  </div>
                  {vehicle.notes && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="font-medium">Notes:</span>
                      <span>{vehicle.notes}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <div>
                      {agent ? (
                        <>
                          <p className="text-sm font-medium text-gray-900">
                            {agent.first_name} {agent.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{agent.email}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No delivery agent assigned
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransportList;
