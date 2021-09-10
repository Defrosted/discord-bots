import { DiscordSignatureVerifier, VerificationError } from "./DiscordSignatureVerifier";

describe("DiscordSignatureVerifier", () => {
  const { TEST_VALID_DISCORD_PUBLIC_KEY } = process.env;
  if(!TEST_VALID_DISCORD_PUBLIC_KEY)
    throw new Error("Valid Discord public key is required for tests");

  describe(".verify()", () => {
    const validSignature = "cc672f51a61ccc4389120c71f139cef67adda2ac9d65b50a9efc60fe283c5bdc62a8b0022fb4644adcb376767631271780dfe04fb66576f7c28aa34dcd648008";
    const validTimestamp = "1630667328";
    const validBody = JSON.stringify({
      application_id: '881883845920698388',
      id: '883307536600690719',
      token: 'aW50ZXJhY3Rpb246ODgzMzA3NTM2NjAwNjkwNzE5OkJHRFBkcExVWkhsM0k5dUJiajFOb3dPQ20wNTVmaFp6WlBFQUtLa0RpQk1jTmhhYXEzSkRXMGxRYjZLTml4czdzTkdiNFlkWHdzMjFhSDNxWE5oU1d4ejF2ZzdYbEkxNjJRcHh4N2Q1SXViT21aTENDYjBBc25IUVAyR0Z2MElp',
      type: 1,
      user: {
        avatar: 'a_ae24b8bad2d7b044e6b6bafa1b9301b4',
        discriminator: '6485',
        id: '120851896876531712',
        public_flags: 0,
        username: 'Defrosted'
      },
      version: 1
    });

    it("Verifies valid signature", () => {
      const verifier = new DiscordSignatureVerifier(TEST_VALID_DISCORD_PUBLIC_KEY);
      expect(
        () => verifier.verify(validSignature, validTimestamp, validBody)
      ).not.toThrow();
    });

    it("Throws on invalid public key", () => {
      const verifier = new DiscordSignatureVerifier(undefined);
      expect(
        () => verifier.verify(validSignature, validTimestamp, validBody)
      ).toThrow(VerificationError.MISSING_PUBLIC_KEY);
    });

    it("Throws on missing signature or timestamp", () => {
      const verifier = new DiscordSignatureVerifier(TEST_VALID_DISCORD_PUBLIC_KEY);
      expect(
        () => verifier.verify(undefined, validTimestamp, validBody)
      ).toThrow(VerificationError.MISSING_SIGNATURE_TIMESTAMP);
      expect(
        () => verifier.verify(validSignature, undefined, validBody)
      ).toThrow(VerificationError.MISSING_SIGNATURE_TIMESTAMP);
    });

    it("Throws on invalid signature", () => {
      const verifier = new DiscordSignatureVerifier(TEST_VALID_DISCORD_PUBLIC_KEY);
      expect(
        () => verifier.verify(validSignature, validTimestamp, "")
      ).toThrow(VerificationError.INVALID_SIGNATURE);
    })
  })
});
