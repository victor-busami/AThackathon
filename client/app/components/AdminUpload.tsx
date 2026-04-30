'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface AdminUploadProps {
  adminToken: string | null;
  onPropertyAdded?: () => void;
}

interface FormData {
  nameOfProperty: string;
  description: string;
  price: string;
  location: string;
  type: string;
  agentPhoneNumber: string;
}

export default function AdminUpload({ adminToken, onPropertyAdded }: AdminUploadProps) {
  const [formData, setFormData] = useState<FormData>({
    nameOfProperty: '',
    description: '',
    price: '',
    location: '',
    type: 'Apartment',
    agentPhoneNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const propertyTypes = ['Apartment', 'House', 'Villa', 'Commercial', 'Land', 'Office'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Validate required fields
    if (
      !formData.nameOfProperty ||
      !formData.price ||
      !formData.location ||
      !formData.type ||
      !formData.agentPhoneNumber
    ) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || '',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setFormData({
          nameOfProperty: '',
          description: '',
          price: '',
          location: '',
          type: 'Apartment',
          agentPhoneNumber: '',
        });
        // Call the callback to refresh properties
        if (onPropertyAdded) {
          onPropertyAdded();
        }
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to upload property');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!adminToken) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <Upload size={28} />
        Upload Property
      </h2>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded flex items-center gap-2 text-green-700">
          <CheckCircle size={20} />
          Property uploaded successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Property Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Name *
            </label>
            <input
              type="text"
              name="nameOfProperty"
              value={formData.nameOfProperty}
              onChange={handleChange}
              placeholder="e.g., Sunset Villa"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (KSH) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Downtown LA"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            >
              {propertyTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Agent Phone */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent Phone Number *
            </label>
            <input
              type="tel"
              name="agentPhoneNumber"
              value={formData.agentPhoneNumber}
              onChange={handleChange}
              placeholder="e.g., +1 (555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Property details and features..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-400 font-medium"
        >
          {loading ? 'Uploading...' : 'Upload Property'}
        </button>
      </form>
    </div>
  );
}
