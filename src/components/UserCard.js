export function UserCard({ userDetails, showDetailsJSON, setShowDetailsJSON }) {
  return (
    <>
      <div className="userCard__base">
        <img
          className="userCard__img"
          src={userDetails?.picture || "https://othent.io/user.png"}
          alt={userDetails?.name || ""}
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
