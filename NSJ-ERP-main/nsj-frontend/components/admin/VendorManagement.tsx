import React, { useState } from "react";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export const VendorManagement = () => {
  const [vendors, setVendors] = useState([
    {
      id: "1",
      name: "Acme Corporation",
      contact_name: "John Smith",
      emails: ["finance@acme.com", "john@acme.com"],
      whatsapp_phone: "+1234567890",
      territory: "North America",
      terms: "Net 30",
      active: true,
      notes: "Preferred vendor for office supplies",
    },
    {
      id: "2",
      name: "TechStart Solutions",
      contact_name: "Sarah Johnson",
      emails: ["billing@techstart.com"],
      whatsapp_phone: "+1987654321",
      territory: "Europe",
      terms: "Net 15",
      active: true,
      notes: "Software development partner",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const toggleVendorStatus = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((vendor) =>
        vendor.id === vendorId ? { ...vendor, active: !vendor.active } : vendor
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Vendor Management
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Vendor
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Contact
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Territory
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Terms
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor, index) => (
                <tr
                  key={vendor.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-gray-25" : ""}`}
                >
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{vendor.name}</p>
                      <p className="text-sm text-gray-600">
                        {vendor.emails.join(", ")}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-gray-900">{vendor.contact_name}</p>
                      <p className="text-sm text-gray-600">
                        {vendor.whatsapp_phone}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {vendor.territory}
                  </td>
                  <td className="py-4 px-6 text-gray-900">{vendor.terms}</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleVendorStatus(vendor.id)}
                      className="flex items-center space-x-2"
                    >
                      {vendor.active ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Inactive
                          </span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label={`Edit vendor ${vendor.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Delete vendor ${vendor.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
