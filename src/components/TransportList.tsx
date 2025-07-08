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
} from "lucide-react";

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

const TransportList: React.FC<TransportListProps> = ({ vehicles, users }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string | "all">("all");
  const [view, setView] = useState<"card" | "list">("card");

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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Truck className="w-7 h-7 mr-2 text-blue-600" />
          Transport Vehicles
        </h2>
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto items-stretch md:items-end">
          <input
            type="text"
            placeholder="Search by name, license, or agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="van">Van</option>
            <option value="truck">Truck</option>
          </select>
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-2 py-1 bg-gray-50">
            <button
              className={`p-1 rounded ${view === "card" ? "bg-blue-100" : ""}`}
              onClick={() => setView("card")}
              title="Card View"
            >
              <GridIcon className="w-5 h-5 text-blue-600" />
            </button>
            <button
              className={`p-1 rounded ${view === "list" ? "bg-blue-100" : ""}`}
              onClick={() => setView("list")}
              title="List View"
            >
              <ListIcon className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
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
