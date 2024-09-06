// v2:
export {
  Othent,
  b64ToUint8Array,
  binaryDataTypeToString,
  uint8ArrayTob64Url,
} from "@othent/kms";

// v1:
/*
import * as othent from "@othent/kms";

export class Othent {
  static walletName = "@othent/kms";
  static walletVersion = "1.X.X";

  #listeners = [];
  #userDetails = null;

  walletName = "@othent/kms";
  walletVersion = "1.X.X";
  config = {};
  appInfo = {};

  constructor() {
    console.warn("Using @othent/kms@1.X.X with an adapter.");
  }

  addEventListener(eventType, eventListenerFn) {
    if (eventType === "auth") {
      this.#listeners.push(eventListenerFn);
    }

    return () => {
      const eventListenerIndex = this.#listeners.indexOf(eventListenerFn);

      if (eventListenerIndex > -1) {
        this.#listeners.splice(eventListenerIndex, 1);
      }
    };
  }

  removeEventLister() {
    console.warn("removeEventLister() not implemented.");
  }

  startTabSynching() {
    console.warn("startTabSynching() not implemented.");
  }

  completeConnectionAfterRedirect() {
    console.warn("completeConnectionAfterRedirect() not implemented.");
  }

  get isAuthenticated() {
    return !!this.#userDetails;
  }

  requireAuth() {
    console.warn("requireAuth not implemented.");
  }

  connect(...args) {
    return othent.connect(...args).then((userDetails) => {
      this.#listeners.forEach((authEventListenerFn) => {
        authEventListenerFn(userDetails, !!authEventListenerFn);
      });

      return (this.#userDetails = userDetails);
    });
  }

  disconnect(...args) {
    this.#userDetails = null;

    return othent.disconnect(...args);
  }

  getActiveAddress() {
    return othent.getActiveAddress();
  }

  getActivePublicKey() {
    return othent.getActivePublicKey();
  }

  getAllAddresses() {
    console.warn("getAllAddresses() not implemented.");

    return [];
  }

  getWalletNames() {
    return othent.getWalletNames();
  }

  async getUserDetails() {
    return this.#userDetails;
  }

  getSyncActiveAddress() {
    console.warn("getSyncActiveAddress() not implemented.");

    return null;
  }

  getSyncActivePublicKey() {
    console.warn("getSyncActivePublicKey() not implemented.");

    return null;
  }

  getSyncAllAddresses() {
    console.warn("getSyncAllAddresses() not implemented.");

    return null;
  }

  getSyncWalletNames() {
    console.warn("getSyncWalletNames() not implemented.");

    return null;
  }

  getSyncUserDetails() {
    console.warn("getSyncUserDetails() not implemented.");

    return null;
  }

  sign(...args) {
    return othent.sign(...args);
  }

  dispatch(...args) {
    return othent.dispatch(...args);
  }

  encrypt(...args) {
    return othent.encrypt(...args);
  }

  decrypt(...args) {
    return othent.decrypt(...args);
  }

  signature(...args) {
    return othent.signature(...args);
  }

  signDataItem(...args) {
    return othent.signDataItem(...args);
  }

  signMessage(...args) {
    return othent.signMessage(...args);
  }

  async verifyMessage(data, signature, publicKey, options) {
    publicKey ||= await this.getActivePublicKey();

    return othent.verifyMessage(data, signature, publicKey, options);
  }

  privateHash(...args) {
    console.warn("privateHash() not implemented.");

    return null;
  }

  getArweaveConfig(...args) {
    console.warn("getArweaveConfig() not implemented.");

    return {};
  }

  getPermissions(...args) {
    console.warn("getPermissions() not implemented.");

    return [];
  }

  addToken(...args) {
    console.warn("addToken() not implemented.");
  }

  isTokenAdded(...args) {
    console.warn("isTokenAdded() not implemented.");
  }
}

export const b64ToUint8Array = (str) => str;
export const binaryDataTypeToString = (str) => str;
export const uint8ArrayTob64Url = (str) => str;
*/
