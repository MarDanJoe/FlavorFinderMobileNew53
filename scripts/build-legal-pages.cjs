// Generate public, script-free pages from the same policy content used in the app.
const fs = require("node:fs");
const path = require("node:path");
const policies = require("../src/legal/policies.json");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const out = path.join(__dirname, "../public/legal");
const docs = path.join(__dirname, "../docs");
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(docs, { recursive: true });
for (const type of ["privacy", "terms", "support"]) {
  const document = policies[type];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(document.title)} · Flavor Finder</title><style>body{margin:0;background:#F8F6F0;color:#233329;font:17px/1.65 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:32px 24px 60px}nav{display:flex;gap:24px;flex-wrap:wrap}a{color:#315E48;text-underline-offset:4px}h1{font-size:38px;line-height:1.2}h2{font-size:22px;margin-top:32px}.brand{font-weight:800;font-size:22px}.meta{color:#59665D;font-size:14px}footer{border-top:1px solid #D7DED6;margin-top:36px;padding-top:24px}a:focus-visible{outline:3px solid #B95737;outline-offset:4px}</style></head><body><main><p class="brand">flavorfinder.</p><nav aria-label="Policies"><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="support.html">Support</a></nav><h1>${escape(document.title)}</h1><p class="meta">Last updated ${escape(policies.updated)} · ${escape(policies.operator)}</p><p>${escape(document.intro)}</p>${document.sections.map((section) => `<section><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></section>`).join("")}<footer><p>Contact: <a href="mailto:${escape(policies.supportEmail)}">${escape(policies.supportEmail)}</a></p>${document.links.map((link) => `<p><a href="${escape(link.url)}">${escape(link.label)}</a></p>`).join("")}</footer></main></body></html>`;
  fs.writeFileSync(path.join(out, `${type}.html`), html);
  fs.writeFileSync(path.join(docs, `${type}.html`), html);
}
fs.writeFileSync(
  path.join(docs, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flavor Finder · Policies and Support</title><style>body{margin:0;background:#F8F6F0;color:#233329;font:18px/1.6 system-ui,sans-serif}main{max-width:700px;margin:auto;padding:60px 24px}h1{font-size:40px;line-height:1.2}a{color:#315E48}nav{display:flex;gap:24px;flex-wrap:wrap;padding:20px 0}</style></head><body><main><h1>flavorfinder.</h1><p>Discover good food. Choose together.</p><nav aria-label="Policies and support"><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Use</a><a href="support.html">Support</a></nav><p>For help, contact <a href="mailto:${escape(policies.supportEmail)}">${escape(policies.supportEmail)}</a>.</p></main></body></html>\n`,
);
console.log(
  "Generated privacy, terms and support pages in public/legal and docs. Publish docs updates to refresh GitHub Pages.",
);
