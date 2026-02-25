import React from 'react';

interface LighthouseLogoProps {
    className?: string;
    size?: number;
    /** Use on dark backgrounds (e.g. hero) for white/light text */
    light?: boolean;
    /** Use landing palette (moss + clay) when navbar is scrolled */
    landing?: boolean;
}

export const LighthouseLogo: React.FC<LighthouseLogoProps> = ({ className, size = 48, light = false, landing = false }) => {
    const textClass = light ? "text-white" : landing ? "text-landing-moss" : "text-gray-900";
    const accentClass = light ? "text-white/90" : landing ? "text-landing-clay" : "text-primary-600";
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div
                className="rounded-full overflow-hidden border-2 bg-white border-primary/20"
                style={{ width: size, height: size }}
            >
                <img
                    src="/logo-farollbr.jpeg"
                    alt="FarolBR Logo"
                    className="w-full h-full object-cover"
                />
            </div>
            <span className={`text-2xl font-bold tracking-tight ${textClass}`}>
                Faroll<span className={accentClass}>Br</span>
            </span>
        </div>
    );
};
