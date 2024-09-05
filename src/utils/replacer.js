import { uint8ArrayTob64Url } from "@othent/kms";

// When using @othent/kms v1:
// const uint8ArrayTob64Url = (obj) => JSON.stringify(obj);

export function replacer(_, value) {
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
