import React from 'react';

export const Label = ({
  label,
  htmlFor,
  className,
}: {
  label: string;
  htmlFor: string;
  className?: string;
}) => (
  <label
    className={`block text-gray-700 text-sm font-bold mb-2 ${className || ''}`.trim()}
    htmlFor={htmlFor}
  >
    {label}
  </label>
);