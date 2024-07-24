# Othent KMS JS SDK Demo

An example test repo using Othent KMS JS SDK.

You can see this live on [kms-demo.othent.io](https://kms-demo.othent.io)

<img src="./public/othent-kms-demo-screenshot.png" />

<br />


## Running it locally:

```
  pnpm install
  pnpm start
```

To run it with a local `KeyManagementService` instance:

1. Clone [`@othent/kms`](https://github.com/Othent/KeyManagementService).

2. Inside `@othent/kms`, run `pnpm dev`.

3. Inside this repo, run `bun link @othent/kms`. See [`bun link`](https://bun.sh/docs/cli/link).

<br />


## This branch / PR:

- [x] Playground inline inputs / log.
- [x] Playground settings form.
- [x] Test with data from old arweave:
      - encrypt (old) => decrypt (new) works fine.
      - signMessage (old) => verifyMessage (new) works fine.
- [ ] Add inline inputs for results / outputs too.
- [ ] Persist input values in localStorage.
- [ ] Improve the LogItem component at the end.
- [ ] Create new TextInput and SelectInput components.
- [ ] Add indicators of the data type (b64, etc).

