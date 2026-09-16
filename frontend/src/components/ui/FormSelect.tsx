import type { ChangeEvent } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
}

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
}: FormSelectProps) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-gray-700 font-medium">{label}</label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="
          bg-white border border-gray-300 rounded-lg px-4 py-2
          focus:outline-none focus:ring-2 focus:ring-brand-primary
          shadow-soft
        "
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
