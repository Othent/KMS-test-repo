export function SelectField({
  name,
  label,
  placeholder = label,
  defaultValue,
  options = [],
  inputRef,
}) {
  return (
    <div className="input__base">
      <select
        className="input__input"
        name={ name }
        placeholder={ placeholder }
        defaultValue={ defaultValue }
        ref={ inputRef }>
        { options.map((option) => (
          <option key={ option }>{ option }</option>
        )) }
      </select>
    </div>
  );
}
