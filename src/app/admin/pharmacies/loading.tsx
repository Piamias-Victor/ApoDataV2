// src/app/admin/pharmacies/loading.tsx
import React from 'react';

/**
 * Loading state pour la page des pharmacies
 */
export default function PharmaciesLoading() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-96" />
        </div>
        
        {/* Search bar skeleton */}
        <div className="mb-6 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg w-full max-w-md" />
        </div>
        
        {/* Table skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-100 border-b border-gray-200" />
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-white border-b border-gray-100">
                <div className="flex items-center px-6 py-4 space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/6" />
                  <div className="h-4 bg-gray-200 rounded w-1/5" />
                  <div className="h-4 bg-gray-200 rounded w-1/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Pagination skeleton */}
        <div className="mt-6 flex justify-center animate-pulse">
          <div className="flex space-x-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-10 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}