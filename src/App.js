import {
  Othent,
  b64ToUint8Array,
  binaryDataTypeToString,
} from "./utils/othent";
import Arweave from "arweave";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DataItem } from "warp-arbundles";
import { TestButton } from "./components/TestButton";
import { TextField } from "./components/TextField";
import { LinkField } from "./components/LinkField";
import { UserCard } from "./components/UserCard";
import { SelectField } from "./components/SelectField";
import { LogItem } from "./components/LogItem";
import { replacer } from "./utils/replacer";

import "./App.css";

// Very simple adapter to make @othent/kms v1 work with the new playground. This could be improved by manually
// re-defining all methods so that we could simulate the `auth` events.

const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  port: 443,
});

const appInfo = {
  name: "Othent KMS Test Repo",
  version: Othent.walletVersion,
  env: "", // This will be automatically set to `"development"` when running in localhost or `"production"` otherwise.
};

// Needed just to get the Buffer polyfill:
new Othent({ appInfo });

const DEFAULT_TX_DATA = `<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>`;
const DEFAULT_TX_DATA_TYPE = "text/html";
const DEFAULT_SECRET = "This is a very secret message... 🤫";
const DEFAULT_DATA_FOR_SIGNING = "This data needs to be signed... ✅";
const DEFAULT_DATA_FOR_HASHING = "This data needs to be hashed... 🗜️";

function App() {
  const [iv, setIv] = useState(null);

  useEffect(() => {
    async function encryptSymmetric(plaintext, key) {
      // create a random 96-bit initialization vector (IV)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // encode the text you want to encrypt
      const encodedPlaintext = new TextEncoder().encode(plaintext);

      // encrypt the text with the secret key
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
        },
        key,
        encodedPlaintext,
      );

      // return the encrypted text "ciphertext" and the IV
      // encoded in base64
      return {
        ciphertext: Buffer.from(ciphertext).toString("base64"),
        iv: Buffer.from(iv).toString("base64"),
      };
    }

    async function initIv() {
      const nextIv = await window.crypto.getRandomValues(new Uint8Array(16));

      setIv(nextIv);

      // some plaintext you want to encrypt
      const plaintext = "The quick brown fox jumps over the lazy dog";

      // eslint-disable-next-line no-undef
      // console.log("TEST", typeof globalThis.Buffer.from, typeof Buffer.from);

      // RSA KEY:

      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          extractable: true,
          hash: {
            name: "SHA-256",
          },
        },
        true,
        ["encrypt", "decrypt"],
      );

      try {
        const resultRSA = await encryptSymmetric(plaintext, keyPair.publicKey);

        console.log("resultRSA =", resultRSA);
      } catch (err) {
        console.log("RSA ERR =", err);
      }

      // AES KEY:

      const aesKeyBuffer = Buffer.from(
        crypto.getRandomValues(new Uint8Array(32)),
      );

      const aesKeyB64 = await crypto.subtle.importKey(
        "raw",
        aesKeyBuffer,
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"],
      );

      try {
        const resultAES = await encryptSymmetric(plaintext, aesKeyB64);

        console.log("resultAES =", resultAES);
      } catch (err) {
        // InvalidAccessError: key.algorithm does not match that of operation
        console.log("AES ERR =", err);
      }
    }

    setTimeout(() => {
      initIv();
    }, 500);
  }, []);

  const inputsRef = useRef({});

  const assignRef = useCallback((inputElement) => {
    if (inputElement) inputsRef.current[inputElement.name] = inputElement;
  }, []);

  const [{ userDetails, isAuthenticated }, setAuthState] = useState({});

  const [showDetailsJSON, setShowDetailsJSON] = useState(false);
  const [results, setResults] = useState({});

  const handleSettings = () =>
    alert(
      `UI not implemented yet.\n\nYou can see the current settings in the Console.\n\nTo change them, clone the demo project and edit them in the code (App.js file).`,
    );

  const sortedResults = useMemo(() => {
    const sortedResultsArray = Object.values(results).sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    return sortedResultsArray.length === 0 ? [] : sortedResultsArray;
  }, [results]);

  const [
    {
      // Playground:
      useStrings,
      postTransactions,
      walletType,

      // Othent:
      serverBaseURL,
      auth0Strategy,
      auth0Cache,
      auth0LogInMethod,
      autoConnect,
      throwErrors,
      persistCookie,
      persistLocalStorage,
    },
    // TODO: Add UI for settings:
    // setSettings,
  ] = useState({
    // Playground:
    useStrings: Othent.walletVersion.startsWith("1."),
    postTransactions: false,
    walletType: "injected",

    // Othent:
    serverBaseURL: undefined,
    auth0Strategy: "refresh-tokens",
    auth0Cache: "memory",
    auth0LogInMethod: "popup",
    autoConnect: "lazy",
    throwErrors: true,
    persistCookie: false,
    persistLocalStorage: true,
  });

  const normalizeInput = (dataStr) => {
    // OLD BACKEND + OLD SDK: Works with `string` inputs, doesn't work with `TextEncoder` inputs
    // OLD BACKEND + NEW SDK: Works with `string` inputs, works with `TextEncoder` inputs.

    return useStrings ? dataStr : new TextEncoder().encode(dataStr);
  };

  const othent = useMemo(() => {
    let nextOthent = window.arweaveWallet;

    if (walletType === "othent") {
      nextOthent = new Othent({
        debug: true,
        serverBaseURL,
        auth0Strategy,
        auth0Cache,
        auth0LogInMethod,
        autoConnect,
        throwErrors,
        persistCookie,
        persistLocalStorage,
        appInfo,

        // Local server:
        // serverBaseURL: "http://localhost:3010",

        // Development Auth0 tenant and app:
        // auth0Domain: "gmzcodes-test.eu.auth0.com",
        // auth0ClientId: "RSEz2IKqExKJTMqJ1crVSqjBT12ZgsfW",
      });
    }

    if (!nextOthent) {
      throw new Error(`Could not initialize ${walletType} wallet.`);
    }

    console.group(`${nextOthent.walletName} @ ${nextOthent.walletVersion}`);

    Object.entries(nextOthent?.config || []).forEach(([key, value]) => {
      console.log(` ${key.padStart(29)} = ${value}`);
    });

    console.groupEnd();

    return nextOthent;
  }, [
    walletType,
    serverBaseURL,
    auth0Strategy,
    auth0Cache,
    auth0LogInMethod,
    autoConnect,
    throwErrors,
    persistCookie,
    persistLocalStorage,
  ]);

  // These `useRef` and `useEffect` are here to re-connect automatically, when `othent` changes while running the
  // project in DEV mode with hot reloading.

  const hasLoggedInRef = useRef(false);

  useEffect(() => {
    if (othent.walletName !== "Othent KMS") return;

    const cleanupFn = othent.startTabSynching();

    if (othent.config.auth0LogInMethod === "redirect") {
      // This is not needed (NOOP) unless auth0LogInMethod = "redirect":
      othent.completeConnectionAfterRedirect();
    }

    if (!hasLoggedInRef.current) return;

    setAuthState({});

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

    setAuthState({ userDetails, isAuthenticated });
  }, []);

  const handleError = useCallback((error) => {
    console.error("onError =", error);
  }, []);

  useEffect(() => {
    if (othent.walletName !== "Othent KMS") return;

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
              (returnValue.isValid ?? !!returnValue.result) ? "ok" : "error",
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
      const result = await othent.connect([
        "ACCESS_ADDRESS",
        "ACCESS_ALL_ADDRESSES",
        "ACCESS_ARWEAVE_CONFIG",
        "ACCESS_PUBLIC_KEY",
        "DECRYPT",
        "DISPATCH",
        "ENCRYPT",
        "SIGN_TRANSACTION",
        "SIGNATURE",
      ]);

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

      transaction.addTag(
        "Content-Type",
        inputsRef.current.signType?.value || DEFAULT_TX_DATA_TYPE,
      );

      const signedTransaction = await othent.sign(transaction);

      let postResult = null;

      if (postTransactions) {
        postResult = await arweave.transactions.post(signedTransaction);
      }

      const isValid =
        (await arweave.transactions.verify(signedTransaction)) &&
        (Othent.walletVersion.startsWith("1.") ||
          transaction !== signedTransaction);

      return {
        result: `<SignedTransaction txId="${signedTransaction.id}">`,
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

      transaction.addTag(
        "Content-Type",
        inputsRef.current.dispatchType?.value || DEFAULT_TX_DATA_TYPE,
      );

      const result = await othent.dispatch(transaction);
      const transactionURL = `https://viewblock.io/arweave/tx/${result.id}`;

      return { result, isValid: !!result, transactionURL };
    },
    { name: "dispatch" },
  );

  // ENCRYPT/DECRYPT:

  const handleEncrypt = getHandler(
    async () => {
      const dataStr =
        inputsRef.current.encryptPlaintext?.value || DEFAULT_SECRET;
      const plaintext = normalizeInput(dataStr);

      // Legacy:
      // const result = await othent.encrypt(plaintext, { algorithm: "<ALGO>" });

      // New:
      // AesGcmParams: iv: Not a BufferSource
      // There seems to be a problem with serialization, as `iv` arrives to the background script as `{0: 60, 1: 186, 2: 248, 3: 30, ... }`
      // Data is properly parsed/converted with `data = new Uint8Array(Object.values(data));`.
      // See https://security.stackexchange.com/questions/149064/is-it-possible-to-combine-rsa-and-aes
      const result = await othent.encrypt(plaintext, {
        name: "AES-GCM",
        iv,
      });

      return { result, isValid: !!result, input: plaintext };
    },
    { name: "encrypt" },
  );

  const handleDecrypt = getHandler(
    async () => {
      const dataStr =
        inputsRef.current.encryptPlaintext?.value || DEFAULT_SECRET;
      const plaintext = normalizeInput(dataStr);

      const b64Ciphertext = inputsRef.current.decryptCiphertext?.value || "";
      const encryptedData = b64Ciphertext
        ? b64ToUint8Array(b64Ciphertext)
        : await othent.encrypt(plaintext, {
            name: "AES-CBC",
            iv: iv,
          });

      // For now, decrypt() doesn't support `string` as input. Later, we can make it so that we can pass a B64UrlEncoded
      // (not a regular one) `string` directly:
      // const ciphertext = useStrings
      //   ? uint8ArrayTob64Url(encryptReturn)
      //   : encryptReturn;

      const result = await othent.decrypt(encryptedData, {
        name: "AES-CBC",
        iv: iv,
      });

      const resultString = binaryDataTypeToString(result);

      // Assuming we haven't changed the input field in for `encrypt()` or took the encrypted value from somewhere else:
      const isValid = resultString === dataStr;

      return { result, isValid, input: encryptedData, resultString };
    },
    { name: "decrypt" },
  );

  // SIGN:

  const handleSignature = getHandler(
    async () => {
      const dataStr =
        inputsRef.current.signatureData?.value || DEFAULT_DATA_FOR_SIGNING;
      const data = normalizeInput(dataStr);
      const result = await othent.signature(data);

      // This won't work.
      // TODO: Do we need to "re-implement" most of `verifyMessage()` in userland to verify?
      // const isValid = await othent.verifyMessage(dataToSign, result);

      return { result, isValid: !!result, input: data };
    },
    { name: "signature" },
  );

  const handleSignDataItem = getHandler(
    async () => {
      const dataStr =
        inputsRef.current.signDataItemData?.value || DEFAULT_DATA_FOR_SIGNING;
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
      const dataStr =
        inputsRef.current.signMessageData?.value || DEFAULT_DATA_FOR_SIGNING;
      const data = normalizeInput(dataStr);
      const result = await othent.signMessage(data);

      return { result, isValid: !!result, input: data };
    },
    { name: "signMessage" },
  );

  const handleVerifyMessage = getHandler(
    async () => {
      const dataStr =
        inputsRef.current.verifyMessageData?.value || DEFAULT_DATA_FOR_SIGNING;
      const data = normalizeInput(dataStr);

      const b64Signature =
        inputsRef.current.verifyMessageSignature?.value || "";
      const signedData = b64Signature
        ? b64ToUint8Array(b64Signature)
        : await othent.signMessage(data);

      const result = await othent.verifyMessage(data, signedData);

      return { result, isValid: result, input: [data, signedData] };
    },
    { name: "verifyMessage" },
  );

  const handlePrivateHash = getHandler(
    async () => {
      const dataStr =
        inputsRef.current.privateHashData?.value || DEFAULT_DATA_FOR_HASHING;
      const data = normalizeInput(dataStr);
      const result = await othent.privateHash(data);

      return { result, isValid: !!result, input: data };
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

  const handleAppInfo = getHandler(
    async () => {
      const result = await othent.appInfo;

      return { result };
    },
    { name: "appInfo" },
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

  const handleGetServerInfo = getHandler(
    async () => {
      const result = await othent.__getServerInfo();

      return { result };
    },
    { name: "__getServerInfo" },
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
      handleAppInfo,
      handleGetArweaveConfig,
      handleGetPermissions,
      handleGetServerInfo,
    ];

    for (const methodFn of methodsUnderTest) {
      await methodFn();
    }
  };

  return (
    <div className="app">
      <header className="header__base">
        <h1 className="header__title">Othent KMS JS SDK Playground</h1>
        <p>Check the DevTools Console for additional information.</p>
        <UserCard
          userDetails={userDetails}
          isAuthenticated={isAuthenticated}
          showDetailsJSON={showDetailsJSON}
          setShowDetailsJSON={setShowDetailsJSON}
        />

        <button className="header__testAllButton" onClick={handleTestAll}>
          🧙‍♂️
        </button>
        <button className="header__settingsButton" onClick={handleSettings}>
          ⚙️
        </button>
      </header>

      <div className="block testButtons__grid">
        <TestButton
          {...results["connect"]}
          name="connect()"
          onClick={handleConnect}
        />

        <TestButton
          {...results["disconnect"]}
          name="disconnect()"
          onClick={handleDisconnect}
        />

        <TestButton
          {...results["requireAuth"]}
          name="requireAuth()"
          onClick={handleRequireAuth}
        />

        <TestButton
          {...results["isAuthenticated"]}
          name="isAuthenticated"
          onClick={handleIsAuthenticated}
        />
      </div>

      <div className="block testButtons__grid">
        <TestButton
          {...results["getActiveAddress"]}
          name="getActiveAddress()"
          onClick={handleGetActiveAddress}
        />

        <TestButton
          {...results["getActivePublicKey"]}
          name="getActivePublicKey()"
          onClick={handleGetActivePublicKey}
        />

        <TestButton
          {...results["getAllAddresses"]}
          name="getAllAddresses()"
          onClick={handleGetAllAddresses}
        />

        <TestButton
          {...results["getWalletNames"]}
          name="getWalletNames()"
          onClick={handleGetWalletNames}
        />

        <TestButton
          {...results["getUserDetails"]}
          name="getUserDetails()"
          onClick={handleGetUserDetails}
        />
      </div>

      <div className="block testButtons__grid">
        <TestButton {...results["sign"]} name="sign()" onClick={handleSign}>
          <SelectField
            name="signType"
            label="Content-Type"
            defaultValue={DEFAULT_TX_DATA_TYPE}
            inputRef={assignRef}
            options={["text/plain", "text/html"]}
          />
          <TextField
            name="signData"
            label="Transaction.data"
            defaultValue={DEFAULT_TX_DATA}
            inputRef={assignRef}
          />
          {results["sign"]?.result === undefined ? null : (
            <>
              <TextField
                label="sign() result"
                value={results["sign"].result}
                encoding="Hidden"
              />
              <TextField
                label="tx.post() result"
                value={JSON.stringify(results["sign"].postResult, null, "  ")}
                encoding="JSON"
                hasError={!results["sign"].postResult}
              />
            </>
          )}
        </TestButton>

        <TestButton
          {...results["dispatch"]}
          name="dispatch()"
          onClick={handleDispatch}
        >
          <SelectField
            name="dispatchType"
            label="Content-Type"
            defaultValue={DEFAULT_TX_DATA_TYPE}
            inputRef={assignRef}
            options={["text/plain", "text/html"]}
          />
          <TextField
            name="dispatchData"
            label="Transaction.data"
            defaultValue={DEFAULT_TX_DATA}
            inputRef={assignRef}
          />
          {results["dispatch"]?.result === undefined ? null : (
            <>
              <TextField
                label="dispatch() result"
                value={JSON.stringify(results["dispatch"].result, null, "  ")}
                hasError={!results["dispatch"].isValid}
                encoding="JSON"
              />
              <LinkField
                label="dispatch() result"
                value={results["dispatch"].transactionURL}
                hasError={!results["dispatch"].transactionURL}
              />
            </>
          )}
        </TestButton>
      </div>

      <div className="block testButtons__grid">
        <TestButton
          {...results["encrypt"]}
          name="encrypt()"
          onClick={handleEncrypt}
        >
          <TextField
            name="encryptPlaintext"
            label="plaintext"
            defaultValue={DEFAULT_SECRET}
            inputRef={assignRef}
          />
          {results["encrypt"]?.result === undefined ? null : (
            <>
              <TextField
                label="encrypt() result"
                value={replacer(null, results["encrypt"].result)}
                hasError={!results["encrypt"].isValid}
                encoding="Base64"
              />
            </>
          )}
        </TestButton>

        <TestButton
          {...results["decrypt"]}
          name="decrypt()"
          onClick={handleDecrypt}
        >
          <TextField
            name="decryptCiphertext"
            label="ciphertext"
            defaultValue=""
            inputRef={assignRef}
            encoding="Base64"
          />
          {results["decrypt"]?.result === undefined ? null : (
            <>
              <TextField
                label="decrypt() result"
                value={replacer(null, results["decrypt"].result)}
                hasError={!results["decrypt"].isValid}
                encoding="Base64"
              />
              <TextField
                label="decrypt() decrypted result"
                value={results["decrypt"].resultString}
                hasError={!results["decrypt"].isValid}
              />
            </>
          )}
        </TestButton>
      </div>

      <div className="block testButtons__grid">
        <TestButton
          {...results["signature"]}
          name="signature()"
          onClick={handleSignature}
        >
          <TextField
            name="signatureData"
            label="data"
            defaultValue={DEFAULT_DATA_FOR_SIGNING}
            inputRef={assignRef}
          />
          {results["signature"]?.result === undefined ? null : (
            <>
              <TextField
                label="signature() result"
                value={replacer(null, results["signature"].result)}
                hasError={!results["signature"].isValid}
                encoding="Base64"
              />
            </>
          )}
        </TestButton>

        <TestButton
          {...results["signDataItem"]}
          name="signDataItem()"
          onClick={handleSignDataItem}
        >
          <TextField
            name="signDataItemData"
            label="DataItem.data"
            defaultValue={DEFAULT_DATA_FOR_SIGNING}
            inputRef={assignRef}
          />
          {results["signDataItem"]?.result === undefined ? null : (
            <>
              <TextField
                label="signDataItem() result"
                value={replacer(null, results["signDataItem"].result)}
                hasError={!results["signDataItem"].isValid}
                encoding="Base64"
              />
            </>
          )}
        </TestButton>

        <TestButton
          {...results["signMessage"]}
          name="signMessage()"
          onClick={handleSignMessage}
        >
          <TextField
            name="signMessageData"
            label="message"
            defaultValue={DEFAULT_DATA_FOR_SIGNING}
            inputRef={assignRef}
          />
          {results["signMessage"]?.result === undefined ? null : (
            <>
              <TextField
                label="signMessage() result"
                value={replacer(null, results["signMessage"].result)}
                hasError={!results["signMessage"].isValid}
                encoding="Base64"
              />
            </>
          )}
        </TestButton>

        <TestButton
          {...results["verifyMessage"]}
          name="verifyMessage()"
          onClick={handleVerifyMessage}
        >
          <TextField
            name="verifyMessageData"
            label="message"
            defaultValue={DEFAULT_DATA_FOR_SIGNING}
            inputRef={assignRef}
          />
          <TextField
            name="verifyMessageSignature"
            label="signature"
            defaultValue=""
            inputRef={assignRef}
            encoding="Base64"
          />
          {results["verifyMessage"]?.result === undefined ? null : (
            <>
              <TextField
                label="verifyMessage() result"
                value={`${results["verifyMessage"].result}`}
                hasError={!results["verifyMessage"].isValid}
              />
            </>
          )}
        </TestButton>

        <TestButton
          {...results["privateHash"]}
          name="privateHash()"
          onClick={handlePrivateHash}
        >
          <TextField
            name="privateHashData"
            label="data"
            defaultValue={DEFAULT_DATA_FOR_HASHING}
            inputRef={assignRef}
          />
          {results["privateHash"]?.result === undefined ? null : (
            <>
              <TextField
                label="privateHash() result"
                value={results["privateHash"].result}
                hasError={!results["privateHash"].isValid}
                encoding="Base64"
              />
            </>
          )}
        </TestButton>
      </div>

      <div className="block testButtons__grid">
        <TestButton
          {...results["walletName"]}
          name="walletName"
          onClick={handleWalletName}
        />

        <TestButton
          {...results["walletVersion"]}
          name="walletVersion"
          onClick={handleWalletVersion}
        />

        <TestButton
          {...results["config"]}
          name="config"
          onClick={handleConfig}
        />

        <TestButton
          {...results["appInfo"]}
          name="appInfo"
          onClick={handleAppInfo}
        />

        <TestButton
          {...results["getArweaveConfig"]}
          name="getArweaveConfig()"
          onClick={handleGetArweaveConfig}
        />

        <TestButton
          {...results["getPermissions"]}
          name="getPermissions()"
          onClick={handleGetPermissions}
        />
      </div>

      <div className="block testButtons__grid">
        <TestButton
          {...results["__getServerInfo"]}
          name="__getServerInfo()"
          onClick={handleGetServerInfo}
        />
      </div>

      {sortedResults.length > 0 ? (
        <ol className="block logItems__grid">
          {sortedResults.map((result) => (
            <LogItem key={result.name} {...result} />
          ))}
        </ol>
      ) : null}

      <footer className="block footer__base">
        <a target="_blank" rel="noreferrer noopener" href="https://othent.io/">
          othent.io
        </a>
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="https://docs.othent.io/"
        >
          docs.othent.io
        </a>
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="https://github.com/Othent/KeyManagementService"
        >
          @othent/kms repo
        </a>
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="https://www.npmjs.com/package/@othent/kms"
        >
          @othent/kms npm
        </a>
        <a
          target="_blank"
          rel="noreferrer noopener"
          href="https://github.com/Othent/KMS-test-repo"
        >
          @othent/kms-playground repo
        </a>
      </footer>
    </div>
  );
}

export default App;
