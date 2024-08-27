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

        {userDetails ? (
          <ul className="userCard__list">
            <li title="User name">{userDetails.name || "-"}</li>
            <li title="User email">{userDetails.email || "-"}</li>
            <li
              title={`User wallet address${userDetails.walletAddressLabel ? ` - User wallet address name = ${userDetails.walletAddressLabel}` : ""}`}
            >
              {userDetails?.walletAddress || "-".repeat(43)}
            </li>
            <li title="User auth provider">
              {userDetails.authProvider || "-"}
            </li>
          </ul>
        ) : (
          <ul className="userCard__list">
            <li title="User name">-</li>
            <li title="User email">-</li>
            <li title="User wallet address">{"-".repeat(43)}</li>
            <li title="User auth provider">-</li>
          </ul>
        )}

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
