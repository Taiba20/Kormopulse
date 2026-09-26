import React from "react";
import SubmissionButton from "../Buttons/SubmissionButton";
import { useI18n } from "../../../i18n/I18nContext";

function DynamicInputForm({
  label,
  description,
  placeholder,
  name,
  values,
  handleInputChange,
}) {
  const { t } = useI18n();
  const handleAddFields = () => {
    handleInputChange(name, values.length, { target: { value: "" } });
  };

  const handleRemoveFields = (index) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    handleInputChange(name, index, newValues);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className=" font-medium my-2">{label}</label>
      {description && (
        <span className="text-gray-500 text-sm ml-1.5 mb-2">{description}</span>
      )}
      <div className="space-y-3">
        {values.map((value, index) => (
          <div key={index} className="flex items-center space-x-3">
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(event) => handleInputChange(name, index, event)}
              className="flex-grow px-2 py-2 border rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <SubmissionButton
              color="white"
              label={t("posting.dynamic.remove")}
              onClick={() => handleRemoveFields(index)}
              type="button"
            />
          </div>
        ))}
        <SubmissionButton
          color="black"
          label={t("posting.dynamic.add")}
          onClick={handleAddFields}
          type="button"
        />
      </div>
    </div>
  );
}

export default DynamicInputForm;
