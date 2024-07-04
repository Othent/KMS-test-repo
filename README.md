# KMS-test-repo

A example test repo using Othent KMS.

You can see this live on [kms-demo.othent.io](https://kms-demo.othent.io)

## Running it locally:

```
  pnpm install
  pnpm start
```

To run it with a local `KeyManagementService` instance:

1. Clone [`@othent/kms`](https://github.com/Othent/KeyManagementService).

2. Inside `@othent/kms`, run `pnpm dev`.

3. Inside this repo, run `bun link @othent/kms`.


## TODO / Ideas / Improvements / Questions

- Migrate to Next.js and include a client-side and a SSR/SSG version?