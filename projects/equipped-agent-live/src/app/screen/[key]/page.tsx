// THE AUDIENCE SCREEN. This is what goes on the projector or the TV, and the
// only thing that ever should: slides, games, boards, and a join QR that is
// actually big enough to scan from the back row. No cues, no controls, no
// leads, no HUD — nothing the presenter would not want read aloud.

import { ScreenClient } from "./screen-client";

export const dynamic = "force-dynamic";

export default async function ScreenPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <ScreenClient presenterKey={key} />;
}
