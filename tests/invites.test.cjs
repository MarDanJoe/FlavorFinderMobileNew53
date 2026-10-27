const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const exportsObject = {};
new Function(
  "exports",
  ts.transpileModule(fs.readFileSync("src/services/invites.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(exportsObject);
test("room invites share a web install/open page with a private fragment and copyable code", () => {
  const text = exportsObject.roomInviteMessage(" 001234 ");
  assert.ok(
    text.includes(
      "https://mardanjoe.github.io/FlavorFinderMobileNew53/join.html#room=001234",
    ),
  );
  assert.ok(text.includes("Room code: 001234"));
  assert.ok(text.includes("before the host starts"));
  assert.ok(
    exportsObject
      .roomInviteMessage("aabbccddeeff")
      .includes("#room=AABBCCDDEEFF"),
  );
  for (const code of ["123", "<script>", "123456&url=https://example.com"])
    assert.throws(() => exportsObject.roomInviteMessage(code), /invalid/);
});
function page(hash) {
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id))
      elements.set(id, {
        removeAttribute(key) {
          delete this[key];
        },
      });
    return elements.get(id);
  };
  const context = {
    URLSearchParams,
    location: { hash },
    document: { getElementById: get },
    navigator: {
      clipboard: { writeText: async (code) => (context.copied = code) },
    },
    addEventListener() {},
  };
  const html = fs.readFileSync("docs/join.html", "utf8");
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
  return { get, context, html };
}
test("invite page preserves leading zeroes and only opens validated room deep links", async () => {
  const p = page("#room=001234");
  assert.equal(p.get("code").textContent, "001234");
  assert.equal(p.get("open").href, "flavorfinder://room/001234");
  assert.equal(p.get("open").hidden, false);
  await p.get("copy").onclick();
  assert.equal(p.context.copied, "001234");
  assert.equal(page("#room=AABBCCDDEEFF").get("open").hidden, false);
  for (const hash of [
    "",
    "#room=123",
    "#room=%3Cscript%3E",
    "#room=javascript:alert(1)",
  ]) {
    const invalid = page(hash);
    assert.equal(invalid.get("open").hidden, true);
    assert.equal(invalid.get("open").href, undefined);
    assert.equal(invalid.get("copy").disabled, true);
  }
});
test("clipboard failure gives a manual path and unpublished downloads are not invented", async () => {
  const p = page("#room=123456");
  p.context.navigator.clipboard.writeText = async () => {
    throw Error("denied");
  };
  await p.get("copy").onclick();
  assert.match(p.get("status").textContent, /Select and copy/);
  const links = JSON.parse(
    fs.readFileSync("src/config/distribution.json", "utf8"),
  );
  if (!links.testFlightUrl && !links.appStoreUrl) {
    assert.match(p.html, /id="download"[^>]*hidden/);
    assert.match(p.html, /invitation-only/);
  }
  assert.ok(!p.html.includes("__DOWNLOAD_"));
  assert.match(p.html, /name="referrer" content="no-referrer"/);
});

function generate(links) {
  let html;
  const mockFs = {
    ...fs,
    writeFileSync: (_path, value) => {
      html = value;
    },
  };
  const source = fs.readFileSync("scripts/build-invite-page.cjs", "utf8");
  new Function("require", "__dirname", source)(
    (name) =>
      name === "../src/config/distribution.json"
        ? links
        : name === "node:fs"
          ? mockFs
          : require(name),
    require("node:path").resolve("scripts"),
  );
  return html;
}
test("published download configuration provides an official TestFlight button", () => {
  const html = generate({
    testFlightUrl: "https://testflight.apple.com/join/AbCd1234",
    appStoreUrl: "",
  });
  assert.match(html, /href="https:\/\/testflight.apple.com\/join\/AbCd1234"/);
  assert.doesNotMatch(html, /id="download"[^>]*hidden/);
  assert.match(html, /Get the beta on TestFlight/);
});
test("download configuration refuses unofficial or executable destinations", () => {
  for (const testFlightUrl of [
    "javascript:alert(1)",
    "https://example.com/join/AbCd1234",
    "https://testflight.apple.com.evil.test/join/AbCd1234",
  ]) {
    assert.throws(
      () => generate({ testFlightUrl, appStoreUrl: "" }),
      /official/,
    );
  }
});
