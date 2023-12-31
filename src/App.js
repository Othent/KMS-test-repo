import "./App.css";
import {
  connect,
  disconnect,
  sign,
  encrypt,
  decrypt,
  getActiveKey,
  getActivePublicKey,
  getWalletNames,
  signature,
} from "@othent/kms";
import Arweave from "arweave/web";

function App() {
  const arweave = Arweave.init({
    host: 'arweave.net',
    protocol: 'https',
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
    const res = await sign(transaction);
    console.log("Sign,\n", res);
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

  const handleGetActiveKey = async () => {
    const res = await getActiveKey();
    console.log("Get Active Key,\n", res);
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
    const res = await signature("Sign this");
    console.log("Signature,\n", res);
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
        <button onClick={handleGetActiveKey}>getActiveKey</button>
        <button onClick={handleGetActivePublicKey}>getActivePublicKey</button>
        <button onClick={handleGetWalletNames}>getWalletNames</button>
        <button onClick={handleSignature}>signature</button>
      </div>
    </div>
  );
}

export default App;
