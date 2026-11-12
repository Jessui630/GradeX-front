import { useState } from 'react'
import { Icon } from './Icon'

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
  disabled = false,
  hint,
  required = true,
  describedBy,
}) {
  const [visible, setVisible] = useState(false)
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-control">
        <input
          aria-describedby={[errorId, hintId, describedBy].filter(Boolean).join(' ') || undefined}
          aria-invalid={Boolean(error)}
          aria-required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          id={id}
          name={id}
          onChange={onChange}
          placeholder={placeholder}
          type={visible ? 'text' : 'password'}
          value={value}
        />
        <button
          aria-controls={id}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="password-toggle"
          onClick={() => setVisible((actual) => !actual)}
          type="button"
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
        </button>
      </div>
      {hint ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
