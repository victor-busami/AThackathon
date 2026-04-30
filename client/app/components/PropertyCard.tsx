'use client';

import React from 'react';
import { Heart } from 'lucide-react';

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
  isBooked?: boolean;
  bookedUntil?: string | null;
}

interface PropertyCardProps {
  property: Property;
  isBookmarked: boolean;
  onBookmark: (propertyId: number) => void;
  onBook: (propertyId: number) => void;
}

export default function PropertyCard({ property, isBookmarked, onBookmark, onBook }: PropertyCardProps) {
  const isBooked = Boolean(property.isBooked);
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {property.nameOfProperty}
              </h3>
              {isBooked && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white bg-red-600 rounded-full">
                  Booked
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-2">{property.location}</p>
            <div className="flex gap-2 mb-2">
              <span className="inline-block px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                {property.type}
              </span>
            </div>
          </div>
          <button
            onClick={() => onBookmark(property.id)}
            className="ml-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Heart
              size={24}
              className={isBookmarked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
            />
          </button>
        </div>

        {property.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{property.description}</p>
        )}

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600">Price:</span>
            <span className="text-2xl font-bold text-gray-900">
              KSH {property.price.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Agent:</span>
            <span className="text-gray-900 font-medium">{property.agentPhoneNumber}</span>
          </div>
          <button
            type="button"
            onClick={() => onBook(property.id)}
            disabled={isBooked}
            className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-white text-sm font-medium transition ${isBooked ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isBooked ? 'Booked' : 'Book'}
          </button>
        </div>
      </div>
    </div>
  );
}
