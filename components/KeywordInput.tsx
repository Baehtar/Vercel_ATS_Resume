// components/KeywordInput.tsx - combined preset multiselect + custom text input
"use client";

import { splitKeywords, joinKeywords } from "@/lib/resumeUtils";

interface Props {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
}

export default function KeywordInput({ label, value, options, placeholder, onChange }: Props) {
  const current = splitKeywords(value);
  const selectedPresets = current.filter((item) => options.includes(item));
  const customText = current.filter((item) => !options.includes(item)).join(", ");

  const togglePreset = (opt: string) => {
    const isSelected = selectedPresets.includes(opt);
    const nextPresets = isSelected
      ? selectedPresets.filter((p) => p !== opt)
      : [...selectedPresets, opt];
    onChange(joinKeywords(nextPresets, customText));
  };

  const onCustom = (text: string) => {
    onChange(joinKeywords(selectedPresets, text));
  };

  return (
    <div>
      <label className="field-label">{label} presets</label>
      {options.length > 0 ? (
        <div className="chip-select">
          {options.map((opt) => (
            <span
              key={opt}
              className={`chip ${selectedPresets.includes(opt) ? "selected" : ""}`}
              onClick={() => togglePreset(opt)}
            >
              {opt}
            </span>
          ))}
        </div>
      ) : (
        <div className="caption">No presets for this role.</div>
      )}
      <label className="field-label">{label}</label>
      <input
        type="text"
        value={customText}
        placeholder={placeholder}
        onChange={(e) => onCustom(e.target.value)}
      />
    </div>
  );
}
