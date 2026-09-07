import React from 'react';

const Checkbox = ({ label, name, id, checked, onChange }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        id={id}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
      />
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
};

export default Checkbox;