const invitePage =
  "https://mardanjoe.github.io/FlavorFinderMobileNew53/join.html";

export function roomInviteMessage(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^(?:[0-9]{6}|[A-F0-9]{12})$/.test(normalized))
    throw new Error("This room code is invalid. Please reopen your room.");
  // Keep the room code in the fragment so hosting requests/referrers omit it.
  return `Help pick dinner on Flavor Finder!\nDownload or open the app and join my room:\n${invitePage}#room=${normalized}\n\nRoom code: ${normalized}\nJoin before the host starts voting. Beta access currently requires an invitation.`;
}
