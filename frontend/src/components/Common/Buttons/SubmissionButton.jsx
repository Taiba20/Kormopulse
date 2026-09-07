import React from "react";

function SubmissionButton({ color, label, onClick, type, className }) {
  const buttonStyle = `p-2 px-4 font-medium text-sm rounded-md ${
    color === "white"
      ? "text-[var(--color-text-primary)]"
      : "bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-success)] hover:text-[var(--color-text-primary)]"
  }`;

  return (
    <button type={type} onClick={onClick} className={buttonStyle}>
      {label}
    </button>
  );
}

export default SubmissionButton;
