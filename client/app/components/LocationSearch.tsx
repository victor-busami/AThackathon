'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search } from 'lucide-react';

// Dynamic import to avoid SSR issues with Leaflet
const DynamicMap = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>,
});

interface LocationSearchProps {
  onLocationChange?: (location: { name: string; lat: number; lng: number } | null) => void;
  selectedLocation?: { name: string; lat: number; lng: number } | null;
  properties?: Array<{
    id: number;
    nameOfProperty: string;
    price: number;
    location: string;
  }>;
}

export default function LocationSearch({ onLocationChange, selectedLocation, properties = [] }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<{ name: string; lat: number; lng: number } | null>(selectedLocation || null);

  const handleLocationSelect = (loc: { name: string; lat: number; lng: number }) => {
    setLocation(loc);
    onLocationChange?.(loc);
  };

  const clearLocation = () => {
    setLocation(null);
    setSearchQuery('');
    onLocationChange?.(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Search by Location</h3>
        </div>

        <div className="space-y-4">
          {/* Quick Select Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleLocationSelect({ name: 'Nairobi', lat: -1.2921, lng: 36.8219 })}
              className={`flex-1 px-4 py-2 rounded transition text-sm font-medium ${
                location?.name === 'Nairobi'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Nairobi
            </button>
            <button
              onClick={() => handleLocationSelect({ name: 'Kiambu', lat: -1.01, lng: 36.65 })}
              className={`flex-1 px-4 py-2 rounded transition text-sm font-medium ${
                location?.name === 'Kiambu'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Kiambu
            </button>
          </div>

          {/* Selected Location Display */}
          {location && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Selected Location:</p>
                <p className="font-medium text-gray-800">{location.name}</p>
                <p className="text-xs text-gray-500">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</p>
              </div>
              <button
                onClick={clearLocation}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
              >
                Clear
              </button>
            </div>
          )}

          {/* Map Toggle Button */}
          {/* Removed - map is always visible */}

          {/* Map Component - Always Visible */}
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <DynamicMap
              onLocationSelect={handleLocationSelect}
              defaultCenter={location ? [location.lat, location.lng] : [-1.3, 36.8]}
              properties={properties}
            />
          </div>

          {/* Map Legend */}
          <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
            <p className="font-medium text-gray-800 mb-2">Map Legend:</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white">P</div>
                <span className="text-gray-700">Available Properties ({properties.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white">✓</div>
                <span className="text-gray-700">Selected Location</span>
              </div>
            </div>
          </div>

          {/* Text Search (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter location name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Nairobi, Mombasa, Kisumu..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  if (searchQuery.trim()) {
                    handleLocationSelect({ name: searchQuery, lat: 0, lng: 0 });
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
              >
                <Search size={18} />
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
