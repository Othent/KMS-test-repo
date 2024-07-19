export function TestButton({ name, status, elapsed, onClick }) {
  let className = "testButton__base";
  let color = "#CCC";

  if (status === "loading") {
    className += " testButton--isLoading";
    color = "#000";
  } else if (status === "ok") {
    color = "#0B3";
  } else if (status === "error") {
    color = "#F00";
  }

  return (
    <button className={className} onClick={onClick}>
      <span className="testButton__indicator" style={{ color }}>
        ●
      </span>
      <span className="testButton__text">{name}</span>
    </button>
  );
}
