import { isIP } from "node:net";

export const UNIDENTIFIED_CLIENT = "unidentified";

export class BodyTooLargeError extends Error {
  constructor(limitBytes: number) {
    super(`Request body over ${limitBytes} bytes`);
    this.name = "BodyTooLargeError";
  }
}

export function clientIp(headers: Headers): string {
  const cloudflareIp = headers.get("cf-connecting-ip")?.trim() ?? "";
  return isIP(cloudflareIp) ? cloudflareIp : UNIDENTIFIED_CLIENT;
}

export async function readJsonBody(request: Request, limitBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limitBytes) {
    throw new BodyTooLargeError(limitBytes);
  }
  if (!request.body) {
    return null;
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    received += value.byteLength;
    if (received > limitBytes) {
      await reader.cancel();
      throw new BodyTooLargeError(limitBytes);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
  } catch {
    return null;
  }
}
