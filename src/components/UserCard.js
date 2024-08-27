export function UserCard({
  userDetails,
  isAuthenticated,
  showDetailsJSON,
  setShowDetailsJSON,
}) {
  let background = "#000";
  let authenticationLabel = "Unknown authentication status";

  if (isAuthenticated) {
    background = "#0B3";
    authenticationLabel = "Authenticated";
  } else {
    background = "#F00";
    authenticationLabel = "Not authenticated";
  }

  return (
    <>
      <div className="userCard__base">
        <img
          className="userCard__img"
          src={userDetails?.picture || "https://othent.io/user.png"}
          alt={userDetails?.name || ""}
        />

        <span
          className="userCard__authIndicator"
          style={{ background }}
          title={authenticationLabel}
        />

        <ul className="userCard__list">
          <li>{userDetails?.name || "-"}</li>
          <li>{userDetails?.email || "-"}</li>
          <li>{userDetails?.walletAddress || "-".repeat(43)}</li>
        </ul>

        <button
          className="userCard__expandButton"
          onClick={() => setShowDetailsJSON((v) => !v)}
          aria-expanded={showDetailsJSON ? "true" : "false"}
        >
          {showDetailsJSON ? "×" : "🩻"}
        </button>
      </div>

      {showDetailsJSON && userDetails && (
        <pre className="userCard__code">
          {JSON.stringify(userDetails, null, "  ")}
        </pre>
      )}
    </>
  );
}
