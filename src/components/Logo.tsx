
import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

const Logo = ({ variant = 'light', className = '' }: LogoProps) => {
  return (
    <Link 
      to="/" 
      className={`font-bold text-xl flex items-center gap-2 transition-all hover:opacity-90 ${className}`}
    >
      <div className="relative">
        <span className={`text-2xl font-extrabold ${variant === 'light' ? 'text-white' : 'text-navy'}`}>
          Seo
          <span className={`text-blue-bright`}>
            ChatGPT
          </span>
        </span>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-bright rounded-full animate-pulse-slow"></div>
      </div>
    </Link>
  );
};

export default Logo;
