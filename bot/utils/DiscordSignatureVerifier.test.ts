import { DiscordSignatureVerifier, VerificationError } from "./DiscordSignatureVerifier";

describe("DiscordSignatureVerifier", () => {
  const { TEST_VALID_DISCORD_PUBLIC_KEY } = process.env;
  if(!TEST_VALID_DISCORD_PUBLIC_KEY)
    throw new Error("Valid Discord public key is required for tests");

  describe(".verify()", () => {
    const validSignature = "2a8101051e97fc04246ea518fb2bfa072cd4dfe1cf2dcc92c39d3207af54544935486ae4b8d63d9655a4a577c857792700a2339a71a248e9e372f872b75d5b03";
    const validTimestamp = "1631296745";
    const validBody = JSON.stringify({
      application_id: '881883845920698388',
      id: '885947495610458183',
      token: 'aW50ZXJhY3Rpb246ODg1OTQ3NDk1NjEwNDU4MTgzOjVEQkRaOTMyRzRiZXg0Y0tDbE16ZWViN3Y0Y1FaYjhlZFQwV1Q4YnBBeVB6OFJPY3V2RFBUSWZtNkhkWlFxZ3VKVkE0WkxFdmw5OWM0Z0ppcXBTMndsaHF4cG1oZ2J5V0EzS0ZWUHBaOGtmOEVTajRCUVJJdXJCWWVYalNOTW9B',
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
