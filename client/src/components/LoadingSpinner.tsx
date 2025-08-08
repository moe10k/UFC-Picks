import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-ufc-red border-t-transparent rounded-full animate-spin"></div>
        <div className="mt-4 text-center">
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 