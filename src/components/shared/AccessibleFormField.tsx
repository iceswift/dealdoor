// src/components/shared/AccessibleFormField.tsx

import { generateId } from '../../lib/accessibility';

interface AccessibleFormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export default function AccessibleFormField({
  label,
  error,
  required = false,
  hint,
  children,
  className = '',
}: AccessibleFormFieldProps) {
  const id = generateId('field');
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-secondary">
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">*</span>
        )}
        {required && <span className="sr-only"> (จำเป็น)</span>}
      </label>

      {hint && (
        <p id={hintId} className="mt-1 text-xs text-text-tertiary">
          {hint}
        </p>
      )}

      <div className="mt-1">
        {/* Clone children with accessibility attributes */}
        {typeof children === 'object' && children !== null && 'type' in children
          ? {
              ...children,
              props: {
                ...children.props,
                id,
                'aria-required': required || undefined,
                'aria-invalid': error ? true : undefined,
                'aria-describedby': [
                  hint ? hintId : undefined,
                  error ? errorId : undefined,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined,
              },
            }
          : children}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
