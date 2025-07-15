import React, { useState } from "react";
import { Customer } from "../types";
import { db } from "../lib/database";
import { User, Mail, Phone, MapPin, UserCheck } from "lucide-react";
import { auth } from "../lib/auth";

interface CustomerFormProps {
  onCustomerAdded: (customer: Customer) => void;
  onClose: () => void;
  customer?: Customer;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  onCustomerAdded,
  onClose,
  customer,
}) => {
  const [formData, setFormData] = useState(() =>
    customer
      ? {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          addresses: customer.addresses.map((a) => ({ ...a })),
          type: customer.type,
        }
      : {
          name: "",
          email: "",
          phone: "",
          addresses: [
            {
              id: 1,
              address: "",
              city: "",
              state: "",
              postal_code: "",
              country: "",
              is_default: true,
            },
          ],
          type: "retail" as const,
        }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.email.includes("@"))
      newErrors.email = "Valid email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (formData.addresses.length === 0)
      newErrors.addresses = "At least one address is required";
    formData.addresses.forEach((addr, idx) => {
      if (!addr.address.trim())
        newErrors[`address_${idx}`] = "Address is required";
      if (!addr.city.trim()) newErrors[`city_${idx}`] = "City is required";
      if (!addr.state.trim()) newErrors[`state_${idx}`] = "State is required";
      if (!addr.postal_code.trim())
        newErrors[`postal_code_${idx}`] = "Postal code is required";
      if (!addr.country.trim())
        newErrors[`country_${idx}`] = "Country is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        let result: Customer;
        if (customer) {
          // Edit mode
          const currentUser = auth.getAuthState().user;
          // Compute what changed (simple summary)
          let changes: string[] = [];
          if (formData.name !== customer.name) changes.push("Name");
          if (formData.email !== customer.email) changes.push("Email");
          if (formData.phone !== customer.phone) changes.push("Phone");
          if (formData.type !== customer.type) changes.push("Type");
          if (
            JSON.stringify(formData.addresses) !==
            JSON.stringify(customer.addresses)
          )
            changes.push("Addresses");
          const changeSummary =
            changes.length > 0 ? changes.join(", ") : "No changes";
          result = db.updateCustomer(customer.id, {
            ...formData,
            last_modified_by: currentUser
              ? `${currentUser.first_name} ${currentUser.last_name}`
              : "Unknown",
            last_modified_changes: changeSummary,
          });
        } else {
          // Create mode
          result = db.createCustomer(formData);
        }
        onCustomerAdded(result);
        onClose();
      } catch (error) {
        console.error("Error saving customer:", error);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddressChange = (
    idx: number,
    field: string,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) =>
        i === idx ? { ...addr, [field]: value } : addr
      ),
    }));
    if (errors[`${field}_${idx}`]) {
      setErrors((prev) => ({ ...prev, [`${field}_${idx}`]: "" }));
    }
  };

  const handleAddAddress = () => {
    setFormData((prev) => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          id: Date.now(),
          address: "",
          city: "",
          state: "",
          postal_code: "",
          country: "",
          is_default: false,
        },
      ],
    }));
  };

  const handleRemoveAddress = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== idx),
    }));
  };

  const handleSetDefaultAddress = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) => ({
        ...addr,
        is_default: i === idx,
      })),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <User className="w-6 h-6 mr-2 text-blue-600" />
              {customer ? "Edit Customer" : "Add New Customer"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter customer name"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ship-To Addresses
              </label>
              {formData.addresses.map((addr, idx) => (
                <div
                  key={addr.id}
                  className="mb-4 p-3 border rounded-lg bg-gray-50 relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700">
                      Address #{idx + 1}
                    </span>
                    {formData.addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(idx)}
                        className="text-red-500 text-xs ml-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Address"
                      value={addr.address}
                      onChange={(e) =>
                        handleAddressChange(idx, "address", e.target.value)
                      }
                      className={`pl-3 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`address_${idx}`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={addr.city}
                      onChange={(e) =>
                        handleAddressChange(idx, "city", e.target.value)
                      }
                      className={`pl-3 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`city_${idx}`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={addr.state}
                      onChange={(e) =>
                        handleAddressChange(idx, "state", e.target.value)
                      }
                      className={`pl-3 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`state_${idx}`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={addr.postal_code}
                      onChange={(e) =>
                        handleAddressChange(idx, "postal_code", e.target.value)
                      }
                      className={`pl-3 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`postal_code_${idx}`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={addr.country}
                      onChange={(e) =>
                        handleAddressChange(idx, "country", e.target.value)
                      }
                      className={`pl-3 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`country_${idx}`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  <div className="mt-2 flex items-center">
                    <input
                      type="radio"
                      checked={addr.is_default}
                      onChange={() => handleSetDefaultAddress(idx)}
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-600">
                      Default Ship-To Address
                    </span>
                  </div>
                  {errors[`address_${idx}`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`address_${idx}`]}
                    </p>
                  )}
                  {errors[`city_${idx}`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`city_${idx}`]}
                    </p>
                  )}
                  {errors[`state_${idx}`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`state_${idx}`]}
                    </p>
                  )}
                  {errors[`postal_code_${idx}`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`postal_code_${idx}`]}
                    </p>
                  )}
                  {errors[`country_${idx}`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`country_${idx}`]}
                    </p>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddAddress}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs mt-2"
              >
                Add Address
              </button>
              {errors.addresses && (
                <p className="text-red-500 text-sm mt-1">{errors.addresses}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Type
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="open_market">Open Market</option>
                </select>
              </div>
            </div>

            {customer &&
              (customer.last_modified_at || customer.last_modified_by) && (
                <div className="mb-4 text-xs text-gray-500">
                  Last modified{" "}
                  {customer.last_modified_at
                    ? `on ${new Date(
                        customer.last_modified_at
                      ).toLocaleString()}`
                    : ""}
                  {customer.last_modified_by
                    ? ` by ${customer.last_modified_by}`
                    : ""}
                  {customer.last_modified_changes
                    ? ` (${customer.last_modified_changes})`
                    : ""}
                </div>
              )}

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
                {customer ? "Save Changes" : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
