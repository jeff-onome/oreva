import React from 'react';
import { User } from 'lucide-react';

const AvatarPlaceholder: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`flex items-center justify-center bg-slate-200 text-slate-500 ${className}`} aria-label="Default user avatar">
            <User size="60%" />
        </div>
    );
};

export default AvatarPlaceholder;
