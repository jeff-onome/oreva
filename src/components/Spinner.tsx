import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div 
      className="flex justify-center items-center h-full w-full p-4"
      role="status"
      aria-live="polite"
    >
      <div className="w-12 h-12 border-4 border-neutral border-t-primary rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;
