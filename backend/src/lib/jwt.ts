import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  // Fail fast rather than silently signing tokens with "undefined"
  // eslint-disable-next-line no-console
  console.warn(
    "[WARN] AUTH_SECRET is not set. Set it in backend/.env before running in production."
  );
}

export interface JwtPayload {
  userId: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, AUTH_SECRET ?? "dev-insecure-secret", {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, AUTH_SECRET ?? "dev-insecure-secret") as JwtPayload;
}
