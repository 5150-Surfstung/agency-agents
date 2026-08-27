// ONE definition of "the assistant declined to invent something." The duel
// scores off it and the selftest asserts on it — they lived as two separate
// regexes and drifted, so production flagged a perfectly good refusal
// ("that's not something I have on the sheet") as a failure. One home now.
//
// It is read from the reply's OWN words. We never assert a refusal the
// assistant didn't actually make.
export const REFUSAL =
  /don'?t want to guess|not (on|in) (the|my)|not something i (have|know)|isn'?t something i (have|know)|don'?t have (that|a|the|it)|do not have that|can'?t confirm|cannot confirm|i don'?t know|would need to confirm|i'?d have to check|check on that|have .{0,24} confirm|get you the real answer|not in what i have|not listed on/i;

export function isRefusal(reply: string): boolean {
  return REFUSAL.test(reply);
}
