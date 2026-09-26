import React from 'react';

const flattenValues = (options, optgroup) =>
  (optgroup ? options.flatMap((group) => group.options) : options).map((option) => String(option.value));

const SelectInput = ({ label, description, id, name, value, onChange, options, optgroup, className, isRequired, error, placeholder }) => {
  // A controlled <select> whose value matches no <option> silently displays the first one while the
  // state stays different (e.g. an empty value, or a free-text role saved by resume import).
  // Show a placeholder for empty values and keep unknown saved values visible as their own option.
  const currentValue = value === undefined || value === null ? '' : String(value);
  const hasValue = currentValue !== '' && !flattenValues(options, optgroup).includes(currentValue);

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
        value={currentValue}
        onChange={onChange}
        className={`w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-primary transition duration-200 bg-background text-text-primary ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary'
        }`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {hasValue && <option value={currentValue}>{currentValue}</option>}
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