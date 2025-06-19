export function logWalletInfo(wallet) {
  if (!wallet) return;

  console.group(`${wallet.walletName} @ ${wallet.walletVersion}`);

  Object.entries(wallet?.config || {}).forEach(([key, value]) => {
    console.log(` ${key.padStart(29)} = ${value}`);
  });

  console.groupEnd();
}
