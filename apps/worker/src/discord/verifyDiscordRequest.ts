import nacl from "tweetnacl";

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]+$/iu.test(hex) || hex.length % 2 !== 0) {
    throw new Error("Invalid hex input");
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

export function verifyDiscordRequest({
  body,
  publicKey,
  signature,
  timestamp
}: {
  body: string;
  publicKey: string;
  signature: string | null;
  timestamp: string | null;
}): boolean {
  if (!signature || !timestamp) {
    return false;
  }

  try {
    const message = new TextEncoder().encode(`${timestamp}${body}`);
    return nacl.sign.detached.verify(
      message,
      hexToBytes(signature),
      hexToBytes(publicKey)
    );
  } catch {
    return false;
  }
}
