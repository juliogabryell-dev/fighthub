'use client';

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
  const inputClasses =
    'w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-brand-red/50 outline-none transition-colors placeholder:text-white/25';

  return (
    <div className="flex flex-col gap-0">
      {label && (
        <label
          htmlFor={name}
          className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5"
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
      ) : (
        <input
          id={name}
          name={name}
          type={type}
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
