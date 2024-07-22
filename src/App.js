import { Othent, uint8ArrayTob64Url } from "@othent/kms";
import Arweave from "arweave";
import { useState, useEffect, useRef, useMemo } from "react";
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

function App() {
  const [showDetailsJSON, setShowDetailsJSON] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [results, setResults] = useState({});

  const [
    {
      // TODO: If `useStrings = true` we or the library should also transform all results to B64UrlEncoded strings rather than Uint8Array:
      // OLD BACKEND + OLD SDK: Works with `string` inputs, doesn't work with `TextEncoder` inputs
      // OLD BACKEND + NEW SDK: Works with `string` inputs, works with `TextEncoder` inputs.
      useStrings,
      postTransactions,
      env,
      auth0Strategy,
      autoConnect,
      throwErrors,
    },
    // TODO: Add UI for settings:
    setSettings,
  ] = useState({
    useStrings: false,
    postTransactions: false,
    env: "production",
    auth0Strategy: "refresh-memory",
    autoConnect: "lazy",
    throwErrors: true,
  });

  const othent = useMemo(() => {
    return new Othent({
      ...(env === "dev" ? DEV_OTHENT_CONFIG : {}),
      auth0Strategy,
      autoConnect,
      throwErrors,
      appName: "Othent KMS Test Repo",
      appVersion: Othent.walletVersion,
    });
  }, [env, auth0Strategy, autoConnect, throwErrors]);

  // These `useRef` and `useEffect` are here to re-connect automatically, when `othent` changes while running the
  // project in DEV mode with hot reloading:

  const hasLoggedInRef = useRef(false);

  useEffect(() => {
    if (!hasLoggedInRef.current) return;

    setUserDetails(null);

    try {
      othent.connect();
    } catch (err) {
      console.log("connect() error:", err);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [othent]);

  useEffect(() => {
    const removeAuthEventListener = othent.addEventListener(
      "auth",
      (userDetails) => {
        console.log("onAuthChange =", userDetails);

        hasLoggedInRef.current = !!userDetails;

        setUserDetails(userDetails);
      },
    );

    const removeErrorEventListener = throwErrors
      ? () => {
          /* NOOP */
        }
      : othent.addEventListener("error", (error) => {
          console.error("Unthrown error:\n", error);
        });

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
          ...prevResults[name],
          status: "loading",
          elapsed: undefined,
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
            ...returnValue,
            status:
              returnValue.isValid ?? !!returnValue.result ? "ok" : "error",
            elapsed,
          },
        }));
      } catch (err) {
        const elapsed = performance.now() - start;

        console.error(`${name} (${(elapsed / 1000).toFixed(1)}s) =\n`, err);

        setResults((prevResults) => ({
          ...prevResults,
          [name]: {
            err,
            status: "error",
            elapsed,
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

  // TX:

  const handleDispatch = getHandler(
    async () => {
      const transaction = await arweave.createTransaction({
        data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>',
      });

      transaction.addTag("Content-Type", "text/html");

      const result = await othent.dispatch(transaction);
      const transactionURL = `https://viewblock.io/arweave/tx/${result.id}`;

      return { result, transactionURL };
    },
    { name: "dispatch" },
  );

  // ENCRYPT/DECRYPT:

  const handleSign = getHandler(
    async () => {
      const transaction = await arweave.createTransaction({
        data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body>Hello world!</body></html>',
      });

      const result = await othent.sign(transaction);

      let postResult = null;

      if (postTransactions) {
        postResult = await arweave.transactions.post(transaction);
      }

      const isValid = await arweave.transactions.verify(transaction);

      return {
        result,
        postResult,
        isValid,
      };
    },
    { name: "sign" },
  );

  const handleEncrypt = getHandler(
    async () => {
      const plaintext = useStrings
        ? "Encrypt this text, please."
        : new TextEncoder().encode("Encrypt this data, please.");

      const result = await othent.encrypt(plaintext);

      return { result, plaintext };
    },
    { name: "encrypt" },
  );

  const handleDecrypt = getHandler(
    async () => {
      const plaintext = useStrings
        ? "Decrypt this text, please."
        : new TextEncoder().encode("Decrypt this data, please.");

      const encryptReturn = await othent.encrypt(plaintext);

      const ciphertext = encryptReturn;

      // For now, decrypt() doesn't support `string` as input. Later, we can make it so that we can pass a B64UrlEncoded
      // (not a regular one) `string` directly:
      // const ciphertext = useStrings
      //   ? uint8ArrayTob64Url(encryptReturn)
      //   : encryptReturn;

      const result = await othent.decrypt(ciphertext);

      // TODO: Do we need to support this old (undocumented) format or can we just list it as a breaking change?
      // const res = await othent.decrypt({
      //   type: 'Buffer',
      //   data: Array.from(encryptedData),
      // });

      const isValid =
        result ===
        (useStrings ? plaintext : new TextDecoder().decode(plaintext));

      return { result, isValid, plaintext, ciphertext };
    },
    { name: "decrypt" },
  );

  // SIGN:

  const handleSignature = getHandler(
    async () => {
      const dataToSign = useStrings
        ? "Sign this text, please."
        : new TextEncoder().encode("Sign this data, please.");

      const result = await othent.signature(dataToSign);

      // This won't work.
      // TODO: Do we need to "re-implement" most of `verifyMessage()` in userland to verify?
      // const isValid = await othent.verifyMessage(dataToSign, result);

      return { result };
    },
    { name: "signature" },
  );

  const handleSignDataItem = getHandler(
    async () => {
      const data = "DataItem's data";
      const result = await othent.signDataItem({ data });
      const dataItem = new DataItem(Buffer.from(result));

      // TODO: Not working:
      const isValid = await dataItem.isValid().catch((err) => {
        console.error("DataItem.isValid() error =", err);

        return false;
      });

      return { result, isValid };
    },
    { name: "signDataItem" },
  );

  const handleSignMessage = getHandler(
    async () => {
      const data = useStrings
        ? "The hash of this text will be signed."
        : new TextEncoder().encode("The hash of this data will be signed.");

      const result = await othent.signMessage(data);

      return { result, data };
    },
    { name: "signMessage" },
  );

  const handleVerifyMessage = getHandler(
    async () => {
      const data = useStrings
        ? "The hash of this text will be signed."
        : new TextEncoder().encode("The hash of this data will be signed.");

      const signedData = await othent.signMessage(data);
      const result = await othent.verifyMessage(data, signedData);

      return { result, data, signedData };
    },
    { name: "verifyMessage" },
  );

  const handlePrivateHash = getHandler(
    async () => {
      const data = useStrings
        ? "Data to hash."
        : new TextEncoder().encode("Data to hash.");

      const result = await othent.privateHash(data);

      return { result };
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

      <div className="block">
        <TestButton
          name="connect"
          onClick={handleConnect}
          {...results["connect"]}
        />

        <TestButton
          name="disconnect"
          onClick={handleDisconnect}
          {...results["disconnect"]}
        />
      </div>

      <div className="block">
        <TestButton
          name="getActiveAddress"
          onClick={handleGetActiveAddress}
          {...results["getActiveAddress"]}
        />

        <TestButton
          name="getActivePublicKey"
          onClick={handleGetActivePublicKey}
          {...results["getActivePublicKey"]}
        />

        <TestButton
          name="getAllAddresses"
          onClick={handleGetAllAddresses}
          {...results["getAllAddresses"]}
        />

        <TestButton
          name="getWalletNames"
          onClick={handleGetWalletNames}
          {...results["getWalletNames"]}
        />

        <TestButton
          name="getUserDetails"
          onClick={handleGetUserDetails}
          {...results["getUserDetails"]}
        />
      </div>

      <div className="block">
        <TestButton name="sign" onClick={handleSign} {...results["sign"]} />

        <TestButton
          name="dispatch"
          onClick={handleDispatch}
          {...results["dispatch"]}
        />
      </div>

      <div className="block">
        <TestButton
          name="encrypt"
          onClick={handleEncrypt}
          {...results["encrypt"]}
        />

        <TestButton
          name="decrypt"
          onClick={handleDecrypt}
          {...results["decrypt"]}
        />
      </div>

      <div className="block">
        <TestButton
          name="signature"
          onClick={handleSignature}
          {...results["signature"]}
        />

        <TestButton
          name="signDataItem"
          onClick={handleSignDataItem}
          {...results["signDataItem"]}
        />

        <TestButton
          name="signMessage"
          onClick={handleSignMessage}
          {...results["signMessage"]}
        />

        <TestButton
          name="verifyMessage"
          onClick={handleVerifyMessage}
          {...results["verifyMessage"]}
        />

        <TestButton
          name="privateHash"
          onClick={handlePrivateHash}
          {...results["privateHash"]}
        />
      </div>

      <div className="block">
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
          name="getArweaveConfig"
          onClick={handleGetArweaveConfig}
          {...results["getArweaveConfig"]}
        />

        <TestButton
          name="getPermissions"
          onClick={handleGetPermissions}
          {...results["getPermissions"]}
        />
      </div>

      <div className="block">
        <pre className="results__code">
          {JSON.stringify(results, replacer, "  ")}
        </pre>
      </div>
    </div>
  );
}

export default App;
