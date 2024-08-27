import { useState } from "react";

export function TestButton({ name, status, elapsed, onClick, children }) {
  const [isExpanded, setIsExpanded] = useState(false);

  let rootClassName = "testButton__base";

  if (isExpanded) {
    rootClassName += " testButton--isExpanded";
  }

  let buttonClassName = "testButton__button";
  let color = "#CCC";

  if (status === "loading") {
    buttonClassName += " testButton--isLoading";
    color = "#000";
  } else if (status === "ok") {
    color = "#0B3";
  } else if (status === "error") {
    color = "#F00";
  }

  return (
    <div className={rootClassName}>
      <div className="testButton__buttonWrapper">
        <button className={buttonClassName} onClick={onClick}>
          <span className="testButton__indicator" style={{ color }}>
            ●
          </span>

          <span className="testButton__text">{name}</span>
        </button>

        {typeof elapsed === "number" ? (
          <span
            className="testButton__elapsed"
            title="Last run's execution time"
          >
            {(elapsed / 1000).toFixed()}
          </span>
        ) : null}

        {!!children ? (
          <button
            className="testButton__expandButton"
            title={ `${ isExpanded ? 'Open' : 'Close' } function's inputs and outputs` }
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? "×" : "+"}
          </button>
        ) : null}
      </div>

      {isExpanded ? (
        <div className="testButton__content">{children}</div>
      ) : null}
    </div>
  );
}
