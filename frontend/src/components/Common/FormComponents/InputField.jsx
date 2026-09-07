import React from 'react';

const InputField = ({ label, id, name, value, onChange, placeholder, isRequired, className, error, type = "text", description }) => {
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
      <input
        type={type}
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={isRequired}
        className={`w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-primary transition duration-200 bg-background text-text-primary placeholder-text-secondary/60 ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary'
        }`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default InputField;