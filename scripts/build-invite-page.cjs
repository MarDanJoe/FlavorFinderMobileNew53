const fs = require("node:fs");
const path = require("node:path");
const links = require("../src/config/distribution.json");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
function validLink(value, host, prefix) {
  if (!value) return "";
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== host ||
    url.username ||
    url.password ||
    !url.pathname.startsWith(prefix)
  )
    throw new Error(
      "Use an official public app installation URL in distribution.json",
    );
  return url.href;
}
const appStore = validLink(links.appStoreUrl, "apps.apple.com", "/");
const beta = validLink(links.testFlightUrl, "testflight.apple.com", "/join/");
const url = appStore || beta;
const html = fs
  .readFileSync(path.join(__dirname, "templates/invite.html"), "utf8")
  .replace("__DOWNLOAD_URL__", escape(url))
  .replace("__DOWNLOAD_HIDDEN__", url ? "" : "hidden")
  .replace(
    "__DOWNLOAD_LABEL__",
    appStore ? "Download on the App Store" : "Get the beta on TestFlight",
  )
  .replace(
    "__DOWNLOAD_NOTE__",
    appStore
      ? "Download Flavor Finder for iPhone, then join your friends."
      : beta
        ? "Flavor Finder is in beta. Follow the TestFlight invitation to install it on your iPhone."
        : "Flavor Finder is currently invitation-only on TestFlight. Ask the person who invited you to arrange beta access. A public download link is not available yet.",
  );
fs.writeFileSync(path.join(__dirname, "../docs/join.html"), html);
