import { replacer } from "../utils/replacer";

export function LogItem({
  name,
  status,
  elapsed,
  timestamp,
  result,
  resultString,
  isValid,
  transactionURL,
}) {
  let rootClassName = "logItem__base";
  let resultClassName = "logItem__result";

  let color = "#CCC";

  if (status === "loading") {
    rootClassName += " logItem--isLoading";
    color = "#000";
  } else if (status === "ok") {
    color = "#0B3";
  } else if (status === "error") {
    color = "#F00";
  }

  const resultStr = JSON.stringify(result, replacer, "  ") || "...";
  const resultStringStr = JSON.stringify(resultString, replacer, "  ");

  if (
    result instanceof Buffer ||
    result instanceof DataView ||
    ArrayBuffer.isView(result) ||
    result instanceof ArrayBuffer
  ) {
    resultClassName += " logItem--expand";
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(resultStr);
  };

  return (
    <li className={rootClassName}>
      <div className="logItem__header">
        <span className="logItem__indicator" style={{ color }}>
          ●
        </span>

        <span className="logItem__text">{name}</span>

        {transactionURL ? (
          <a
            className="logItem__txLink"
            href={transactionURL}
            target="_blank"
            rel="noreferrer noopener"
          >
            Tx
          </a>
        ) : null}

        {result ? (
          <button
            className="logItem__copy"
            onClick={handleCopy}
            title="Copy result"
          >
            📄
          </button>
        ) : null}

        {typeof elapsed === "number" ? (
          <span className="logItem__elapsed" title="Last run's execution time">
            {(elapsed / 1000).toFixed()}
          </span>
        ) : null}
      </div>
      <pre className={resultClassName}>{resultStr}</pre>
      {resultStringStr ? (
        <pre className="logItem__result logItem--expand">{resultStringStr}</pre>
      ) : null}
    </li>
  );
}
