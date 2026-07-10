const encoder = new TextEncoder();

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function sameBytes(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function validBasicAuth(request, username = process.env.APP_USERNAME, password = process.env.APP_PASSWORD) {
  if (!username || !password) return false;
  const authorization = typeof request.headers?.get === "function"
    ? request.headers.get("authorization")
    : request.headers?.authorization;
  if (!authorization?.startsWith("Basic ")) return false;

  try {
    const bytes = Uint8Array.from(atob(authorization.slice(6)), (character) => character.charCodeAt(0));
    const credentials = new TextDecoder().decode(bytes);
    const separator = credentials.indexOf(":");
    if (separator < 0) return false;
    const [actualUser, actualPassword] = [credentials.slice(0, separator), credentials.slice(separator + 1)];
    const [userHash, expectedUserHash, passwordHash, expectedPasswordHash] = await Promise.all([
      digest(actualUser), digest(username), digest(actualPassword), digest(password),
    ]);
    return sameBytes(userHash, expectedUserHash) && sameBytes(passwordHash, expectedPasswordHash);
  } catch {
    return false;
  }
}

export const challengeHeaders = { "WWW-Authenticate": 'Basic realm="Campaign Control Room", charset="UTF-8"' };
