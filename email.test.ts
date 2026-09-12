import { describe, expect, it } from "vitest";
import { verifyEmailTransport } from "./email";

describe("Gmail SMTP transport", () => {
  it("authenticates with the configured app password", async () => {
    expect(process.env.GMAIL_APP_PASSWORD, "GMAIL_APP_PASSWORD must be configured").toBeTruthy();
    await expect(verifyEmailTransport()).resolves.toBe(true);
  }, 30000);
});
