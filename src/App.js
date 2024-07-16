import "./App.css";
import { Othent } from "@othent/kms";
import Arweave from "arweave/web";
import { useState, useEffect, useRef } from "react";

const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  port: 443,
});

// TODO: Add a method onAuthChange to get notified about user data changes or logIn/logOut potentially with cross-tab support.
const othent = new Othent();

function App() {
  const [userDetails, setUserDetails] = useState(null);

  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;

    isInitializedRef.current = true;

    async function initUserDetails() {
      try {
        const initialUserDetails = await othent.connect();

        console.log("initialUserDetails =", initialUserDetails);

        setUserDetails(initialUserDetails);
      } catch (err) {
        console.log("connect() error:", err);
      }
    }

    initUserDetails();
  }, []);

  const handleConnect = async () => {
    const res = await othent.connect();
    console.log("Connect,\n", res);
    setUserDetails(res);
  };

  const handleDisconnect = async () => {
    const res = await othent.disconnect();
    console.log("Disconnect,\n", res);
    setUserDetails(null);
  };

  const handleSign = async () => {
    const transaction = await arweave.createTransaction({
      data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>',
    });
    transaction.addTag("Content-Type", "text/html");
    // TODO: Why are we treating these `analyticsTags` differently?
    const analyticsTags = [{ name: "AppName", value: "Lorimer" }];
    const start = performance.now();
    const res = await othent.sign(transaction, analyticsTags);
    const end = performance.now();
    console.log(`Sign: time taken: ${(end - start) / 1000} seconds,\n`, res);
    const txn = await arweave.transactions.post(transaction);
    console.log(txn);

    setUserDetails(othent.getSyncUserDetails());
  };

  const handleEncrypt = async () => {
    const data = "Encrypt this data please.";
    const res = await othent.encrypt(data);
    console.log("Encrypt,\n", res);

    setUserDetails(othent.getSyncUserDetails());
  };

  const handleDecrypt = async () => {
    const data = "Decrypt this data please.";
    const encryptedData = await othent.encrypt(data);
    const res = await othent.decrypt(encryptedData);
    console.log("Decrypt,\n", res);

    setUserDetails(othent.getSyncUserDetails());
  };

  const handleGetActiveAddress = async () => {
    const res = await othent.getActiveAddress();
    console.log("getActiveAddress() =", res);
  };

  const handleGetActivePublicKey = async () => {
    const res = await othent.getActivePublicKey();
    console.log("getActivePublicKey() =", res);
  };

  const handleGetAllAddresses = async () => {
    const res = await othent.getAllAddresses();
    console.log("getAllAddresses() =", res);
  };

  const handleGetWalletNames = async () => {
    const res = await othent.getWalletNames();
    console.log("getWalletNames()", res);
  };

  const handleGetUserDetails = async () => {
    const res = await othent.getUserDetails();
    console.log("getUserDetails()", res);
  };

  const handleSignature = async () => {
    const start = performance.now();
    const res = await othent.signature("Sign this");
    const end = performance.now();
    console.log(
      `Signature: time taken: ${(end - start) / 1000} seconds,\n`,
      res,
    );

    setUserDetails(othent.getSyncUserDetails());
  };

  const handleDispatch = async () => {
    const transaction = await arweave.createTransaction({
      data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>',
      tags: [
        {
          name: "Content-Type",
          value: "text/html",
        },
        {
          name: "AppName",
          value: "Lorimer",
        },
      ],
    });

    const start = performance.now();
    const res = await othent.dispatch(
      transaction,
      arweave,
      "https://turbo.ardrive.io",
    );
    const end = performance.now();
    console.log(
      `Dispatch: time taken: ${(end - start) / 1000} seconds,\n`,
      res,
    );

    setUserDetails(othent.getSyncUserDetails());
  };

  const handleSignMessage = async () => {
    const data = new TextEncoder().encode(
      "The hash of this msg will be signed.",
    );
    const start = performance.now();
    const res = await othent.signMessage(data);
    const end = performance.now();
    console.log(
      `Sign Message: time taken: ${(end - start) / 1000} seconds,\n`,
      res,
    );

    setUserDetails(othent.getSyncUserDetails());
  };

  const handleVerifyMessage = async () => {
    const data = new TextEncoder().encode(
      "The hash of this msg will be signed.",
    );
    const signedMessage = await othent.signMessage(data);
    const owner = await othent.getActivePublicKey();
    const res = await othent.verifyMessage(data, signedMessage, owner);
    console.log("Signature,\n", res);

    setUserDetails(othent.getSyncUserDetails());
  };

  const handleSignDataItem = async () => {
    const data = "Example data";
    const res = await othent.signDataItem({ data });
    console.log("Sign Data Item,\n", res);

    setUserDetails(othent.getSyncUserDetails());
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
        <button onClick={handleGetAllAddresses}>getAllAddresses</button>
        <button onClick={handleGetWalletNames}>getWalletNames</button>
        <button onClick={handleGetUserDetails}>getUserDetails</button>
        <button onClick={handleSignature}>signature</button>
        <button onClick={handleDispatch}>dispatch</button>
        <button onClick={handleSignMessage}>signMessage</button>
        <button onClick={handleVerifyMessage}>verifyMessage</button>
        <button onClick={handleSignDataItem}>signDataItem</button>
      </div>

      {userDetails && (
        <pre className="code">{JSON.stringify(userDetails, null, "  ")}</pre>
      )}
    </div>
  );
}

export default App;
