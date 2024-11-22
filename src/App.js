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
  name: "Arweave/AO Wallet Playground",
  version: "2.1.1",
  env: "", // This will be automatically set to `"development"` when running in localhost or `"production"` otherwise.
};

// Needed just to get the Buffer polyfill:
new Othent({ appInfo });

const DEFAULT_TX_DATA = `<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>`;
const DEFAULT_TX_DATA_TYPE = "text/html";
const DEFAULT_SECRET = "This is a very secret message... 🤫";
const DEFAULT_DATA_FOR_SIGNING = "This data needs to be signed... ✅";
const DEFAULT_DATA_FOR_HASHING = "This data needs to be hashed... 🗜️";
const ALL_PERMISSIONS = [
  "ACCESS_ADDRESS",
  "ACCESS_ALL_ADDRESSES",
  "ACCESS_ARWEAVE_CONFIG",
  "ACCESS_PUBLIC_KEY",
  "DECRYPT",
  "DISPATCH",
  "ENCRYPT",
  "SIGN_TRANSACTION",
  "SIGNATURE",
];

function App() {
  // Inputs:

  const inputsRef = useRef({});

  const assignRef = useCallback((inputElement) => {
    if (inputElement) inputsRef.current[inputElement.name] = inputElement;
  }, []);

  // User Details:

  const [{ userDetails, isAuthenticated }, setAuthState] = useState({});

  // Settings:

  const handleSettings = () =>
    alert(
      `UI not implemented yet.\n\nYou can see the current settings in the Console.\n\nTo change them, clone the demo project and edit them in the code (App.js file).`,
    );

  const [
    {
      // Playground:
      useStrings,
      postTransactions,
      walletType,
      logPosition,

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
    setSettings,
  ] = useState({
    // Playground:
    useStrings: Othent.walletVersion.startsWith("1."),
    postTransactions: false,
    walletType: "injected",
    logPosition: "sticky",

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

  const handleSwitchWallet = useCallback(() => {
    setAuthState({});
    setResults({});
    setSettings((prevSettings) => ({
      ...prevSettings,
      walletType:
        prevSettings.walletType === "injected" ? "othent" : "injected",
    }));
  }, []);

  const handleToggleLogPosition = useCallback(() => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      logPosition: prevSettings.logPosition === "static" ? "sticky" : "static",
    }));
  }, []);

  // Logs:

  const logItemsElementRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const ignoreNextScrollRef = useRef(false);
  const [showDetailsJSON, setShowDetailsJSON] = useState(false);
  const [results, setResults] = useState({});
  const [highlightedLogItemId, setHighlightedLogItemId] = useState("");
  const sortedResults = useMemo(() => {
    const sortedResultsArray = Object.values(results).sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    return sortedResultsArray.length === 0 ? [] : sortedResultsArray;
  }, [results]);

  useEffect(() => {
    const logItemsElement = logItemsElementRef.current;

    if (!logItemsElement || logPosition === "static") return;

    if (highlightedLogItemId) {
      const highlightedLogItem = Array.from(logItemsElement.children).find(
        (logItem) => {
          return logItem.id === highlightedLogItemId;
        },
      );

      if (highlightedLogItem) {
        lastScrollTopRef.current = logItemsElement.scrollTop;
        ignoreNextScrollRef.current = true;
        logItemsElement.scrollTop = highlightedLogItem.offsetTop - 16;
      }
    } else {
      ignoreNextScrollRef.current = true;
      logItemsElement.scrollTop = lastScrollTopRef.current;
    }
  }, [logPosition, results, highlightedLogItemId]);

  const handleLogScroll = useCallback(
    (e) => {
      const logItemsElement = logItemsElementRef.current;

      if (!logItemsElement || logPosition === "static") return;

      if (ignoreNextScrollRef.current) {
        ignoreNextScrollRef.current = false;

        return;
      }

      lastScrollTopRef.current = logItemsElement.scrollTop;
    },
    [logPosition],
  );

  const handleMouseLeave = useCallback(() => {
    setHighlightedLogItemId("");
  }, []);

  const handleMouseOver = useCallback((e) => {
    let { target } = e;

    while (
      !target.classList.contains("testButton__button") &&
      target.tagName !== "BODY"
    ) {
      target = target.parentElement;
    }

    const highlightedLogItemName = target
      .querySelector("& > .testButton__text")
      ?.textContent.replace("()", "");

    setHighlightedLogItemId(
      highlightedLogItemName ? `${highlightedLogItemName}LogItem` : "",
    );
  }, []);

  // Wallet Functions / API:

  const normalizeInput = (dataStr) => {
    // OLD BACKEND + OLD SDK: Works with `string` inputs, doesn't work with `TextEncoder` inputs
    // OLD BACKEND + NEW SDK: Works with `string` inputs, works with `TextEncoder` inputs.

    return useStrings ? dataStr : new TextEncoder().encode(dataStr);
  };

  const arweaveWallet = useMemo(() => {
    let nextArweaveWallet = window.arweaveWallet;

    if (walletType === "othent") {
      nextArweaveWallet = new Othent({
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

    if (!nextArweaveWallet) {
      throw new Error(`Could not initialize ${walletType} wallet.`);
    }

    console.group(
      `${nextArweaveWallet.walletName} @ ${nextArweaveWallet.walletVersion}`,
    );

    Object.entries(nextArweaveWallet?.config || {}).forEach(([key, value]) => {
      console.log(` ${key.padStart(29)} = ${value}`);
    });

    console.groupEnd();

    return nextArweaveWallet;
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
    if (arweaveWallet.walletName !== "Othent KMS") return;

    const cleanupFn = arweaveWallet.startTabSynching();

    if (arweaveWallet.config.auth0LogInMethod === "redirect") {
      // This is not needed (NOOP) unless auth0LogInMethod = "redirect":
      arweaveWallet.completeConnectionAfterRedirect();
    }

    if (!hasLoggedInRef.current) return;

    setAuthState({});

    async function reconnectOnHotReload() {
      console.groupCollapsed(`Reconnecting due to hot reloading...`);

      try {
        // This won't work if `auth0Strategy = "refresh-memory"`.

        await arweaveWallet.connect();
      } catch (err) {
        console.log("connect() error:", err);
      }

      console.groupEnd();
    }

    reconnectOnHotReload();

    return cleanupFn;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arweaveWallet]);

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
    if (arweaveWallet.walletName !== "Othent KMS") return;

    const removeAuthEventListener = arweaveWallet.addEventListener(
      "auth",
      handleAuthChange,
    );

    const removeErrorEventListener = throwErrors
      ? () => {
          /* NOOP */
        }
      : arweaveWallet.addEventListener("error", handleError);

    return () => {
      removeAuthEventListener();
      removeErrorEventListener();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arweaveWallet, throwErrors]);

  function getHandler(fn, options) {
    const { name } = options;

    return async () => {
      if (!(name in arweaveWallet)) return;

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
      const result = await arweaveWallet.connect(
        arweaveWallet.walletName === "ArConnect" ? ALL_PERMISSIONS : undefined,
      );

      if (arweaveWallet.walletName === "ArConnect") {
        const walletAddress = await arweaveWallet.getActiveAddress();
        const walletNames = await arweaveWallet.getWalletNames();

        setAuthState({
          userDetails: {
            name: walletNames[walletAddress],
            email: "",
            walletAddress,
            authProvider: "ArConnect",
          },
          isAuthenticated: true,
        });
      }

      return { result };
    },
    { name: "connect" },
  );

  const handleDisconnect = getHandler(
    async () => {
      const result = await arweaveWallet.disconnect();

      if (arweaveWallet.walletName === "ArConnect") {
        setAuthState({});
      }

      return { result, isValid: true };
    },
    { name: "disconnect" },
  );

  const handleRequireAuth = getHandler(
    async () => {
      const result = await arweaveWallet.requireAuth();

      return { result, isValid: true };
    },
    { name: "requireAuth" },
  );

  const handleIsAuthenticated = getHandler(
    async () => {
      const result = arweaveWallet.isAuthenticated;

      return { result, isValid: typeof result === "boolean" };
    },
    { name: "isAuthenticated" },
  );

  // GET DATA (ASYNC):

  const handleGetActiveAddress = getHandler(
    async () => {
      const result = await arweaveWallet.getActiveAddress();
      return { result };
    },
    { name: "getActiveAddress" },
  );

  const handleGetActivePublicKey = getHandler(
    async () => {
      const result = await arweaveWallet.getActivePublicKey();
      return { result };
    },
    { name: "getActivePublicKey" },
  );

  const handleGetAllAddresses = getHandler(
    async () => {
      const result = await arweaveWallet.getAllAddresses();
      return { result };
    },
    { name: "getAllAddresses" },
  );

  const handleGetWalletNames = getHandler(
    async () => {
      const result = await arweaveWallet.getWalletNames();
      return { result };
    },
    { name: "getWalletNames" },
  );

  const handleGetUserDetails = getHandler(
    async () => {
      const result = await arweaveWallet.getUserDetails();
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

      const signedTransaction = await arweaveWallet.sign(transaction);

      let postResult = null;

      if (postTransactions) {
        postResult = await arweave.transactions.post(signedTransaction);
      }

      const isValid =
        (await arweave.transactions.verify(signedTransaction)) &&
        (arweaveWallet.walletVersion.startsWith("1.") ||
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
      // TODO: Why is dispatch asking for 2 signatures?

      const transaction = await arweave.createTransaction({
        data: inputsRef.current.dispatchData?.value || DEFAULT_TX_DATA,
      });

      transaction.addTag(
        "Content-Type",
        inputsRef.current.dispatchType?.value || DEFAULT_TX_DATA_TYPE,
      );

      const result = await arweaveWallet.dispatch(transaction);
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
      const result = await arweaveWallet.encrypt(plaintext, {
        name: "RSA-OAEP",
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
        : await arweaveWallet.encrypt(plaintext, { name: "RSA-OAEP" });

      // For now, decrypt() doesn't support `string` as input. Later, we can make it so that we can pass a B64UrlEncoded
      // (not a regular one) `string` directly:
      // const ciphertext = useStrings
      //   ? uint8ArrayTob64Url(encryptReturn)
      //   : encryptReturn;

      const result = await arweaveWallet.decrypt(encryptedData, {
        name: "RSA-OAEP",
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
      const result = await arweaveWallet.signature(data, {
        name: "RSA-PSS",
        saltLength: 32,
      });

      // This won't work.
      // TODO: Do we need to "re-implement" most of `verifyMessage()` in userland to verify?
      // const isValid = await arweaveWallet.verifyMessage(dataToSign, result);

      return { result, isValid: !!result, input: data };
    },
    { name: "signature" },
  );

  const handleSignDataItem = getHandler(
    async () => {
      const dataStr =
        inputsRef.current.signDataItemData?.value || DEFAULT_DATA_FOR_SIGNING;
      const result = await arweaveWallet.signDataItem({ data: dataStr });
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

  const handleBatchSignDataItem = getHandler(
    async () => {
      const dataStr1 = `${inputsRef.current.signDataItemData?.value || DEFAULT_DATA_FOR_SIGNING} (1/3)`;
      const dataStr2 = `${inputsRef.current.signDataItemData?.value || DEFAULT_DATA_FOR_SIGNING} (2/3)`;
      const dataStr3 = `${inputsRef.current.signDataItemData?.value || DEFAULT_DATA_FOR_SIGNING} (3/3)`;

      const result = await arweaveWallet.batchSignDataItem([
        { data: dataStr1 },
        { data: dataStr2 },
        { data: dataStr3 },
      ]);

      const dataItems = result.map(
        (dataItemSignatureBuffer) =>
          new DataItem(Buffer.from(dataItemSignatureBuffer)),
      );

      const dataItemsIsValidPromises = dataItems.map((dataItem) => {
        // TODO: Not working:
        return dataItem.isValid().catch((err) => {
          console.error("DataItem.isValid() error =", err);

          return false;
        });
      });

      const dataItemsIsValid = await Promise.allSettled(
        dataItemsIsValidPromises,
      );

      const isValid = dataItemsIsValid.every((settledPromise) => {
        return !!settledPromise.value;
      });

      return { result, isValid, input: [dataStr1, dataStr2, dataStr3] };
    },
    { name: "batchSignDataItem" },
  );

  const handleSignMessage = getHandler(
    async () => {
      const dataStr =
        inputsRef.current.signMessageData?.value || DEFAULT_DATA_FOR_SIGNING;
      const data = normalizeInput(dataStr);
      const result = await arweaveWallet.signMessage(data);

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
        : await arweaveWallet.signMessage(data);

      const result = await arweaveWallet.verifyMessage(data, signedData);

      return { result, isValid: result, input: [data, signedData] };
    },
    { name: "verifyMessage" },
  );

  const handlePrivateHash = getHandler(
    async () => {
      const dataStr =
        inputsRef.current.privateHashData?.value || DEFAULT_DATA_FOR_HASHING;
      const data = normalizeInput(dataStr);
      const result = await arweaveWallet.privateHash(data, {
        hashAlgorithm: "SHA-256",
      });

      return { result, isValid: !!result, input: data };
    },
    { name: "privateHash" },
  );

  // MISC.:

  const handleWalletName = getHandler(
    async () => {
      const result = arweaveWallet.walletName;

      return { result };
    },
    { name: "walletName" },
  );

  const handleWalletVersion = getHandler(
    async () => {
      const result = arweaveWallet.walletVersion;

      return { result };
    },
    { name: "walletVersion" },
  );

  const handleConfig = getHandler(
    async () => {
      const result = arweaveWallet.config;

      return { result };
    },
    { name: "config" },
  );

  const handleAppInfo = getHandler(
    async () => {
      const result = await arweaveWallet.appInfo;

      return { result };
    },
    { name: "appInfo" },
  );

  const handleGetArweaveConfig = getHandler(
    async () => {
      const result = await arweaveWallet.getArweaveConfig();

      return { result };
    },
    { name: "getArweaveConfig" },
  );

  const handleGetPermissions = getHandler(
    async () => {
      const result = await arweaveWallet.getPermissions();

      return { result };
    },
    { name: "getPermissions" },
  );

  const handleGetServerInfo = getHandler(
    async () => {
      const result = await arweaveWallet.__getServerInfo();

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
      handleBatchSignDataItem,
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
    <div
      className="app"
      onMouseLeave={handleMouseLeave}
      onMouseOver={handleMouseOver}
    >
      <header className="header__base">
        <h1 className="header__title">Arweave/AO Wallet Playground</h1>
        <p>Check the DevTools Console for additional information.</p>

        <UserCard
          userDetails={userDetails}
          isAuthenticated={isAuthenticated}
          showDetailsJSON={showDetailsJSON}
          setShowDetailsJSON={setShowDetailsJSON}
        />
      </header>

      <div className="block testButtons__grid">
        <TestButton
          {...results["connect"]}
          name="connect()"
          onClick={handleConnect}
          disabled={!("connect" in arweaveWallet)}
        />

        <TestButton
          {...results["disconnect"]}
          name="disconnect()"
          onClick={handleDisconnect}
          disabled={!("disconnect" in arweaveWallet)}
        />

        <TestButton
          {...results["requireAuth"]}
          name="requireAuth()"
          onClick={handleRequireAuth}
          disabled={!("requireAuth" in arweaveWallet)}
        />

        <TestButton
          {...results["isAuthenticated"]}
          name="isAuthenticated"
          onClick={handleIsAuthenticated}
          disabled={!("isAuthenticated" in arweaveWallet)}
        />
      </div>

      <div className="block testButtons__grid">
        <TestButton
          {...results["getActiveAddress"]}
          name="getActiveAddress()"
          onClick={handleGetActiveAddress}
          disabled={!("getActiveAddress" in arweaveWallet)}
        />

        <TestButton
          {...results["getActivePublicKey"]}
          name="getActivePublicKey()"
          onClick={handleGetActivePublicKey}
          disabled={!("getActivePublicKey" in arweaveWallet)}
        />

        <TestButton
          {...results["getAllAddresses"]}
          name="getAllAddresses()"
          onClick={handleGetAllAddresses}
          disabled={!("getAllAddresses" in arweaveWallet)}
        />

        <TestButton
          {...results["getWalletNames"]}
          name="getWalletNames()"
          onClick={handleGetWalletNames}
          disabled={!("getWalletNames" in arweaveWallet)}
        />

        <TestButton
          {...results["getUserDetails"]}
          name="getUserDetails()"
          onClick={handleGetUserDetails}
          disabled={!("getUserDetails" in arweaveWallet)}
        />
      </div>

      <div className="block testButtons__grid">
        <TestButton
          {...results["sign"]}
          name="sign()"
          onClick={handleSign}
          disabled={!("sign" in arweaveWallet)}
        >
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
          disabled={!("dispatch" in arweaveWallet)}
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
          disabled={!("encrypt" in arweaveWallet)}
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
          disabled={!("decrypt" in arweaveWallet)}
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
          disabled={!("signature" in arweaveWallet)}
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
          disabled={!("signDataItem" in arweaveWallet)}
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
          {...results["batchSignDataItem"]}
          name="batchSignDataItem()"
          onClick={handleBatchSignDataItem}
          disabled={!("batchSignDataItem" in arweaveWallet)}
        >
          <TextField
            name="batchSignDataItemData"
            label="DataItem.data"
            defaultValue={DEFAULT_DATA_FOR_SIGNING}
            inputRef={assignRef}
          />
          {results["batchSignDataItem"]?.result === undefined ? null : (
            <>
              <TextField
                label="batchSignDataItem() result"
                value={replacer(null, results["batchSignDataItem"].result)}
                hasError={!results["batchSignDataItem"].isValid}
                encoding="Base64"
              />
            </>
          )}
        </TestButton>

        <TestButton
          {...results["signMessage"]}
          name="signMessage()"
          onClick={handleSignMessage}
          disabled={!("signMessage" in arweaveWallet)}
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
          disabled={!("verifyMessage" in arweaveWallet)}
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
          disabled={!("privateHash" in arweaveWallet)}
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
          disabled={!("walletName" in arweaveWallet)}
        />

        <TestButton
          {...results["walletVersion"]}
          name="walletVersion"
          onClick={handleWalletVersion}
          disabled={!("walletVersion" in arweaveWallet)}
        />

        <TestButton
          {...results["config"]}
          name="config"
          onClick={handleConfig}
          disabled={!("config" in arweaveWallet)}
        />

        <TestButton
          {...results["appInfo"]}
          name="appInfo"
          onClick={handleAppInfo}
          disabled={!("appInfo" in arweaveWallet)}
        />

        <TestButton
          {...results["getArweaveConfig"]}
          name="getArweaveConfig()"
          onClick={handleGetArweaveConfig}
          disabled={!("getArweaveConfig" in arweaveWallet)}
        />

        <TestButton
          {...results["getPermissions"]}
          name="getPermissions()"
          onClick={handleGetPermissions}
          disabled={!("getPermissions" in arweaveWallet)}
        />
      </div>

      <div className="block testButtons__grid">
        <TestButton
          {...results["__getServerInfo"]}
          name="__getServerInfo()"
          onClick={handleGetServerInfo}
          disabled={!("__getServerInfo" in arweaveWallet)}
        />
      </div>

      {sortedResults.length > 0 ? (
        <ol
          ref={logItemsElementRef}
          className={`block logItems__base ${logPosition === "sticky" ? "logItem--sticky" : ""}`}
          onScroll={handleLogScroll}
        >
          {sortedResults.map((result) => (
            <LogItem key={result.name} {...result} />
          ))}
        </ol>
      ) : null}

      <footer className="block footer__base">
        <div
          className={`footer__actionsWrapper ${logPosition === "static" ? "footer--withGradient" : ""}`}
        >
          <div className="footer__actions">
            <button className="footer__action" onClick={handleSwitchWallet}>
              <img
                className="footer__actionImg"
                src={`./wallet-icons/${arweaveWallet.walletName}.png`}
                alt={`${arweaveWallet.walletName} Icon`}
              />
            </button>
            <button className="footer__action" onClick={handleSettings}>
              <span className="footer__actionText">⚙️</span>
            </button>
          </div>

          <div className="footer__actions">
            <button
              className="footer__action"
              onClick={handleToggleLogPosition}
              disabled={sortedResults.length === 0}
            >
              <span className="footer__actionText">
                {logPosition === "static" ? "⬆️" : "⬇️"}
              </span>
            </button>
            <button className="footer__action" onClick={handleTestAll}>
              <span className="footer__actionText">🧙‍♂️</span>
            </button>
          </div>
        </div>

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
