import "./App.css";
import { Othent } from "@othent/kms";
import Arweave from "arweave/web";
import { useState, useEffect, useRef } from "react";
import { DataItem } from "warp-arbundles";

const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  port: 443,
});

// TODO: Add a method onAuthChange to get notified about user data changes or logIn/logOut potentially with cross-tab support.
// TODO: Add an option to globally add our own tags?
const othent = new Othent();

function App() {
  const [userDetails, setUserDetails] = useState(null);
  const [results, setResults] = useState({});
  const [usePlainText, setUsePlainText] = useState(true);

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

  function getHandler(fn, options) {
    const { name } = options;

    return async () => {
      console.log(`${name}...`);

      try {
        const start = performance.now();
        const returnValue = await fn();
        const end = performance.now();

        console.log(
          `${name} (~${((end - start) / 1000).toFixed(1)}s) =`,
          returnValue,
        );

        setResults((prevResults) => ({ ...prevResults, [name]: returnValue }));
      } catch (err) {
        console.error(err);

        setResults((prevResults) => ({ ...prevResults, [name]: { err } }));
      }

      setUserDetails(othent.getSyncUserDetails());
    };
  }

  // CONNECT / DISCONNECT:

  const handleConnect = getHandler(
    async () => {
      const result = await othent.connect();

      return { result };
    },
    { name: "connect" },
  );

  const handleDisconnect = getHandler(
    async () => {
      const result = await othent.disconnect();

      return { result };
    },
    { name: "disconnect" },
  );

  // GET DATA (ASYNC):

  const handleGetActiveAddress = getHandler(
    async () => {
      const result = await othent.getActiveAddress();
      return { result };
    },
    { name: "getActiveAddress" },
  );

  const handleGetActivePublicKey = getHandler(
    async () => {
      const result = await othent.getActivePublicKey();
      return { result };
    },
    { name: "getActivePublicKey" },
  );

  const handleGetAllAddresses = getHandler(
    async () => {
      const result = await othent.getAllAddresses();
      return { result };
    },
    { name: "getAllAddresses" },
  );

  const handleGetWalletNames = getHandler(
    async () => {
      const result = await othent.getWalletNames();
      return { result };
    },
    { name: "getWalletNames" },
  );

  const handleGetUserDetails = getHandler(
    async () => {
      const result = await othent.getUserDetails();
      return { result };
    },
    { name: "getUserDetails" },
  );

  // GET DATA (SYNC):

  // TODO:

  // TX:

  const handleDispatch = getHandler(
    async () => {
      const transaction = await arweave.createTransaction({
        data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>',
        tags: [
          {
            name: "Content-Type",
            value: "text/html",
          },
          {
            name: "AppName",
            value: "Othent Test Repo",
          },
        ],
      });

      const result = await othent.dispatch(
        transaction,
        // TODO: Make this optional in the SDK
        arweave,
        "https://turbo.ardrive.io",
      );

      return { result };
    },
    { name: "dispatch" },
  );

  // ENCRYPT/DECRYPT:

  const handleSign = getHandler(
    async () => {
      const transaction = await arweave.createTransaction({
        data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>',
        tags: [
          {
            name: "Content-Type",
            value: "text/html",
          },
          {
            name: "AppName",
            value: "Othent Test Repo",
          },
        ],
      });

      const result = await othent.sign(transaction);

      // const txn = await arweave.transactions.post(transaction);

      const isValid = await arweave.transactions.verify(transaction);

      return {
        result,
        isValid,
      };
    },
    { name: "sign" },
  );

  const handleEncrypt = getHandler(
    async () => {
      // TODO: The TextEncoder version doesn't work with the old backend and SDK, but it does with the old backed and new SDK.
      // const data = { type: 'Buffer', data };

      const plaintext = usePlainText
        ? "Encrypt this text, please."
        : new TextEncoder().encode("Encrypt this data, please.");

      const result = await othent.encrypt(plaintext);

      return { result, plaintext };
    },
    { name: "encrypt" },
  );

  const handleDecrypt = getHandler(
    async () => {
      const plaintext = usePlainText
        ? "Decrypt this text, please."
        : new TextEncoder().encode("Decrypt this data, please.");

      const encryptReturn = await othent.encrypt(plaintext);

      // TODO: Transform encryptReturn if usePlainText:
      // const ciphertext = usePlainText
      //   ? new TextDecoder().decode(encryptReturn)
      //   : encryptReturn;

      const ciphertext = encryptReturn;

      const result = await othent.decrypt(ciphertext);

      // const res = await othent.decrypt({
      //   type: 'Buffer',
      //   data: Array.from(encryptedData),
      // });

      return { result, plaintext, ciphertext };
    },
    { name: "decrypt" },
  );

  // SIGN:

  const handleSignature = getHandler(
    async () => {
      const dataToSign = usePlainText
        ? "Sign this text, please."
        : new TextEncoder().encode("Sign this data, please.");

      const result = await othent.signature(dataToSign);

      // TODO: Verify signature...

      return { result };
    },
    { name: "signature" },
  );

  const handleSignDataItem = getHandler(
    async () => {
      const data = "DataItem's data";
      const result = await othent.signDataItem({ data });
      const dataItem = new DataItem(result);

      const isValid = await dataItem.isValid().catch((err) => {
        console.log("DataItem.isValid() error =", err);

        return false;
      });

      // TODO: Transform result if usePlainText

      return { result, isValid };
    },
    { name: "signDataItem" },
  );

  const handleSignMessage = getHandler(
    async () => {
      // TODO: The TextEncoder version doesn't work with the old backend and SDK, but it does with the old backed and new SDK.

      const data = usePlainText
        ? "The hash of this text will be signed."
        : new TextEncoder().encode("The hash of this data will be signed.");

      const result = await othent.signMessage(data);

      // TODO: Transform result if usePlainText

      return { result, data };
    },
    { name: "signMessage" },
  );

  const handleVerifyMessage = getHandler(
    async () => {
      // TODO: The TextEncoder version doesn't work with the old backend and SDK, but it does with the old backed and new SDK.

      const data = usePlainText
        ? "The hash of this text will be signed."
        : new TextEncoder().encode("The hash of this data will be signed.");

      const signedData = await othent.signMessage(data);
      const result = await othent.verifyMessage(data, signedData);

      // TODO: Transform result if usePlainText

      return { result, data, signedData };
    },
    { name: "verifyMessage" },
  );

  const handlePrivateHash = getHandler(
    async () => {
      const result = await othent.privateHash();

      return { result };
    },
    { name: "privateHash" },
  );

  return (
    <div className="App">
      <div className="column">
        <span className="center">
          <h1>KMS-JS SDK Example</h1>
          <p>(Check development console for data)</p>
        </span>
        <button onClick={handleConnect}>connect</button>
        <button onClick={handleDisconnect}>disconnect</button>
        <button onClick={handleGetActiveAddress}>getActiveAddress</button>
        <button onClick={handleGetActivePublicKey}>getActivePublicKey</button>
        <button onClick={handleGetAllAddresses}>getAllAddresses</button>
        <button onClick={handleGetWalletNames}>getWalletNames</button>
        <button onClick={handleGetUserDetails}>getUserDetails</button>
        <button onClick={handleSign}>sign</button>
        <button onClick={handleDispatch}>dispatch</button>
        <button onClick={handleEncrypt}>encrypt</button>
        <button onClick={handleDecrypt}>decrypt</button>
        <button onClick={handleSignature}>signature</button>
        <button onClick={handleSignDataItem}>signDataItem</button>
        <button onClick={handleSignMessage}>signMessage</button>
        <button onClick={handleVerifyMessage}>verifyMessage</button>
        <button onClick={handlePrivateHash}>privateHash</button>
      </div>

      {userDetails && (
        <pre className="code">{JSON.stringify(userDetails, null, "  ")}</pre>
      )}
    </div>
  );
}

export default App;
