const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const moduleUnderTest = { exports: {} };
const output = ts.transpileModule(
  fs.readFileSync("src/services/emailAuth.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
new Function("exports", "module", output)(
  moduleUnderTest.exports,
  moduleUnderTest,
);
const { confirmEmailCode, resendConfirmation } = moduleUnderTest.exports;
test("confirmation verifies the email OTP and requires an authenticated session", async () => {
  const calls = [];
  const client = {
    auth: {
      verifyOtp: async (args) => {
        calls.push(args);
        return {
          data: { session: { user: { id: "confirmed" } } },
          error: null,
        };
      },
    },
  };
  await confirmEmailCode(client, " Owner@Example.com ", " 12345678 ");
  assert.deepEqual(calls, [
    { email: "owner@example.com", token: "12345678", type: "email" },
  ]);
  await assert.rejects(
    confirmEmailCode(client, "owner@example.com", "not-a-code"),
    /numeric/,
  );
  assert.equal(calls.length, 1);
  await assert.rejects(
    confirmEmailCode(
      {
        auth: {
          verifyOtp: async () => ({ data: { session: null }, error: null }),
        },
      },
      "owner@example.com",
      "12345678",
    ),
    /did not complete/,
  );
  await assert.rejects(
    confirmEmailCode(
      {
        auth: {
          verifyOtp: async () => ({
            data: { session: null },
            error: { message: "Expired code" },
          }),
        },
      },
      "owner@example.com",
      "12345678",
    ),
    /Expired/,
  );
});
test("resend requests existing signup confirmation and rejects missing addresses before sending", async () => {
  const calls = [];
  const client = {
    auth: {
      resend: async (args) => {
        calls.push(args);
        return { error: null };
      },
    },
  };
  await resendConfirmation(client, " Owner@Example.com ");
  assert.deepEqual(calls, [{ type: "signup", email: "owner@example.com" }]);
  await assert.rejects(resendConfirmation(client, ""), /email address/);
  assert.equal(calls.length, 1);
  await assert.rejects(
    resendConfirmation(
      { auth: { resend: async () => ({ error: { message: "Rate limit" } }) } },
      "owner@example.com",
    ),
    /Rate limit/,
  );
});
