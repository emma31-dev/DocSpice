import React from 'react';

interface DocSpiceIconProps {
  size?: number;
  className?: string;
}

export const DocSpiceIcon: React.FC<DocSpiceIconProps> = ({ 
  size = 24, 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="docspice-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: '#8B5CF6', stopOpacity: 1}} />
      </linearGradient>
    </defs>
    
    {/* Document base */}
    <rect x="6" y="4" width="16" height="20" rx="2" fill="url(#docspice-gradient)" opacity="0.1"/>
    <rect x="6" y="4" width="16" height="20" rx="2" fill="none" stroke="url(#docspice-gradient)" strokeWidth="2"/>
    
    {/* Text lines */}
    <line x1="9" y1="9" x2="19" y2="9" stroke="url(#docspice-gradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="12" x2="16" y2="12" stroke="url(#docspice-gradient)" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="15" x2="18" y2="15" stroke="url(#docspice-gradient)" strokeWidth="1.5" strokeLinecap="round"/>
    
    {/* Sparkle/Magic element */}
    <circle cx="24" cy="8" r="1.5" fill="#F59E0B"/>
    <circle cx="26" cy="12" r="1" fill="#EF4444"/>
    <circle cx="22" cy="14" r="0.8" fill="#10B981"/>
    
    {/* Spice dots */}
    <circle cx="25" cy="20" r="1.2" fill="#8B5CF6"/>
    <circle cx="23" cy="22" r="0.8" fill="#3B82F6"/>
  </svg>
);

export const DocSpiceLogo: React.FC<DocSpiceIconProps> = ({ 
  size = 32, 
  className = '' 
}) => (
  <div className={`inline-flex items-center gap-3 ${className}`}>
    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
      <DocSpiceIcon size={size} className="text-white" />
    </div>
    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      DocSpice
    </span>
  </div>
);

export default DocSpiceIcon;