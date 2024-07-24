import { b64ToUint8Array, Othent, uint8ArrayTob64Url } from "@othent/kms";
import Arweave from "arweave";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DataItem } from "warp-arbundles";
import { TestButton } from "./components/TestButton";
import { UserCard } from "./components/UserCard";

import "./App.css";

const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  port: 443,
});

function replacer(_, value) {
  let uint8Array;

  if (
    value instanceof Buffer ||
    value instanceof DataView ||
    ArrayBuffer.isView(value)
  ) {
    uint8Array = new Uint8Array(value.buffer);
  } else if (value instanceof ArrayBuffer) {
    uint8Array = new Uint8Array(value);
  } else {
    return value;
  }

  return uint8ArrayTob64Url(uint8Array);
}

const DEV_OTHENT_CONFIG = {
  auth0Domain: "gmzcodes-test.eu.auth0.com",
  auth0ClientId: "RSEz2IKqExKJTMqJ1crVSqjBT12ZgsfW",
  auth0Strategy: "refresh-localstorage",
  serverBaseURL: "http://localhost:3010",
};

const DEFAULT_TX_DATA = `<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>`;
const DEFAULT_TX_DATA_TYPE = "text/html";
const DEFAULT_SECRET = "This is a very secret message... 🤫";
const DEFAULT_DATA_FOR_SIGNING = "This data needs to be signed... ✅";
const DEFAULT_DATA_FOR_HASHING = "This data needs to be hashed... 🗜️";

window.uint8ArrayTob64Url = uint8ArrayTob64Url;

function App() {
  const inputsRef = useRef({});

  const assignRef = useCallback((inputElement) => {
    if (inputElement) inputsRef.current[inputElement.name] = inputElement;
  }, []);

  const [showDetailsJSON, setShowDetailsJSON] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [results, setResults] = useState({});

  const sortedResults = useMemo(() => {
    const sortedResultsArray = Object.values(results).sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    return sortedResultsArray.length === 0 ? [{}] : sortedResultsArray;
  }, [results]);

  const [
    {
      // OLD BACKEND + OLD SDK: Works with `string` inputs, doesn't work with `TextEncoder` inputs
      // OLD BACKEND + NEW SDK: Works with `string` inputs, works with `TextEncoder` inputs.
      useStrings,
      postTransactions,
      env,
      auth0Strategy,
      autoConnect,
      throwErrors,
      persistCookie,
      persistLocalStorage,
    },
    // TODO: Add UI for settings:
    setSettings,
  ] = useState({
    useStrings: false,
    postTransactions: false,
    env: "production",
    auth0Strategy: "refresh-localstorage",
    autoConnect: "lazy",
    throwErrors: true,
    persistCookie: false,
    persistLocalStorage: true,
  });

  const normalizeInput = (dataStr) => {
    return useStrings
      ? dataStr
      : new TextEncoder().encode(dataStr);
  }

  const othent = useMemo(() => {
    return new Othent({
      ...(env === "dev" ? DEV_OTHENT_CONFIG : {}),
      auth0Strategy,
      autoConnect,
      throwErrors,
      appName: "Othent KMS Test Repo",
      appVersion: Othent.walletVersion,
      persistCookie,
      persistLocalStorage,
    });
  }, [
    env,
    auth0Strategy,
    autoConnect,
    throwErrors,
    persistCookie,
    persistLocalStorage,
  ]);

  // These `useRef` and `useEffect` are here to re-connect automatically, when `othent` changes while running the
  // project in DEV mode with hot reloading. It also makes sure only one of the two instances of `Othent` that will
  // be created, due to React running in Development mode, is actually listening for `storage` events.

  const hasLoggedInRef = useRef(false);

  useEffect(() => {
    const cleanupFn = othent.init();

    if (!hasLoggedInRef.current) return;

    setUserDetails(null);

    async function reconnectOnHotReload() {
      console.groupCollapsed(`Reconnecting due to hot reloading...`);

      try {
        // This won't work if `auth0Strategy = "refresh-memory"`.

        await othent.connect();
      } catch (err) {
        console.log("connect() error:", err);
      }

      console.groupEnd();
    }

    reconnectOnHotReload();

    return cleanupFn;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [othent]);

  // We need to use `useCallback` here as React will call the `useEffect` below twice in development mode, and we don't
  // want to add duplicate event listeners. However, if we define the listener function inside `useEffect`, two
  // different instances will be created an the `EventListenerHandler` won't be able to see they are the same.

  const handleAuthChange = useCallback((userDetails, isAuthenticated) => {
    console.log("onAuthChange =", { userDetails, isAuthenticated });

    // This is only here due to hot reloading in development:
    hasLoggedInRef.current = hasLoggedInRef.current || isAuthenticated;

    setUserDetails(userDetails);
  }, []);

  const handleError = useCallback((error) => {
    console.error("onError =", error);
  }, []);

  useEffect(() => {
    const removeAuthEventListener = othent.addEventListener(
      "auth",
      handleAuthChange,
    );

    const removeErrorEventListener = throwErrors
      ? () => {
          /* NOOP */
        }
      : othent.addEventListener("error", handleError);

    return () => {
      removeAuthEventListener();
      removeErrorEventListener();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [othent, throwErrors]);

  function getHandler(fn, options) {
    const { name } = options;

    return async () => {
      setResults((prevResults) => ({
        ...prevResults,
        [name]: {
          name,
          status: "loading",
          elapsed: undefined,
          timestamp: Date.now(),
          ...prevResults[name],
        },
      }));

      console.group(`${name}...`);

      const start = performance.now();

      try {
        const returnValue = await fn();
        const elapsed = performance.now() - start;

        console.log(`${name} (${(elapsed / 1000).toFixed(1)}s) =`, returnValue);

        setResults((prevResults) => ({
          ...prevResults,
          [name]: {
            name,
            status:
              returnValue.isValid ?? !!returnValue.result ? "ok" : "error",
            elapsed,
            timestamp: Date.now(),
            ...returnValue,
          },
        }));
      } catch (err) {
        const elapsed = performance.now() - start;

        console.error(`${name} (${(elapsed / 1000).toFixed(1)}s) =\n`, err);

        setResults((prevResults) => ({
          ...prevResults,
          [name]: {
            err,
            name,
            status: "error",
            elapsed,
            timestamp: Date.now(),
          },
        }));
      }

      console.groupEnd();
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

      return { result, isValid: true };
    },
    { name: "disconnect" },
  );

  const handleRequireAuth = getHandler(
    async () => {
      const result = await othent.requireAuth();

      return { result, isValid: true };
    },
    { name: "requireAuth" },
  );

  const handleIsAuthenticated = getHandler(
    async () => {
      const result = othent.isAuthenticated;

      return { result, isValid: typeof result === "boolean" };
    },
    { name: "isAuthenticated" },
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

  // TX:

  const handleSign = getHandler(
    async () => {
      const transaction = await arweave.createTransaction({
        data: inputsRef.current.signData?.value || DEFAULT_TX_DATA,
      });

      transaction.addTag("Content-Type", inputsRef.current.signType?.value || DEFAULT_TX_DATA_TYPE);

      const result = await othent.sign(transaction);

      let postResult = null;

      if (postTransactions) {
        postResult = await arweave.transactions.post(transaction);
      }

      const isValid = await arweave.transactions.verify(transaction);

      return {
        result: "<SignedTransaction>",
        postResult,
        isValid,
      };
    },
    { name: "sign" },
  );

  const handleDispatch = getHandler(
    async () => {
      const transaction = await arweave.createTransaction({
        data: inputsRef.current.dispatchData?.value || DEFAULT_TX_DATA,
      });

      transaction.addTag("Content-Type", inputsRef.current.dispatchType?.value || DEFAULT_TX_DATA_TYPE);

      const result = await othent.dispatch(transaction);
      const transactionURL = `https://viewblock.io/arweave/tx/${result.id}`;

      return { result, transactionURL };
    },
    { name: "dispatch" },
  );

  // ENCRYPT/DECRYPT:

  const handleEncrypt = getHandler(
    async () => {
      const dataStr = inputsRef.current.encryptPlaintext?.value || DEFAULT_SECRET;
      const plaintext = normalizeInput(dataStr);
      const result = await othent.encrypt(plaintext);

      return { result, input: plaintext };
    },
    { name: "encrypt" },
  );

  const handleDecrypt = getHandler(
    async () => {
      const dataStr = inputsRef.current.encryptPlaintext?.value || DEFAULT_SECRET;
      const plaintext = normalizeInput(dataStr);

      const b64Ciphertext = inputsRef.current.decryptCiphertext?.value || "";
      const encryptedData = b64Ciphertext ? b64ToUint8Array(b64Ciphertext) : await othent.encrypt(plaintext);

      // For now, decrypt() doesn't support `string` as input. Later, we can make it so that we can pass a B64UrlEncoded
      // (not a regular one) `string` directly:
      // const ciphertext = useStrings
      //   ? uint8ArrayTob64Url(encryptReturn)
      //   : encryptReturn;

      const result = await othent.decrypt(encryptedData);

      // Assuming we haven't changed the input field in for `encrypt()` or took the encrypted value from somewhere else:
      const isValid = result === dataStr;

      return { result, isValid, input: encryptedData };
    },
    { name: "decrypt" },
  );

  // SIGN:

  const handleSignature = getHandler(
    async () => {
      const dataStr = inputsRef.current.signatureData?.value || DEFAULT_DATA_FOR_SIGNING;
      const data = normalizeInput(dataStr);
      const result = await othent.signature(data);

      // This won't work.
      // TODO: Do we need to "re-implement" most of `verifyMessage()` in userland to verify?
      // const isValid = await othent.verifyMessage(dataToSign, result);

      return { result, input: data };
    },
    { name: "signature" },
  );

  const handleSignDataItem = getHandler(
    async () => {
      const dataStr = inputsRef.current.signDataItemData?.value || DEFAULT_DATA_FOR_SIGNING;
      const result = await othent.signDataItem({ data: dataStr });
      const dataItem = new DataItem(Buffer.from(result));

      // TODO: Not working:
      const isValid = await dataItem.isValid().catch((err) => {
        console.error("DataItem.isValid() error =", err);

        return false;
      });

      return { result, isValid, input: dataStr };
    },
    { name: "signDataItem" },
  );

  const handleSignMessage = getHandler(
    async () => {
      const dataStr = inputsRef.current.signMessageData?.value || DEFAULT_DATA_FOR_SIGNING;
      const data = normalizeInput(dataStr);
      const result = await othent.signMessage(data);

      return { result, input: data };
    },
    { name: "signMessage" },
  );

  const handleVerifyMessage = getHandler(
    async () => {
      const dataStr = inputsRef.current.verifyMessageData?.value || DEFAULT_DATA_FOR_SIGNING;
      const data = normalizeInput(dataStr);

      const b64Signature = inputsRef.current.verifyMessageSignature?.value || "";
      const signedData = b64Signature ? b64ToUint8Array(b64Signature) : await othent.signMessage(data);

      const result = await othent.verifyMessage(data, signedData);

      return { result, isValid: result, input: [data, signedData] };
    },
    { name: "verifyMessage" },
  );

  const handlePrivateHash = getHandler(
    async () => {
      const dataStr = inputsRef.current.privateHashData?.value || DEFAULT_DATA_FOR_HASHING;
      const data = normalizeInput(dataStr);
      const result = await othent.privateHash(data);

      return { result, input: data };
    },
    { name: "privateHash" },
  );

  // MISC.:

  const handleWalletName = getHandler(
    async () => {
      const result = othent.walletName;

      return { result };
    },
    { name: "walletName" },
  );

  const handleWalletVersion = getHandler(
    async () => {
      const result = othent.walletVersion;

      return { result };
    },
    { name: "walletVersion" },
  );

  const handleConfig = getHandler(
    async () => {
      const result = othent.config;

      return { result };
    },
    { name: "config" },
  );

  const handleGetArweaveConfig = getHandler(
    async () => {
      const result = await othent.getArweaveConfig();

      return { result };
    },
    { name: "getArweaveConfig" },
  );

  const handleGetPermissions = getHandler(
    async () => {
      const result = await othent.getPermissions();

      return { result };
    },
    { name: "getPermissions" },
  );

  // AUTO-TEST WIZARD:

  const handleTestAll = async () => {
    const methodsUnderTest = [
      handleConnect,
      handleRequireAuth,
      handleIsAuthenticated,
      handleGetActiveAddress,
      handleGetActivePublicKey,
      handleGetAllAddresses,
      handleGetWalletNames,
      handleGetUserDetails,
      // handleGetSyncActiveAddress,
      // handleGetSyncActivePublicKey,
      // handleGetSyncAllAddresses,
      // handleGetSyncWalletNames,
      // handleGetSyncUserDetails,
      handleSign,
      handleDispatch,
      handleEncrypt,
      handleDecrypt,
      handleSignature,
      handleSignDataItem,
      handleSignMessage,
      handleVerifyMessage,
      handlePrivateHash,
      handleWalletName,
      handleWalletVersion,
      handleConfig,
      handleGetArweaveConfig,
      handleGetPermissions,
    ];

    for (const methodFn of methodsUnderTest) {
      await methodFn();
    }
  };

  return (
    <div className="app">
      <header className="header__base">
        <h1 className="header__title">Othent KMS JS SDK Demo</h1>
        <p>Check the DevTools Console for additional information.</p>
        <UserCard
          userDetails={userDetails}
          showDetailsJSON={showDetailsJSON}
          setShowDetailsJSON={setShowDetailsJSON}
        />

        <button className="header__testAllButton" onClick={handleTestAll}>
          🧙‍♂️
        </button>
        <button
          className="header__settingsButton"
          onClick={() => alert("Not implemented yet.")}
        >
          ⚙️
        </button>
      </header>

      <div className="block testButtons__grid">
        <TestButton
          name="connect()"
          onClick={handleConnect}
          {...results["connect"]}
        />

        <TestButton
          name="disconnect()"
          onClick={handleDisconnect}
          {...results["disconnect"]}
        />

        <TestButton
          name="requireAuth()"
          onClick={handleRequireAuth}
          {...results["requireAuth"]}
        />

        <TestButton
          name="isAuthenticated"
          onClick={handleIsAuthenticated}
          {...results["isAuthenticated"]}
        />
      </div>

      <div className="block testButtons__grid">
        <TestButton
          name="getActiveAddress()"
          onClick={handleGetActiveAddress}
          {...results["getActiveAddress"]}
        />

        <TestButton
          name="getActivePublicKey()"
          onClick={handleGetActivePublicKey}
          {...results["getActivePublicKey"]}
        />

        <TestButton
          name="getAllAddresses()"
          onClick={handleGetAllAddresses}
          {...results["getAllAddresses"]}
        />

        <TestButton
          name="getWalletNames()"
          onClick={handleGetWalletNames}
          {...results["getWalletNames"]}
        />

        <TestButton
          name="getUserDetails()"
          onClick={handleGetUserDetails}
          {...results["getUserDetails"]}
        />
      </div>

      <div className="block testButtons__grid">
        <TestButton
          name="sign()"
          onClick={handleSign}
          {...results["sign"]}>
          <select
            name="signType"
            type="text"
            placeholder="Content-Type"
            defaultValue={ DEFAULT_TX_DATA_TYPE }
            ref={ assignRef }>
            <option>text/plain</option>
            <option>text/html</option>
          </select>
          <input
            name="signData"
            type="text"
            placeholder="Transaction.data"
            defaultValue={ DEFAULT_TX_DATA }
            ref={ assignRef } />
        </TestButton>

        <TestButton
          name="dispatch()"
          onClick={handleDispatch}
          {...results["dispatch"]}>
          <select
            name="dispatchType"
            type="text"
            placeholder="Content-Type"
            defaultValue={ DEFAULT_TX_DATA_TYPE }
            ref={ assignRef }>
            <option>text/plain</option>
            <option>text/html</option>
          </select>
          <input
            name="dispatchData"
            type="text"
            placeholder="Transaction.data"
            defaultValue={ DEFAULT_TX_DATA }
            ref={ assignRef } />
        </TestButton>
      </div>

      <div className="block testButtons__grid">
        <TestButton
          name="encrypt()"
          onClick={handleEncrypt}
          {...results["encrypt"]}>
          <input
            name="encryptPlaintext"
            type="text"
            placeholder="plaintext"
            defaultValue={ DEFAULT_SECRET }
            ref={ assignRef } />
        </TestButton>

        <TestButton
          name="decrypt()"
          onClick={handleDecrypt}
          {...results["decrypt"]}>
          <input
            name="decryptCiphertext"
            type="text"
            placeholder="ciphertext"
            defaultValue=""
            ref={ assignRef } />
        </TestButton>
      </div>

      <div className="block testButtons__grid">
        <TestButton
          name="signature()"
          onClick={handleSignature}
          {...results["signature"]}>
          <input
            name="signatureData"
            type="text"
            placeholder="data"
            defaultValue={ DEFAULT_DATA_FOR_SIGNING }
            ref={ assignRef } />
        </TestButton>

        <TestButton
          name="signDataItem()"
          onClick={handleSignDataItem}
          {...results["signDataItem"]}>
          <input
            name="signDataItemData"
            type="text"
            placeholder="DataItem.data"
            defaultValue={ DEFAULT_DATA_FOR_SIGNING }
            ref={ assignRef } />
        </TestButton>

        <TestButton
          name="signMessage()"
          onClick={handleSignMessage}
          {...results["signMessage"]}>
          <input
            name="signMessageData"
            type="text"
            placeholder="message"
            defaultValue={ DEFAULT_DATA_FOR_SIGNING }
            ref={ assignRef } />
        </TestButton>

        <TestButton
          name="verifyMessage()"
          onClick={handleVerifyMessage}
          {...results["verifyMessage"]}>
          <input
            name="verifyMessageData"
            type="text"
            placeholder="message"
            defaultValue={ DEFAULT_DATA_FOR_SIGNING }
            ref={ assignRef } />
          <input
            name="verifyMessageSignature"
            type="text"
            placeholder="signature"
            defaultValue=""
            ref={ assignRef } />
        </TestButton>

        <TestButton
          name="privateHash()"
          onClick={handlePrivateHash}
          {...results["privateHash"]}>
          <input
            name="privateHashData"
            type="text"
            placeholder="data"
            defaultValue={ DEFAULT_DATA_FOR_HASHING }
            ref={ assignRef } />
        </TestButton>
      </div>

      <div className="block testButtons__grid">
        <TestButton
          name="walletName"
          onClick={handleWalletName}
          {...results["walletName"]}
        />

        <TestButton
          name="walletVersion"
          onClick={handleWalletVersion}
          {...results["walletVersion"]}
        />

        <TestButton
          name="config"
          onClick={handleConfig}
          {...results["config"]}
        />

        <TestButton
          name="getArweaveConfig()"
          onClick={handleGetArweaveConfig}
          {...results["getArweaveConfig"]}
        />

        <TestButton
          name="getPermissions()"
          onClick={handleGetPermissions}
          {...results["getPermissions"]}
        />
      </div>

      <div className="block">
        {sortedResults.map((result) => (
          <pre className="results__code">
            {JSON.stringify(result, replacer, "  ")}
          </pre>
        ))}
      </div>
    </div>
  );
}

export default App;
