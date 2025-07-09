export function UserCard({
  walletName,
  walletInfo,
  userDetails,
  showDetailsJSON,
  setShowDetailsJSON,
}) {
  // Default "authentication" indicator color/state, used only for the BE which has no authentication:
  let background = "#CCC";
  let authenticationLabel = "Unknown authentication status";

  if (
    userDetails.authProvider &&
    userDetails.authProvider !== "NATIVE_WALLET"
  ) {
    // User is authenticated:
    background = "#0B3";
    authenticationLabel = "Authenticated";
  } else if (walletName && walletName !== "ArConnect") {
    // User is not authenticated:
    background = "#F00";
    authenticationLabel = "Not authenticated";
  }

  let readyEmoji = "🌚";
  let readyTitle = "Not ready";
  let readyClass = "";

  if (walletInfo?.walletReady) {
    readyEmoji = "🌝";
    readyTitle = `Ready`;
    readyClass = "isReady";
  }

  const permissions = walletInfo?.walletPermissions || [];

  let connectionEmoji = "⛓️‍💥";
  let connectionTitle = "Not connected";
  let connectionClass = "";

  if (permissions.length > 0) {
    connectionEmoji = "🔗";
    connectionTitle = `Connected`;
    connectionClass = "isConnected";
  }

  let backupEmoji = "";
  let backupTitle = "";
  let backupClass = "";

  if (
    userDetails.authProvider &&
    userDetails.authProvider !== "NATIVE_WALLET"
  ) {
    const { walletBackupMessage } = walletInfo;

    if (walletBackupMessage || walletBackupMessage === undefined) {
      backupEmoji = "📦";
      backupTitle = walletBackupMessage;
      backupClass = "";
    } else {
      backupEmoji = "🎁";
      backupTitle = walletBackupMessage;
      backupClass = "isBackedUp";
    }
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
          <li title="User name">{userDetails.name || "-"}</li>
          <li title="User email">{userDetails.email || "-"}</li>
          <li title="Wallet alias and wallet count">
            {walletInfo?.walletAlias || "-"}{" "}
            {walletInfo?.walletCount
              ? `(${walletInfo?.walletCount} wallet${walletInfo?.walletCount > 1 ? "s" : ""})`
              : ""}
          </li>
          <li title="Wallet address">
            {walletInfo?.walletAddress || "-".repeat(43)}
          </li>
          <li title="Wallet app name and user auth provider">
            {walletName || "No wallet app"}{" "}
            {userDetails.authProvider ? `(${userDetails.authProvider})` : ""}
            <span
              className={`userCard__readyIndicator ${readyClass}`}
              title={readyTitle}
            >
              {readyEmoji}
            </span>
            <span
              className={`userCard__connectionIndicator ${connectionClass}`}
              title={connectionTitle}
            >
              {connectionEmoji}
            </span>
            {backupEmoji ? (
              <span
                className={`userCard__backupIndicator ${backupClass}`}
                title={backupTitle}
              >
                {backupEmoji}
              </span>
            ) : null}
          </li>
        </ul>

        <button
          className="userCard__expandButton"
          onClick={() => setShowDetailsJSON((v) => !v)}
          aria-expanded={showDetailsJSON ? "true" : "false"}
        >
          {showDetailsJSON ? "×" : "🩻"}
        </button>
      </div>

      {showDetailsJSON && (
        <pre className="userCard__code">
          {JSON.stringify({ walletInfo, userDetails }, null, "  ")}
        </pre>
      )}
    </>
  );
}
