import type { ChangeEvent, ReactNode } from "react";

interface FormInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

export default function FormInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}: FormInputProps) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-gray-700 font-medium">{label}</label>

      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={onChange}
        className="
          bg-white border border-gray-300 rounded-lg px-4 py-2
          focus:outline-none focus:ring-2 focus:ring-brand-primary
          shadow-soft
        "
      />
    </div>
  );
}
