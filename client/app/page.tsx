'use client';

import React, { useState, useEffect } from 'react';
import PropertyCard from './components/PropertyCard';
import BookmarkedProperties from './components/BookmarkedProperties';
import AdminLogin from './components/AdminLogin';
import AdminUpload from './components/AdminUpload';
import LocationSearch from './components/LocationSearch';
import { Home as HomeIcon, Cog, X } from 'lucide-react';

interface Property {
  id: number;
  nameOfProperty: string;
  description?: string;
  price: number;
  location: string;
  type: string;
  agentPhoneNumber: string;
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Generate or retrieve user ID from localStorage
const getUserId = (): number => {
  if (typeof window === 'undefined') return 0;
  
  let userId = localStorage.getItem('userId');
  if (!userId) {
    // Generate a new random user ID (between 1 and 1,000,000)
    userId = Math.floor(Math.random() * 1000000) + 1 + '';
    localStorage.setItem('userId', userId);
  }
  return parseInt(userId);
};

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'bookmarks'>('browse');
  const [userId, setUserId] = useState<number>(0);
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
    
    // Check if admin token exists in localStorage
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setAdminToken(savedToken);
    }
    
    fetchProperties();
    if (mode === 'user') {
      fetchBookmarks(id);
    }
  }, [mode]);

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/api/properties`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/bookmarks`, {
        headers: {
          'x-user-id': id.toString(),
        },
      });
      if (response.ok) {
        const data = await response.json();
        const ids = new Set(data.map((b: any) => b.propertyId));
        setBookmarkedIds(ids);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const handleBookmark = async (propertyId: number) => {
    if (userId === 0) return;
    
    try {
      if (bookmarkedIds.has(propertyId)) {
        // Remove bookmark
        const response = await fetch(`${API_URL}/api/bookmarks/${propertyId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId.toString(),
          },
        });
        if (response.ok) {
          setBookmarkedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(propertyId);
            return newSet;
          });
        }
      } else {
        // Add bookmark
        const response = await fetch(`${API_URL}/api/bookmarks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId.toString(),
          },
          body: JSON.stringify({ propertyId }),
        });
        if (response.ok) {
          setBookmarkedIds(prev => new Set(prev).add(propertyId));
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleAdminLogin = (token: string) => {
    setAdminToken(token);
    setMode('admin');
    setActiveTab('browse');
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setMode('user');
    localStorage.removeItem('adminToken');
  };

  const getFilteredProperties = () => {
    if (!selectedLocation) return properties;
    
    // Filter properties by location name (case-insensitive partial match)
    return properties.filter(prop =>
      prop.location.toLowerCase().includes(selectedLocation.name.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Property Browser</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setMode('user')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${
                mode === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              <HomeIcon size={18} />
              User Mode
            </button>
            <button
              onClick={() => setMode('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${
                mode === 'admin'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              <Cog size={18} />
              Admin Mode
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Mode */}
        {mode === 'user' && (
          <>
            {userId > 0 && (
              <p className="text-sm text-gray-500 mb-6">User ID: {userId}</p>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'browse'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Browse Properties
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'bookmarks'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Bookmarks
              </button>
            </div>

            {/* Browse Properties Tab */}
            {activeTab === 'browse' && (
              <div className="space-y-6">
                <LocationSearch
                  selectedLocation={selectedLocation}
                  onLocationChange={setSelectedLocation}
                  properties={properties}
                />

                {selectedLocation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                    <p className="text-blue-800">
                      Searching properties in <strong>{selectedLocation.name}</strong>
                    </p>
                    <button
                      onClick={() => setSelectedLocation(null)}
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                {loading ? (
                  <p className="text-center text-gray-500">Loading properties...</p>
                ) : getFilteredProperties().length === 0 ? (
                  <p className="text-center text-gray-500">
                    {selectedLocation
                      ? `No properties found in ${selectedLocation.name}`
                      : 'No properties found'}
                  </p>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Found {getFilteredProperties().length} properties
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {getFilteredProperties().map(property => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          isBookmarked={bookmarkedIds.has(property.id)}
                          onBookmark={handleBookmark}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <BookmarkedProperties
                bookmarkedIds={bookmarkedIds}
                properties={properties}
                onBookmark={handleBookmark}
              />
            )}
          </>
        )}

        {/* Admin Mode */}
        {mode === 'admin' && (
          <div className="space-y-8">
            <AdminLogin
              adminToken={adminToken}
              onLoginSuccess={handleAdminLogin}
              onLogout={handleAdminLogout}
            />

            {adminToken && (
              <>
                <div className="border-t border-gray-200 pt-8">
                  <AdminUpload adminToken={adminToken} onPropertyAdded={fetchProperties} />
                </div>

                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-xl font-bold mb-6 text-gray-800">Properties List</h3>
                  {loading ? (
                    <p className="text-center text-gray-500">Loading properties...</p>
                  ) : properties.length === 0 ? (
                    <p className="text-center text-gray-500">No properties found</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {properties.map(property => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          isBookmarked={false}
                          onBookmark={() => {}}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}