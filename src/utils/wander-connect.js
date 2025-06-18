export function isWanderConnectBrowserWalletEnabled() {
  return (
    localStorage.getItem("WANDER_CONNECT_BROWSER_WALLET_ENABLED") === "true"
  );
}
