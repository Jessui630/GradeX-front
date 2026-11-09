export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  placeholder,
  disabled = false,
  inputMode,
}) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        aria-required="true"
        autoComplete={autoComplete}
        disabled={disabled}
        id={id}
        inputMode={inputMode}
        name={id}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
