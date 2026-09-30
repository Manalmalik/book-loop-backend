import { expressjwt as jwt } from "express-jwt";
import type { Request } from "express";

const tokenSecret = process.env.TOKEN_SECRET;

if (!tokenSecret) {
  throw new Error("TOKEN_SECRET is not defined");
}

function getTokenFromHeaders(req: Request): string | undefined {
  const authorization = req.headers.authorization;

  if (authorization && authorization.split(" ")[0] === "Bearer") {
    return authorization.split(" ")[1];
  }

  return undefined;
}

export const isAuthenticated = jwt({
  secret: tokenSecret,
  algorithms: ["HS256"],
  requestProperty: "payload",
  getToken: getTokenFromHeaders,
});