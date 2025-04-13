import React from 'react';
import '../style/label.css';

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
    className={`fcr-label ${className || ''}`.trim()}
    htmlFor={htmlFor}
  >
    {label}
  </label>
);