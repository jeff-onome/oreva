

import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  containerClassName?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  error,
  containerClassName = '',
  ...props
}) => {
  const errorClasses = 'border-red-500 focus:border-red-500 focus:ring-red-500';
  const defaultClasses = 'border-slate-300 focus:border-primary focus:ring-primary';

  return (
    <div className={containerClassName}>
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${error ? errorClasses : defaultClasses}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default InputField;