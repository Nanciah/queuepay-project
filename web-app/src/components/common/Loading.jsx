import React from 'react';

const Loading = ({ fullScreen = true, size = 'md' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizes[size]} border-4 border-indigo-600 border-t-transparent rounded-full animate-spin`} />
      <p className="text-gray-500 animate-pulse">Chargement...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;