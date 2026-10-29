const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function harness({
  register = false,
  confirming = false,
  recovering = false,
  failure = false,
  session = true,
} = {}) {
  const values = [
    "test@example.com",
    "Tester",
    "password123",
    "password123",
    false,
    false,
    "",
    "",
    recovering,
    confirming,
    0,
    "123456",
  ];
  let cursor = 0;
  const main = {
    key: "existing-tabs",
    name: "MainApp",
    state: { index: 2, routes: [{ name: "Favorites" }] },
  };
  let routes = [main, { name: "Login" }, { name: "Register" }];
  const replacements = [];
  const navigation = {
    getState: () => ({ routes }),
    reset: (state) => {
      routes = state.routes;
    },
    replace: (name) => {
      replacements.push(name);
      routes[routes.length - 1] = { name };
    },
  };
  const operation = async () => {
    if (failure) throw Error("Invalid login credentials");
    return session;
  };
  const react = {
    createElement: (type, props, ...children) => ({
      type,
      props: props || {},
      children,
    }),
    useState: () => {
      const i = cursor++;
      return [
        values[i],
        (v) => {
          values[i] = typeof v === "function" ? v(values[i]) : v;
        },
      ];
    },
    useEffect: () => {},
  };
  const native = new Proxy(
    { StyleSheet: { create: (s) => s }, Platform: { OS: "ios" } },
    { get: (o, k) => o[k] || k },
  );
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync("src/components/AuthScreen.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
    },
  ).outputText;
  new Function("exports", "require", source)(exports, (name) => {
    if (name === "react") return react;
    if (name === "react-native") return native;
    if (name === "@react-navigation/native")
      return { useNavigation: () => navigation };
    if (name === "../contexts/AuthContext")
      return {
        useAuth: () => ({
          signIn: operation,
          signUp: operation,
          confirmEmail: operation,
          resetPassword: operation,
        }),
      };
    if (name === "../theme") return { colors: {}, layout: {} };
    return new Proxy({}, { get: (_, key) => key });
  });
  const render = () => {
    cursor = 0;
    return exports.AuthScreen({ register });
  };
  function nodes(tree) {
    return !tree || typeof tree !== "object"
      ? []
      : [tree, ...tree.children.flat(Infinity).flatMap(nodes)];
  }
  function text(tree) {
    return typeof tree === "string"
      ? tree
      : tree && typeof tree === "object"
        ? tree.children.flat(Infinity).map(text).join("")
        : "";
  }
  return {
    main,
    replacements,
    values,
    routes: () => routes,
    submit: () =>
      nodes(render())
        .find(
          (n) =>
            n.props.onPress &&
            /^(Confirm email|Set new password|Create account|Sign in) →$/.test(
              text(n),
            ),
        )
        .props.onPress(),
    press: (label) =>
      nodes(render())
        .find((n) => n.props.onPress && text(n).includes(label))
        .props.onPress(),
  };
}

for (const [label, options] of [
  ["login", {}],
  ["email confirmation", { register: true, confirming: true }],
  ["immediate signup", { register: true }],
]) {
  test(`${label} removes completed auth history and preserves existing tabs`, async () => {
    const h = harness(options);
    await h.submit();
    assert.deepEqual(h.routes(), [h.main]);
  });
}
test("failed login preserves form and navigation", async () => {
  const h = harness({ failure: true });
  await h.submit();
  assert.equal(h.routes().length, 3);
  assert.equal(h.values[6], "Invalid login credentials");
});
test("signup awaiting confirmation stays in auth", async () => {
  const h = harness({ register: true, session: false });
  await h.submit();
  assert.equal(h.routes().length, 3);
  assert.equal(h.values[9], true);
});
test("password recovery stays on sign-in form", async () => {
  const h = harness({ recovering: true });
  await h.submit();
  assert.equal(h.routes().length, 3);
  assert.equal(h.values[8], false);
  assert.match(h.values[7], /Password updated/);
});
test("switching auth forms replaces rather than stacks", () => {
  for (const register of [false, true]) {
    const h = harness({ register });
    h.press(register ? "Already have an account?" : "New here?");
    assert.deepEqual(h.replacements, [register ? "Login" : "Register"]);
    assert.equal(h.routes().length, 3);
  }
});
test("guest exit clears unfinished auth history", () => {
  const h = harness();
  h.press("Continue exploring");
  assert.deepEqual(h.routes(), [h.main]);
});
