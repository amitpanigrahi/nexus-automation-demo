import React from 'react';
import { tokens } from '../tokens';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

export function Select({ id, label, value, onChange, options }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.xs }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: tokens.color.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
          border: `1px solid ${tokens.color.borderDefault}`,
          borderRadius: tokens.radii.sm,
          background: tokens.color.surface,
          color: tokens.color.textPrimary,
          fontSize: '0.875rem',
          fontFamily: tokens.font.family,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
