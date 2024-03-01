import "./App.css";
import {
  connect,
  disconnect,
  sign,
  encrypt,
  decrypt,
  getActiveAddress,
  getActivePublicKey,
  getWalletNames,
  signature,
  dispatch,
  signMessage,
  verifyMessage,
  signDataItem,
} from "@othent/kms";
import Arweave from "arweave/web";

function App() {
  const arweave = Arweave.init({
    host: "arweave.net",
    protocol: "https",
    port: 443,
  });

  const handleConnect = async () => {
    const res = await connect();
    console.log("Connect,\n", res);
  };

  const handleDisconnect = async () => {
    const res = await disconnect();
    console.log("Disconnect,\n", res);
  };

  const handleSign = async () => {
    const transaction = await arweave.createTransaction({
      data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>',
    });
    transaction.addTag("Content-Type", "text/html");
    const start = performance.now();
    const res = await sign(transaction);
    const end = performance.now();
    console.log(`Sign: time taken: ${(end - start) / 1000} seconds,\n`, res);
    const txn = await arweave.transactions.post(transaction);
    console.log(txn);
  };

  const handleEncrypt = async () => {
    const data = "Encrypt this data please.";
    const res = await encrypt(data);
    console.log("Encrypt,\n", res);
  };

  const handleDecrypt = async () => {
    const data = "Decrypt this data please.";
    const encryptedData = await encrypt(data);
    const res = await decrypt(encryptedData);
    console.log("Decrypt,\n", res);
  };

  const handleGetActiveAddress = async () => {
    const res = await getActiveAddress();
    console.log("Get Active Address,\n", res);
  };

  const handleGetActivePublicKey = async () => {
    const res = await getActivePublicKey();
    console.log("Get Active Public Key,\n", res);
  };

  const handleGetWalletNames = async () => {
    const res = await getWalletNames();
    console.log("Get Wallet Names,\n", res);
  };

  const handleSignature = async () => {
    const start = performance.now();
    const res = await signature("Sign this");
    const end = performance.now();
    console.log(
      `Signature: time taken: ${(end - start) / 1000} seconds,\n`,
      res,
    );
  };

  const handleDispatch = async () => {
    const transaction = await arweave.createTransaction({
      data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>',
    });
    transaction.addTag("Content-Type", "text/html");
    const start = performance.now();
    const res = await dispatch(
      transaction,
      "https://turbo.ardrive.io",
      arweave,
    );
    const end = performance.now();
    console.log(
      `Dispatch: time taken: ${(end - start) / 1000} seconds,\n`,
      res,
    );
  };

  const handleSignMessage = async () => {
    const data = new TextEncoder().encode(
      "The hash of this msg will be signed.",
    );
    const start = performance.now();
    const res = await signMessage(data);
    const end = performance.now();
    console.log(
      `Sign Message: time taken: ${(end - start) / 1000} seconds,\n`,
      res,
    );
  };

  const handleVerifyMessage = async () => {
    const data = new TextEncoder().encode(
      "The hash of this msg will be signed.",
    );
    const signedMessage = await signMessage(data);
    const owner = await getActivePublicKey();
    const res = await verifyMessage(data, signedMessage, owner);
    console.log("Signature,\n", res);
  };

  const handleSignDataItem = async () => {
    const data = "Example data";
    const res = await signDataItem({data});
    console.log("Sign Data Item,\n", res);
  };

  return (
    <div className="App">
      <div className="column">
        <span className="center">
          <h1>KMS-JS SDK Example</h1>
          <p>(Check development console for data)</p>
        </span>
        <button onClick={handleConnect}>connect</button>
        <button onClick={handleDisconnect}>disconnect</button>
        <button onClick={handleSign}>sign</button>
        <button onClick={handleEncrypt}>encrypt</button>
        <button onClick={handleDecrypt}>decrypt</button>
        <button onClick={handleGetActiveAddress}>getActiveAddress</button>
        <button onClick={handleGetActivePublicKey}>getActivePublicKey</button>
        <button onClick={handleGetWalletNames}>getWalletNames</button>
        <button onClick={handleSignature}>signature</button>
        <button onClick={handleDispatch}>dispatch</button>
        <button onClick={handleSignMessage}>signMessage</button>
        <button onClick={handleVerifyMessage}>verifyMessage</button>
        <button onClick={handleSignDataItem}>signDataItem</button>
      </div>
    </div>
  );
}

export default App;
