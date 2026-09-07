import React from 'react';

const SelectInput = ({ label, description, id, value, onChange, options, optgroup, className, isRequired, error }) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-2">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {description && (
        <p className="text-sm text-gray-500 mb-2">{description}</p>
      )}
      <select
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-primary transition duration-200 bg-background text-text-primary ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary'
        }`}
      >
        {optgroup ? (
          options.map((group, groupIndex) => (
            <optgroup key={groupIndex} label={group.label}>
              {group.options.map((option, optionIndex) => (
                <option key={optionIndex} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))
        ) : (
          options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))
        )}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default SelectInput;