export function LinkField({ label, value, hasError }) {
  return (
    <div className="input__base">
      <a
        className="input__input"
        href={value}
        aria-invalid={hasError || undefined}
        target="_blank"
      >
        {value}
      </a>
    </div>
  );
}
