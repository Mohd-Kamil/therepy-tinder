'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export default function Button({
  variant = 'primary',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle =
    'relative flex items-center justify-center font-medium rounded-full px-6 py-3.5 text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 select-none disabled:opacity-50 disabled:cursor-not-allowed w-full';

  const variants = {
    primary:
      'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-600/10 active:bg-purple-800',
    secondary:
      'bg-indigo-50 text-indigo-950 hover:bg-indigo-100 border border-indigo-100 active:bg-indigo-200',
    outline:
      'bg-transparent text-purple-600 border border-purple-200 hover:bg-purple-50 active:bg-purple-100',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.015 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
