import { useState } from "react";

export function TextField({
  name,
  label,
  placeholder = label,
  defaultValue,
  inputRef,
  encoding,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const InputComponent = isExpanded ? 'textarea' : 'input';

  return (
    <div className="input__base">
      <InputComponent
        className="input__input"
        type="text"
        name={ name }
        placeholder={ placeholder }
        defaultValue={ defaultValue }
        ref={ inputRef }
      />

      {encoding ? (
        <span
          className="input__encoding"
          title="Input's text encoding"
        >
          {encoding}
        </span>
      ) : null}

      <button
        className="input__expandButton"
        title={ `${ isExpanded ? 'Use single-line input' : 'Use multi-line textarea' }` }
        onClick={() => setIsExpanded((v) => !v)}
      >
        {isExpanded ? "×" : "+"}
      </button>
    </div>
  );
}
