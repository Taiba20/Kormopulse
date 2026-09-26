import { OAuth2Client } from "google-auth-library";
import { config } from "../config/index.js";

let client;

/**
 * Verifies a Google Identity Services ID token and returns the trusted profile.
 * Throws when Google sign-in is not configured or the token is invalid.
 */
const defaultVerifier = async (credential) => {
  if (!config.googleClientId) {
    throw new Error("Google sign-in is not configured on this server");
  }
  client ??= new OAuth2Client(config.googleClientId);
  const ticket = await client.verifyIdToken({ idToken: credential, audience: config.googleClientId });
  const payload = ticket.getPayload();
  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    name: payload.name,
    picture: payload.picture,
  };
};

let verifier = defaultVerifier;

export const verifyGoogleCredential = (credential) => verifier(credential);

/** Test seam: lets tests replace the network call to Google. */
export const setGoogleVerifier = (fn) => {
  verifier = fn || defaultVerifier;
};
