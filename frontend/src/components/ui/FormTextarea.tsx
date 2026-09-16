import type { ChangeEvent } from "react";

interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}

export default function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder = "",
}: FormTextareaProps) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-gray-700 font-medium">{label}</label>

      <textarea
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="
          bg-white border border-gray-300 rounded-lg px-4 py-2
          focus:outline-none focus:ring-2 focus:ring-brand-primary
          shadow-soft
          min-h-[120px]
        "
      />
    </div>
  );
}
