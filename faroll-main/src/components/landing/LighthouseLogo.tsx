import React from 'react';

interface LighthouseLogoProps {
    className?: string;
    size?: number;
}

export const LighthouseLogo: React.FC<LighthouseLogoProps> = ({ className, size = 48 }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div
                className="rounded-full overflow-hidden border-2 border-primary/20 bg-white"
                style={{ width: size, height: size }}
            >
                <img
                    src="/logo-farollbr.jpeg"
                    alt="FarollBr Logo"
                    className="w-full h-full object-cover"
                />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">
                Faroll<span className="text-primary-600">Br</span>
            </span>
        </div>
    );
};
