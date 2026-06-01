'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

export default function InputField({
  label,
  type = 'text',
  placeholder = '',
  textarea = false,
  value,
  onChange,
  name,
  required = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const inputClasses =
    'w-full bg-theme-text/5 border border-theme-border/10 rounded-lg text-theme-text font-barlow text-sm px-3.5 py-2.5 focus:border-brand-red/50 outline-none transition-colors placeholder:text-theme-text/25';

  return (
    <div className="flex flex-col gap-0">
      {label && (
        <label
          htmlFor={name}
          className="uppercase text-xs tracking-wider text-theme-text/50 font-barlow-condensed font-semibold mb-1.5"
        >
          {label}
        </label>
      )}
      {textarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={3}
          className={`${inputClasses} resize-y`}
        />
      ) : isPassword ? (
        <div className="relative">
          <input
            id={name}
            name={name}
            type={inputType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={`${inputClasses} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text/40 hover:text-theme-text/80 transition-colors"
          >
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
          </button>
        </div>
      ) : (
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={inputClasses}
        />
      )}
    </div>
  );
}
