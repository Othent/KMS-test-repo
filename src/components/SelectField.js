export function SelectField({
  name,
  label,
  placeholder = label,
  value,
  defaultValue,
  options = [],
  inputRef,
  hasError,
}) {
  return (
    <div className="input__base">
      <select
        className="input__input"
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        ref={inputRef}
        readOnly={!inputRef}
        aria-invalid={hasError || undefined}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
