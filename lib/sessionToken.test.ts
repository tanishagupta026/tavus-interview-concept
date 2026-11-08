import { describe, expect, it } from "vitest";
import { issueToken, verifyToken } from "./sessionToken";

describe("session token", () => {
  it("accepts its own token", () => {
    expect(verifyToken(issueToken("s"), "s")).toBeTruthy();
  });
  it("rejects a token signed with another secret or tampered with", () => {
    const t = issueToken("s");
    expect(verifyToken(t, "other")).toBeNull();
    expect(verifyToken(t.replace(/^\d+/, "1"), "s")).toBeNull();
    expect(verifyToken("junk", "s")).toBeNull();
  });
  it("expires after two hours", () => {
    const t = issueToken("s", 0);
    expect(verifyToken(t, "s", 2 * 60 * 60_000 + 1)).toBeNull();
  });
});
