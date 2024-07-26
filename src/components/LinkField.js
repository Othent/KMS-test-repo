export function LinkField({ label, value, hasError }) {
  return (
    <div className="input__base">
      <a
        className="input__input"
        href={value}
        target="_blank"
        rel="noreferrer noopener"
      >
        {value}
      </a>
    </div>
  );
}
