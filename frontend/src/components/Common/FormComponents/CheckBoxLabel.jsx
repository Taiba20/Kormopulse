import React from 'react';

const CheckBoxLabel = ({ text }) => {
  if (!text) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-primary font-medium">
      <div className="w-2 h-2 bg-primary rounded-full"></div>
      <span>{text}</span>
    </div>
  );
};

export default CheckBoxLabel;