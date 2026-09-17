import { MARKET, marketFacts, spark, sparkEnd } from "@/lib/market";

// THE ONLY THING ON THIS PAGE THAT IS NOT AN ARGUMENT.
//
// Everywhere else the invite says what these tools do. Here it shows an agent
// numbers about their own market that they already know to be true, and that
// is what makes the rest of the page believable. It also demonstrates the
// exact capability the hour teaches, which is better than describing it.
//
// Design notes worth keeping:
//  · One accent. The validator put moss and clay 2.4 ΔE apart under
//    protanopia — indistinguishable to a red-green colourblind reader, and
//    this audience is a few hundred working agents. So direction is carried
//    by a signed number and a word, never by hue, and every sparkline is the
//    same gold.
//  · Figures are large and gold; all supporting text wears text tokens. A
//    colour never carries meaning that the words do not also carry.
//  · Twelve points do not need a tooltip on a phone. The accessible path is
//    the real table underneath, which doubles as the proof a skeptic wants.
//  · No axes, because a sparkline with axes is a bad line chart. First and
//    last values are labelled instead.

const W = 132;
const H = 34;

function Spark({ series, label }: { series: readonly number[]; label: string }) {
  const end = sparkEnd(series, W, H);
  return (
    <svg
      className="spark"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={label}
    >
      <path d={spark(series, W, H)} fill="none" stroke="var(--color-gold)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <circle cx={end.x} cy={end.y} r="4" fill="var(--color-gold-bright)" />
    </svg>
  );
}

export function MarketPanel() {
  const f = marketFacts();
  const money = (n: number) => `$${n.toLocaleString("en-US")}`;
  // One decimal always: 98.0 must not print as "98" beside "95.9%".
  const pct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <section className="market">
      <h2 className="display">
        You don&rsquo;t have to take my word for what it answers.
      </h2>
      <p className="market-lede">
        These came out of the {MARKET.source} on {MARKET.pulledOn} — the same
        connector we switch on in the room — for {MARKET.scope}, through{" "}
        {MARKET.through}. Check any of them against what you already know.
      </p>

      {/* The hero: one number, and it is the one that costs them money. */}
      <div className="market-hero">
        <p className="market-hero-fig display">{money(f.gapDollars)}</p>
        <p className="market-hero-say">
          The median Charleston home sold for {money(f.median)} in{" "}
          {MARKET.through.split(" ")[0]}. Sellers got <b>{pct(f.onLast)}</b> of what
          they were asking by then — and <b>{pct(f.onFirst)}</b> of what they asked
          at the start. Those {f.gapPoints} points are what the reductions
          along the way cost: about {money(f.gapDollars)} on a median deal.
        </p>
      </div>

      <dl className="market-grid">
        <div>
          <dt>Average days on market</dt>
          <dd className="display">{f.domNow}</dd>
          <Spark series={MARKET.dom} label={`Average days on market, twelve months to ${MARKET.through}`} />
          <p>
            {Math.abs(f.domDelta)} days {f.domDelta < 0 ? "faster" : "slower"} than{" "}
            {MARKET.months[0]} last year, when it was {f.domThen}.
          </p>
        </div>
        <div>
          <dt>Homes for sale</dt>
          <dd className="display">{f.activeNow}</dd>
          <Spark series={MARKET.active} label={`Active listings, twelve months to ${MARKET.through}`} />
          <p>
            {Math.abs(f.activeDelta)} {f.activeDelta > 0 ? "more" : "fewer"} than a
            year ago, when {f.activeThen} were listed.
          </p>
        </div>
        <div>
          <dt>Of the first asking price</dt>
          <dd className="display">{pct(f.onFirst)}</dd>
          <Spark series={MARKET.ratioOriginal} label={`Percent of original asking price achieved, twelve months to ${MARKET.through}`} />
          <p>
            The number that moves when a listing gets priced right the first
            time — and the one almost nobody pulls.
          </p>
        </div>
      </dl>

      <p className="market-turn">
        More houses for sale, selling faster, and closer to asking, all at once.
        That is not what most people in this market will tell you is happening.
        Finding it out took one question typed in English — and on Friday it is
        your farm, your price band, your question.
      </p>

      {/* The table view the numbers above are drawn from. It is here for
          accessibility and it is here because a skeptic should be able to
          audit the picture. */}
      <details className="market-table">
        <summary>See all twelve months</summary>
        <table>
          <caption>
            {MARKET.scope}, {MARKET.months[0]} of the prior year through{" "}
            {MARKET.through}. {MARKET.source}, pulled {MARKET.pulledOn}.
          </caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Days</th>
              <th scope="col">For sale</th>
              <th scope="col">Sold</th>
              <th scope="col">Of first ask</th>
              <th scope="col">Median</th>
            </tr>
          </thead>
          <tbody>
            {MARKET.months.map((m, i) => (
              <tr key={m}>
                <th scope="row">{m}</th>
                <td>{MARKET.dom[i]}</td>
                <td>{MARKET.active[i]}</td>
                <td>{MARKET.sold[i]}</td>
                <td>{pct(MARKET.ratioOriginal[i])}</td>
                <td>{money(MARKET.medianSold[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
