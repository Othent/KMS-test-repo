# Othent KMS JS SDK Demo

An example test repo using Othent KMS JS SDK to manage Arweave wallets backend by Auth0 and Google Key Management Service.

Try our demo at [kms-demo.othent.io](https://kms-demo.othent.io)!

<br />

[![Othent KMS JS SDK NPM page](https://img.shields.io/npm/v/%40othent%2Fkms?style=for-the-badge&color=%23CC3534)](https://www.npmjs.com/package/@othent/kms)

<br />

[![Othent KMS JS SDK NPM demo](./public/othent-kms-demo-screenshot.png)](https://kms-demo.othent.io)

<br />

Learn how to set it up at https://docs.othent.io or looking at our demo's code at https://github.com/Othent/KMS-test-repo.

<br />

## Running it locally:

### Wander Connect

```
pnpm install
pnpm start
```

To run it with a local `Wander` repo:

1.  Clone [`@wanderapp/connect`](https://github.com/wanderwallet/Wander) in a `wander` directory
    that's inside the same directory where you cloned this project:

           /KMS-test-repo
           /wander/Wander

2.  Inside `/wander/Wander` run `yarn install` and `yarn build:wallet-api`.

3.  Inside `/wander/Wander/wander-connect-sdk`, run `pnpm install` and `pnpm dev`.

4.  Inside this repo, run `pnpm link-connect`. See [`pnpm link`](https://pnpm.io/cli/link).

    You can later revert this with `pnpm install-connect`.

<br />

### Othent

```
pnpm install
pnpm start
```

To run it with a local `KeyManagementService` repo:

1.  Clone [`@othent/kms`](https://github.com/Othent/KeyManagementService) in the same directory where
    you cloned this project:

           /KMS-test-repo
           /KeyManagementService

2.  Inside `@othent/kms` (`../KeyManagementService`), run `pnpm dev`.

3.  Inside this repo, run `pnpm link-othent`. See [`pnpm link`](https://pnpm.io/cli/link).

    You can later revert this with `pnpm install-othent`.

<br />
