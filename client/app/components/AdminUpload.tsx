'use client';

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Search,
  Eye,
  Check,
  X,
  RefreshCw,
  Home,
  Calendar,
  MapPin,
  DollarSign,
  Phone,
  Building
} from 'lucide-react';
import Map from './Map'; // Import the Map component

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
  latitude?: number;
  longitude?: number;
}

// Property interface for the management system
interface Property {
  id: string;
  nameOfProperty: string;
  description: string;
  price: string;
  location: string;
  type: string;
  agentPhoneNumber: string;
  status: 'available' | 'booked';
  createdAt?: string;
  bookedBy?: string;
  bookedDate?: string;
  latitude?: number | null;
  longitude?: number | null;
}

// Main Admin Upload Component
export default function AdminUpload({ adminToken, onPropertyAdded }: AdminUploadProps) {
  const [formData, setFormData] = useState<FormData>({
    nameOfProperty: '',
    description: '',
    price: '',
    location: '',
    type: 'Apartment',
    agentPhoneNumber: '',
    latitude: undefined,
    longitude: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showManagement, setShowManagement] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

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

    if (!selectedLocation) {
      setError('Please pin the property location on the map');
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
        body: JSON.stringify({ 
          ...formData, 
          status: 'available',
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng
        }),
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
          latitude: undefined,
          longitude: undefined,
        });
        setSelectedLocation(null);
        if (onPropertyAdded) {
          onPropertyAdded();
        }
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
    <div className="space-y-6">
      {/* Toggle between Upload and Management */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setShowManagement(false)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            !showManagement 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Upload Property
        </button>
        <button
          onClick={() => setShowManagement(true)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            showManagement 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Manage Properties
        </button>
      </div>

      {!showManagement ? (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Westlands, Nairobi"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                  required
                />
              </div>

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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Phone Number *
                </label>
                <input
                  type="tel"
                  name="agentPhoneNumber"
                  value={formData.agentPhoneNumber}
                  onChange={handleChange}
                  placeholder="e.g., +254 712 345 678"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                  required
                />
              </div>

              {/* Location Picker Button */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pin Location on Map *
                </label>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  {selectedLocation ? '📍 Update Location on Map' : '🗺️ Pick Location on Map'}
                </button>
                {selectedLocation && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                    <p className="font-medium">Selected Location:</p>
                    <p>{selectedLocation.name}</p>
                    <p className="text-xs text-gray-600">
                      Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

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
      ) : (
        <AdminPropertyManagement adminToken={adminToken} />
      )}

      {/* Map Modal for Location Selection */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Pick Property Location</h3>
              <button onClick={() => setShowMap(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <Map
                onLocationSelect={(location) => {
                  setSelectedLocation(location);
                  setFormData(prev => ({ ...prev, location: location.name }));
                  setShowMap(false);
                }}
                properties={[]}
                isSelectionMode={true}
              />
              <p className="mt-2 text-sm text-gray-600 text-center">
                Click anywhere on the map to select the exact property location
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin Property Management Component with Card Section
function AdminPropertyManagement({ adminToken }: { adminToken: string }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'booked'>('all');
  const [showMapView, setShowMapView] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Fetch all properties from Neon DB via Prisma
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/properties`, {
        headers: {
          'x-admin-token': adminToken,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      } else {
        setError('Failed to fetch properties');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [adminToken]);

  // Update property status in Neon DB
  const updatePropertyStatus = async (propertyId: string, newStatus: 'available' | 'booked') => {
    try {
      const response = await fetch(`${API_URL}/api/admin/properties/${propertyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ 
          status: newStatus,
          bookedDate: newStatus === 'booked' ? new Date().toISOString() : null
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchProperties();
        setSuccess(`Property marked as ${newStatus === 'booked' ? 'BOOKED' : 'AVAILABLE'} successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update property status');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to update property status');
      console.error('Update error:', err);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Delete property from Neon DB
  const deleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken,
        },
      });

      if (response.ok) {
        await fetchProperties();
        setSuccess('Property deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete property');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete property');
      console.error('Delete error:', err);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filter properties based on search and status
  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.nameOfProperty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Real-time statistics from Neon DB
  const totalProperties = properties.length;
  const availableCount = properties.filter(p => p.status === 'available').length;
  const bookedCount = properties.filter(p => p.status === 'booked').length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header with Stats - Real-time from DB */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Property Management Dashboard</h2>
          <button
            onClick={() => setShowMapView(!showMapView)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <MapPin size={18} />
            {showMapView ? 'Show List View' : 'Show Map View'}
          </button>
        </div>
        
        {/* Statistics Cards - Live from Neon Database */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Properties</p>
                <p className="text-3xl font-bold">{totalProperties}</p>
              </div>
              <Building size={32} className="opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Available</p>
                <p className="text-3xl font-bold">{availableCount}</p>
              </div>
              <Home size={32} className="opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Booked</p>
                <p className="text-3xl font-bold">{bookedCount}</p>
              </div>
              <Calendar size={32} className="opacity-80" />
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by property name, location, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'available' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setFilterStatus('booked')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'booked' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Booked
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2 text-green-700">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
      </div>

      {/* Properties View */}
      {showMapView ? (
        <div className="h-[500px] w-full">
          <Map
            properties={filteredProperties}
            onPropertyClick={(property) => setSelectedProperty(property)}
            isSelectionMode={false}
          />
        </div>
      ) : (
        <>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="animate-spin mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-500">Loading properties from database...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Home className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-500">No properties found in database</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onUpdateStatus={updatePropertyStatus}
                  onDelete={deleteProperty}
                  onViewDetails={setSelectedProperty}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onUpdateStatus={updatePropertyStatus}
        />
      )}
    </div>
  );
}

// Property Card Component
function PropertyCard({ 
  property, 
  onUpdateStatus, 
  onDelete,
  onViewDetails 
}: { 
  property: Property;
  onUpdateStatus: (id: string, status: 'available' | 'booked') => void;
  onDelete: (id: string) => void;
  onViewDetails: (property: Property) => void;
}) {
  const isBooked = property.status === 'booked';

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-white">
      {/* Card Header with Status Badge */}
      <div className={`p-4 ${isBooked ? 'bg-orange-50' : 'bg-green-50'}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">
              {property.nameOfProperty}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={14} className="text-gray-500" />
              <p className="text-sm text-gray-600">{property.location}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            isBooked 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {property.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-blue-600">
            <DollarSign size={16} />
            <span className="font-bold text-lg">
              {parseFloat(property.price).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Building size={14} />
            <span className="text-sm">{property.type}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone size={14} />
          <span>{property.agentPhoneNumber}</span>
        </div>

        {property.description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {property.description}
          </p>
        )}

        {isBooked && property.bookedDate && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
            Booked on: {new Date(property.bookedDate).toLocaleDateString()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onViewDetails(property)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 text-sm"
          >
            <Eye size={16} />
            View
          </button>
          
          {!isBooked ? (
            <button
              onClick={() => onUpdateStatus(property.id, 'booked')}
              className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-1 text-sm"
            >
              <Calendar size={16} />
              Book Property
            </button>
          ) : (
            <button
              onClick={() => onUpdateStatus(property.id, 'available')}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1 text-sm"
            >
              <Check size={16} />
              Make Available
            </button>
          )}
          
          <button
            onClick={() => onDelete(property.id)}
            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Property Details Modal Component
function PropertyDetailsModal({ 
  property, 
  onClose, 
  onUpdateStatus 
}: { 
  property: Property;
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'available' | 'booked') => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Property Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Property Name</label>
              <p className="text-gray-900">{property.nameOfProperty}</p>
            </div>
            
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Status</label>
              <span className={`inline-block px-2 py-1 rounded-full text-sm font-semibold ${
                property.status === 'booked' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {property.status.toUpperCase()}
              </span>
            </div>
            
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Price</label>
              <p className="text-blue-600 font-bold text-xl">KSH {parseFloat(property.price).toLocaleString()}</p>
            </div>
            
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Property Type</label>
              <p className="text-gray-900">{property.type}</p>
            </div>
            
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Location</label>
              <p className="text-gray-900">{property.location}</p>
            </div>
            
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Agent Phone</label>
              <p className="text-gray-900">{property.agentPhoneNumber}</p>
            </div>
          </div>
          
          {property.description && (
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Description</label>
              <p className="text-gray-900">{property.description}</p>
            </div>
          )}
          
          {property.bookedDate && (
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Booked Date</label>
              <p className="text-gray-900">{new Date(property.bookedDate).toLocaleString()}</p>
            </div>
          )}

          {property.latitude && property.longitude && (
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Coordinates</label>
              <p className="text-gray-900 text-sm">
                Lat: {property.latitude.toFixed(6)}, Lng: {property.longitude.toFixed(6)}
              </p>
            </div>
          )}
          
          <div className="pt-4 flex gap-3">
            {property.status === 'available' ? (
              <button
                onClick={() => {
                  onUpdateStatus(property.id, 'booked');
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Mark as Booked
              </button>
            ) : (
              <button
                onClick={() => {
                  onUpdateStatus(property.id, 'available');
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Mark as Available
              </button>
            )}
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}