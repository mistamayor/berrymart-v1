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
  Search,
} from "lucide-react";
import TransportForm from "./TransportForm";

interface TransportListProps {
  vehicles: TransportVehicle[];
  users: User[];
  onVehicleChange: () => void;
  showTransportForm: boolean;
  onCloseTransportForm: () => void;
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


const TransportList: React.FC<TransportListProps> = ({
  vehicles,
  users,
  onVehicleChange,
  showTransportForm,
  onCloseTransportForm,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string | "all">("all");
  const [view, setView] = useState<"card" | "list">("card");


  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      searchTerm === "" ||
      vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.assigned_agent_name &&
        vehicle.assigned_agent_name.toLowerCase().includes(searchTerm.toLowerCase()));
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
              placeholder="Search by license plate or agent..."
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
        </div>
      </div>
      {showTransportForm && (
        <TransportForm
          users={users}
          onClose={onCloseTransportForm}
          onAdded={() => {
            onVehicleChange();
            onCloseTransportForm();
          }}
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
                    {vehicle.license_plate}
                  </span>
                  <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                    {vehicle.type}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold">Capacity:</span>{" "}
                    {vehicle.capacity} kg
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>{" "}
                    {vehicle.status}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  {vehicle.assigned_agent_name ? (
                    <span>
                      {vehicle.assigned_agent_name}
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
                  License Plate
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
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
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => {
                return (
                  <tr
                    key={vehicle.id}
                    className="border-t"
                  >
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {vehicle.license_plate}
                    </td>
                    <td className="px-4 py-2 capitalize">{vehicle.type}</td>
                    <td className="px-4 py-2">{vehicle.capacity} kg</td>
                    <td className="px-4 py-2 capitalize flex items-center gap-2">
                      {getStatusIcon(vehicle.status)} {vehicle.status}
                    </td>
                    <td className="px-4 py-2">
                      {vehicle.assigned_agent_name ? (
                        <span>
                          {vehicle.assigned_agent_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">
                          No delivery agent assigned
                        </span>
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
