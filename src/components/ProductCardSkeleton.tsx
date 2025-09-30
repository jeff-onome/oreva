import React from 'react';
import Skeleton from './Skeleton';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-base rounded-xl shadow-lg overflow-hidden flex flex-col">
      <Skeleton className="w-full h-56" />
      <div className="p-4 flex flex-col flex-grow">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-4 w-1/3 mb-4" />
        <div className="mt-auto flex items-end justify-between">
          <div className="w-1/2">
            <Skeleton className="h-8 w-full mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
