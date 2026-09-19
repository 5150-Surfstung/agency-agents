// WHERE CLAUDE ACTUALLY COMES FROM.
//
// The invite asks for one thing — Claude on the phone and on the laptop before
// the 2nd — and then, until now, left somebody to go find it. Every minute of
// the hour spent on setup is a minute nobody builds in, so the links live in
// one place and go everywhere the instruction goes: the page, the confirmation
// email, and Val's own fact sheet so it can hand them over when asked.
//
// The App Store id was confirmed against Apple's lookup API rather than typed
// from memory: 6473753684 is "Claude by Anthropic", seller Anthropic PBC. A
// dead install link in an invite is worse than no link at all.

export const INSTALL = {
  ios: "https://apps.apple.com/us/app/claude-by-anthropic/id6473753684",
  android: "https://play.google.com/store/apps/details?id=com.anthropic.claude",
  web: "https://claude.ai",
  desktop: "https://claude.ai/download",
} as const;
