// The hour. Slide order IS the run sheet — polls sit exactly where the
// facilitator outline puts them. Every number here traces to the 2025 NAR
// member data or the published Stonoview Neighborhood Index; nothing invented.

import type { Slide } from "./types";

export const DECK: Slide[] = [
  {
    id: "standby",
    kind: "standby",
    // Nothing renders from these on the projector — the standby screen is the
    // orb and the wordmark, full stop. They exist so the phone mirror and the
    // console have something honest to say about where the room is.
    heading: "VAL",
    eyebrow: "Standing by",
    cue: "THE HOLDING SCREEN. Leave this up while the room fills \u2014 doors open, people scanning, nobody rushed. Do not explain it. Somebody will ask 'what is that' before you have said a word, and that question is a better opening than any sentence you could put on a slide; the honest answer is 'that's Val, and you'll meet her in about forty minutes.' Advance when you're ready to start and the room's phones are in.",
  },
  {
    id: "title",
    kind: "title",
    eyebrow: "The AGENT Connection™ · Charleston, SC",
    heading: "The Equipped Agent",
    lines: [
      "The Claude Course — sponsored by Mike Olson with The AGENT Connection.",
      "Most agents can sell. A few can prompt. Almost none can build.",
      "One hour. Working systems, live games, and things you actually keep.",
    ],
    cue: "Doors open. PIN on screen. Phones welcome — they're not a distraction tonight, they're the equipment.",
  },
  {
    id: "poll-comfort",
    kind: "poll",
    eyebrow: "First — a totally anonymous confession",
    heading: "Real talk: where are you and AI right now?",
    poll: {
      key: "comfort",
      question: "Real talk: where are you and AI right now?",
      options: [
        "Never touched it — be gentle",
        "We've talked a few times",
        "I use it every week for real work",
        "My assistant has an assistant",
      ],
    },
    cue: "THE FIRST THING THAT HAPPENS, before you have even said your own name: 'phones out — first question, and it's anonymous.' That is deliberate. Forty phones doing something inside ninety seconds proves the room's tech works before you need it to, and it tells you who you're talking to before you introduce yourself. Let the bars climb while you tease each answer out loud ('be gentle — I love it'). This poll is also your instrument panel: whatever the split is, you'll teach both lanes on the next two slides, and now you know which lane is bigger. Say that out loud too — 'nobody's getting left behind and nobody's getting bored.'",
  },
  {
    id: "poll-using",
    kind: "poll",
    eyebrow: "Data before opinions",
    heading: "What are you actually using AI for today?",
    poll: {
      key: "using",
      question: "What are you actually using AI for today?",
      options: [
        "Listing descriptions & emails",
        "Research, CMAs, summaries",
        "Social content",
        "Nothing yet — that's literally why I'm here",
      ],
    },
    cue: "Second poll, faster energy. On the reveal, narrate the split: 'listing copy is where everyone starts — and it is the SHALLOWEST end of the pool. By minute forty you'll be somewhere no listing-copy prompt can follow.' The 'nothing yet' number is your permission slip to keep every single thing hands-on.",
  },
  {
    id: "host",
    valSymbol: "lens",
    kind: "content",
    eyebrow: "Your host",
    heading: "Mike Olson",
    stats: [
      { value: "20+", label: "years in real estate — top producer, still selling" },
      { value: "1,800+", label: "homes inspected — residential and commercial" },
      { value: "346", label: "multifamily units owned in part — hands on, not passive" },
    ],
    lines: [
      "Director of AI Strategy & Innovation · The AGENT Connection™",
      "Inspector → Agent → Multifamily investor → Builder. Every system you'll see tonight was built from inside the business, not sold into it.",
      "REALTOR® · eXp Realty · Charleston, SC",
      "Real experience. Smarter tools. Bigger opportunities.",
    ],
    link: {
      href: "/api/vcard",
      label: "Save my contact",
      note: "843-442-7992 \u00b7 mike@mikeolsonre.com \u2014 scanning it opens Add Contact",
    },
    cue: "Thirty seconds, first person, let the numbers count up behind you: 1,800 crawlspaces taught me what agents miss, 346 doors taught me scale, twenty years of closings taught me what's actually worth automating. You have already seen the room's comfort split, so CALIBRATE: if they skewed 'be gentle', lean on the crawlspaces and the 346 doors — you are one of them, not a tech guy. If they skewed advanced, lean on 'I built these.' Then straight into the promise; do not let this slide breathe.",
  },
  {
    id: "promise",
    valSymbol: "key",
    kind: "content",
    eyebrow: "The deal for the next hour",
    heading: "You don't leave with notes. You leave with things that run.",
    lines: [
      "ONE — Claude on the work you already do. Today's follow-up, this week's dates.",
      "TWO — your own Val. Built here, on your account, in your voice. Yours to keep.",
      "THREE — the new flexmls MCP, wired live on the screen, on your own login.",
    ],
    quote: "If you walk out of here with nothing running, I wasted your lunch.",
    cue: "THE CONTRACT WITH THE ROOM — word for word what the ad promised them, which is deliberate, so do not improvise a fourth. Say all three out loud and point at THREE twice: almost nobody in this market has connected Claude to the MLS and it is why most of them are sitting here. Then tell them the prompt for TWO lands on their screen in about ten minutes, so they are watching for it rather than surprised by it. All three are built and you will deliver all three.",
  },
  {
    id: "the-send",
    valSymbol: "key",
    kind: "content",
    eyebrow: "Val is emailing the room · open your laptop",
    heading: "Build your own Val. Right now, while we sit here.",
    lines: [
      "Open the address below on your laptop. One button copies the prompt.",
      "Paste it into Claude and press enter. A free account is fine.",
      "It writes you a file. Save it, double-click it — that is your own mark, running.",
    ],
    link: {
      href: "/prompt",
      label: "the-equipped-agent.vercel.app/prompt",
      note: "it is on your phone and in your inbox too — whichever is faster",
    },
    quote: "Since we have been sitting here, I had my assistant email you the thing that builds yours.",
    cue: "PRESS SEND ON YOUR CONSOLE BEFORE YOU SAY A WORD and wait for the delivered count to move. Do not say the line until you can see it landed — then say it. The address is already on the wall and on their phones, so if anybody's email is slow it does not matter and nobody in the room can tell. Give them ninety seconds of quiet to paste it. Their Val builds in the background while you carry on, and by the listing demo everybody has an orb on their screen. If somebody is stuck it is almost always that they are not signed in to Claude — that is a neighbour's job, not yours. Keep moving.",
  },
  {
    id: "open-floor",
    kind: "openfloor",
    eyebrow: "Open floor · Val is listening",
    heading: "Brag or confess. Both count.",
    lines: [
      "Type it on your phone: the best thing AI has done for your business this month — or the worst.",
      "The fail. The made-up comp. The email you're glad you read twice. Anonymous, always.",
      "I'll read them out. Val answers on the wall.",
    ],
    cue: "THIS IS THE FIRST TIME VAL DOES SOMETHING FOR A PERSON IN THIS ROOM. Give them sixty seconds to type — the screen says Val is listening and it means it. Then READ ONE OUT LOUD before you tap it, so the room hears it in your voice first. Tap it, and Val takes it in on screen and answers. Take a confession second: the fails are your gold, and watching Val treat a fail as the most useful thing said all night is worth more than any brag. Nothing reaches the wall until YOU tap it — the pile is on your console only. Two or three entries, no more, then move.",
  },
  {
    id: "install",
    valSymbol: "phone",
    kind: "content",
    eyebrow: "Everybody · phones up · three minutes",
    heading: "Get Claude. Right now, in this room.",
    lanes: [
      {
        tag: "Never used it",
        heading: "Four taps and you're in",
        lines: [
          "App Store or Google Play → search Claude → it's the one by Anthropic.",
          "Sign in with the email you actually check.",
          "Start on the free tier. Nothing in this hour requires you to pay.",
          "Say hello to it. That's the whole first step — there is no wrong way to start.",
        ],
      },
      {
        tag: "Already using it",
        heading: "Set it up like a professional",
        lines: [
          "Open a fresh chat. Clean context beats a cluttered one, every time.",
          "Use Projects: one per farm, one per listing, one per live transaction.",
          "If you've only ever used the phone app, open claude.ai on a laptop — that's where the real work happens.",
          "Paste your sources IN. The model is smart; it is not psychic about your market.",
        ],
      },
    ],
    link: {
      href: "/kit#install",
      label: "Install + first-day guide",
      note: "the steps, the plans in plain English, and three things to try before you leave the room",
    },
    cue: "WALK THE ROOM. This is the slide where you earn the whole hour — nobody moves on until every phone in the room has Claude open. Ask out loud: 'who needs a hand?' and then actually go stand next to them. The QR is the safety net for anyone who falls behind or wants to redo it tonight. Do not rush this to stay on time; the rest of the deck compresses, this doesn't.",
  },
  {
    id: "how-to-talk",
    valSymbol: "contract",
    kind: "content",
    eyebrow: "The one skill under everything else",
    heading: "Most agents get bad AI because they ask like it's Google.",
    lanes: [
      {
        tag: "New to this",
        heading: "Four things make a prompt work",
        lines: [
          "WHO it is — 'You're my listing coordinator.'",
          "WHAT you want — one job, said plainly.",
          "WHAT IT MUST USE — paste the real data in. Don't make it guess.",
          "HOW LONG — 'three sentences' or 'a one-page brief.'",
          "Then the magic sentence: 'Ask me anything you're missing before you start.'",
        ],
      },
      {
        tag: "Already using it",
        heading: "Stop prompting. Start briefing.",
        lines: [
          "Give it the SOURCE, not your summary of the source.",
          "Make it show its work: 'cite which line you got that from.'",
          "Build it once, reuse it forever — a Project beats a fresh chat.",
          "Ask it to argue with you before it agrees with you.",
          "And the rule that never changes: never let it say a number you can't defend.",
        ],
      },
    ],
    quote: "That last sentence — 'ask me what you're missing' — is worth more than every prompt template on the internet.",
    cue: "DO THIS LIVE, on your own screen, twice. Ask a bad one ('write a listing description for my house') and read the mush out loud. Then ask the same thing the right way with a real fact sheet pasted in, and let the room hear the difference. Sixty seconds each. This is the slide people text their friends about.",
  },
  {
    id: "poll-time",
    kind: "poll",
    eyebrow: "Now the expensive question",
    heading: "Where does your week actually go?",
    poll: {
      key: "time",
      question: "Where does your week actually go?",
      options: [
        "Chasing and answering leads",
        "Paperwork, dates, deadlines",
        "Marketing and content",
        "Actual showings and appointments",
      ],
    },
    cue: "Open, let it climb, reveal. Whatever wins: 'AI eats that first — and before this hour is out, you'll have watched it.' Remember the winner; call back to it on the everyday-ten slide.",
  },
  {
    id: "split",
    valSymbol: "record",
    kind: "content",
    eyebrow: "The split",
    heading: "The line isn't new vs. experienced. It's equipped vs. unequipped.",
    stats: [
      { value: "60%", label: "of 1.3M licensed agents sold zero homes last year" },
      { value: "$58K", label: "average agent income, on roughly seven closings" },
      { value: "120K", label: "agents left the industry over unsustainable income" },
    ],
    lines: ["Source: 2025 NAR member data. Equipment is now a decision, not a budget."],
    cue: "Land the reframe and then get off it. Nobody in this room is on the wrong side of that line by choice — say that plainly, because half of them are afraid this hour is going to make them feel stupid.",
  },
  {
    id: "where-ai-pays",
    valSymbol: "pin",
    kind: "content",
    eyebrow: "Strategist",
    heading: "Where AI actually pays",
    lines: [
      "1 — Speed to lead: whoever answers first has the conversation. Everyone else leaves a voicemail.",
      "2 — Neighborhood authority: research depth nobody expects from a solo agent.",
      "3 — Reps: practicing the hard conversations before they're real.",
      "The rule of the hour: never let AI say a number you can't defend.",
    ],
    cue: "Name the hype too, out loud, so they trust you: generic listing copy, autoresponders in a trench coat, 'AI-powered' anything with no source behind it. You get credibility by naming the junk before they do.",
  },
  {
    id: "demo-farming",
    valSymbol: "pin",
    kind: "demo",
    eyebrow: "Live demo · Neighborhood systems",
    heading: "Farm like you have a research department",
    stats: [
      { value: "466", label: "closings indexed — every sale since May 2015" },
      { value: "11", label: "years of record, not a 12-month snapshot" },
      { value: "28.6% → 20.5%", label: "Stonoview's premium over its own island, in twelve months" },
    ],
    quote:
      "When you hand a seller eleven years of their own street, you're not one of three agents interviewing. You're the one who did the homework.",
    cue: "SWITCH TO: the live Stonoview Index + the 29466 seven-hood plan. Scroll it live. The beat that lands: 8.1 points of premium gone in twelve months, and it is NOT a speed problem — 51.2 days for Stonoview vs 50.6 for the island. Same pace, compressed prices. A 12-month report would have missed it entirely.",
  },
  {
    id: "mls-mcp",
    valSymbol: "record",
    kind: "demo",
    eyebrow: "Live demo · the one nobody in this room has seen yet",
    heading: "Now plug Claude straight into the MLS.",
    lanes: [
      {
        tag: "What it actually is",
        heading: "A secure pipe from your MLS into your AI",
        lines: [
          "Flexmls ships an MCP server — a connector from YOUR login to the AI client of your choice.",
          "Your data, your permissions, live. Not a scrape, not a screenshot, not last quarter's export.",
          "Market statistics, listing search, open houses, photos, and your own listings.",
          "It comes with your Flexmls account, if your MLS has switched it on.",
        ],
      },
      {
        tag: "How you turn it on",
        heading: "Four steps, about two minutes",
        lines: [
          "In Flexmls: Preferences → AI Settings → toggle the MCP server on, accept the terms.",
          "In Claude: Settings → Connectors → add a custom connector.",
          "Paste the server URL: mcp.fbsdata.com/mcp",
          "Sign in with your normal Flexmls username and password. That's the whole thing.",
        ],
      },
    ],
    link: {
      href: "/kit#mls",
      label: "Connect your MLS",
      note: "the exact steps, the URL, and six questions to ask it the minute you're in",
    },
    quote:
      "Flexmls's own warning is the rule we've been teaching all hour: the data comes through accurate — the AI's summary of it is still yours to verify.",
    cue:
      "DO IT LIVE ON YOUR SCREEN. Walk them through AI Settings, then the connector, then the sign-in. Then ask it something you did NOT rehearse and let them watch it work — the unrehearsed one is the one they believe. If someone says 'I don't see AI Settings,' that means their MLS hasn't enabled it or enables it per member; tell them to call the MLS, and do not promise it'll be there. Read the Flexmls caveat OUT LOUD — it is the same rule you've hammered since minute fourteen, and now it's coming from the MLS instead of from you.",
  },
  {
    id: "mls-live",
    valSymbol: "record",
    kind: "demo",
    eyebrow: "Johns Island · residential · pulled live, not typed in",
    heading: "One question. Ten seconds. Your whole farm.",
    stats: [
      { value: "$630K", label: "median home that ACTUALLY closed in August" },
      { value: "$675K", label: "median of what's sitting active — $45,000 of hope" },
      { value: "98.0%", label: "of ORIGINAL list price — what starting high costs" },
    ],
    lines: [
      "3.62 months of supply. 40.6 average days on market, against a twelve-month range of 33.7 to 72.3.",
      "94 new listings in August. 73 closings. The gap between those two numbers is the whole story.",
      "Source: Flexmls market statistics · Charleston Trident MLS · 12 months ending August 2026.",
    ],
    quote: "Nobody opened a spreadsheet. Somebody asked a question in English and the MLS answered it.",
    cue:
      "These are REAL and they are current — but re-pull them the morning of, out loud if you can, because a stale number on this slide undoes the entire hour. The beat that lands: the $45,000 gap between what's closing and what's listed. Say it slowly. 'Every seller in this room's farm is pricing against that second number. You now have the first one, in ten seconds, before every appointment.' If you're behind on time, this is the slide to cut — the previous one already taught the skill.",
  },
  {
    id: "connect",
    valSymbol: "phone",
    kind: "content",
    eyebrow: "Now wire in the rest of your week",
    heading: "Your inbox, your calendar, your files — same pipe.",
    lanes: [
      {
        tag: "What you connect",
        heading: "Settings → Connectors, same four steps",
        lines: [
          "Gmail — so it can read the thread you're actually in, not a thread you describe to it.",
          "Calendar — so 'find me three showing windows Thursday' means YOUR Thursday.",
          "Drive — the fact sheets, disclosures and CMAs you already have sitting in folders.",
          "What's available depends on your plan, so open Connectors and see what's on your account.",
        ],
      },
      {
        tag: "What it unlocks Monday",
        heading: "Things you actually do every week",
        lines: [
          "'Draft the reply to the Hendersons — match how I've been writing to them.'",
          "'Three 45-minute showing blocks this week that don't collide with anything.'",
          "'Read the disclosure in Drive and list what a buyer is going to ask about.'",
          "'Summarize every email from this lender since we went under contract.'",
        ],
      },
    ],
    link: {
      href: "/kit#connect",
      label: "Connect everything",
      note: "the steps, what to ask once you're in, and the client-data rules that come with it",
    },
    quote: "The rule gets STRICTER once it can see real client data, not looser: it drafts, you read, you send. Every time.",
    cue: "Do the Gmail one live if you have the nerve — open a real thread and have it draft the reply in your voice, then DON'T send it, and say why out loud. That's the whole lesson: the leverage is in the draft, the liability is in the send, and the send stays yours. Then the client-data line, plainly: 'this is now reading your clients' actual information. Treat it like your CRM, not like a search box.' If you're short on time this slide can be one sentence and a QR — the kit page carries it.",
  },
  {
    id: "price-game",
    valSymbol: "record",
    kind: "price",
    eyebrow: "Game one · The room vs. the arithmetic vs. the record",
    heading: "What does a house like this actually close at?",
    price: {
      key: "price1",
      facts: [
        "Stonoview, Johns Island · single-family resale",
        "4 bedrooms · 1,993–2,618 sq ft — call it 2,200",
        "Everything in this set closed since 2023 · 22 sales in the record",
      ],
      minK: 550,
      maxK: 1050,
      stepK: 5,
      soldK: 797,
      soldLabel: "ACTUALLY CLOSED",
      anchorK: 719,
      anchorLabel: "what $327/sq ft arithmetic claims",
      source: "The Stonoview Index · 466 recorded closings, Charleston Trident MLS · updated July 27, 2026",
    },
    cue:
      "Space opens the slider AND locks the machine's guess from the same three facts — say it out loud: 'the AI just made its call. Same facts you have. No feelings about granite.' THE TRAP: every agent prices off blended $/sq ft — $327 × 2,200 = $719K. The record says these 22 homes closed at a median of $797K — $78,000 the arithmetic leaves on the table, and the bias runs against SMALLER homes every time. Space again: the room's histogram, the arithmetic marker, the machine's call, then the record. Podium takes 100/50/25 on THE BOARD. Say the middle half out loud: half of the 22 closed between $756K and $824K — a span, not a false point. 'The second number is what happened; the first is arithmetic.'",
  },
  {
    id: "everyday-ten",
    valSymbol: "contract",
    kind: "content",
    eyebrow: "Where the money actually is",
    heading: "Ten places this pays you back before Friday.",
    lanes: [
      {
        tag: "Before the appointment",
        heading: "Walk in already knowing",
        lines: [
          "1 — A listing-prep brief from the tax record and the MLS history.",
          "2 — The seller's own street, eleven years of it, on one page.",
          "3 — The three objections they will raise, with your answers drafted.",
          "4 — A pre-listing packet that sounds like you, not like a template.",
          "5 — The CMA narrative: not the numbers, the STORY the numbers tell.",
        ],
      },
      {
        tag: "While the deal is alive",
        heading: "Keep every promise you made",
        lines: [
          "6 — Every contract date computed, and sent in plain English.",
          "7 — The inspection report turned into a repair-request draft.",
          "8 — The weekly seller update nobody has time to write.",
          "9 — Lender and attorney chase emails that stay polite on day nine.",
          "10 — The debrief: why that one fell apart, in writing, so it doesn't twice.",
        ],
      },
    ],
    quote: "Notice what isn't on this list: 'write me a listing description.' That's the shallow end, and you just got out of it.",
    cue: "Call back to the poll-time winner: 'the room said [X] eats their week — that's number [n] on this list.' Then ask out loud which ONE they'd pay for today, take the shout, and promise it: 'good, that's what we build together on Thursday.' Write the winner down; it is your follow-up hook for every person in this room.",
  },
  {
    id: "poll-speed",
    kind: "poll",
    eyebrow: "Be honest · still anonymous",
    heading: "A lead comes in at 8pm Saturday. How fast do you really answer?",
    poll: {
      key: "speed",
      question: "A lead comes in at 8pm Saturday. How fast do you really answer?",
      options: [
        "Inside five minutes — I'm ruthless about it",
        "Within the hour, usually",
        "Sunday morning, realistically",
        "Depends entirely on what I'm doing",
      ],
    },
    cue: "Do NOT let them off the hook — 'anonymous, remember. Nobody is watching.' In most rooms the honest answer is the bottom two. Read the number out loud and let it sit: 'so on a Saturday night, [X]% of this room is not the first call back.' Then straight into the next slide. Do not editorialize — the next slide does it for you.",
  },
  {
    id: "speed",
    valSymbol: "phone",
    kind: "content",
    eyebrow: "The most expensive sixty seconds in your business",
    heading: "You don't have to be fast. You have to be FIRST.",
    lanes: [
      {
        tag: "What actually happens",
        heading: "At 8:47 on a Saturday night",
        lines: [
          "A buyer taps 'request info' on a portal. That inquiry goes to several agents at once.",
          "Whoever answers gets the conversation. Everyone else leaves a voicemail nobody returns.",
          "You were at dinner, at your kid's game, asleep. That is not a character flaw.",
          "It's a staffing problem — and until about two years ago, staffing cost money you didn't have.",
        ],
      },
      {
        tag: "What equipped looks like",
        heading: "Something answers in under a second",
        lines: [
          "The QR on the rider replies instantly, at any hour, grounded in your fact sheet.",
          "It qualifies while you're driving: timeline, financing, whether they already have an agent.",
          "Your phone buzzes with a lead that is already warm — not a name and a number.",
          "And when it's worth your actual voice, you break into the conversation mid-sentence.",
        ],
      },
    ],
    quote: "Being fast is a discipline problem. Being first is an equipment problem. Only one of those gets solved by trying harder.",
    cue: "THIS IS THE SLIDE THAT SELLS THE HOUR — slow down and land it. Call back to the poll with the room's own number. Then say the honest version: 'I am not faster than any of you. I just stopped being the only thing standing between a buyer and an answer.' DO NOT quote a response-time statistic — you don't need one and you can't defend one from this stage. The room just told you their own number and they'll believe that, because they typed it.",
  },
  {
    id: "poll-build",
    kind: "poll",
    eyebrow: "Check the room",
    heading: "Which would you build first?",
    poll: {
      key: "build",
      question: "Which would you build first?",
      options: [
        "The neighborhood index",
        "A listing that answers its own phone",
        "An AI sparring partner",
        "A deal that tracks itself to keys",
      ],
    },
    cue: "Reveal, then: 'Good news — you're about to watch all four, and the second one you're building yourself in about ninety seconds. Some of you already did it this week — hold that, we're coming to you.'",
  },
  {
    id: "demo-assistant",
    valSymbol: "phone",
    kind: "demo",
    eyebrow: "Live demo · The AI assistant",
    heading: "The listing that answers its own phone",
    lines: [
      "One QR per listing — the per-listing page IS the product.",
      "It qualifies, it offers real showing windows, and it never answers past the fact sheet.",
      "The lead routes instantly — on your phone before they've left the driveway.",
    ],
    quote: "This is the answer to the slide you just voted on. It is first, every time, at 3am, without you.",
    cue: "SWITCH TO: the live assistant. Have the room scan and ask. Phone on LOUD so the SMS lands audibly. Show one honest refusal on purpose — ask it something off-sheet and let them watch it decline. 'That refusal is the feature. That's the made-up comp not happening.'",
  },
  {
    id: "build",
    valSymbol: "house",
    kind: "build",
    eyebrow: "Phones out · five minutes · this is yours",
    heading: "Switch yours on. Or build one right now.",
    lines: [
      "Brought one? It is already live. Open your kit link, read your code off it, and we are putting it on the screen.",
      "Didn't? Paste a fact sheet — your listing, your pocket listing, or the demo one on screen — and you are ninety seconds behind them.",
      "Either way: your voice, your number, a live page and a QR code that is yours.",
      "Put it on a rider tomorrow morning. It answers at 11pm and it never invents a fact.",
    ],
    cue: "THE TROPHY MOMENT — five full minutes, and WALK THE ROOM. Open by asking who built one before today and get those hands UP: they are the proof, and the room sees that the people who did the homework are already finished. Put ONE of theirs on the projector first and scan it yourself from the stage — a page somebody made at their kitchen table on Tuesday lands harder than one you made. Then give the rest the five minutes, and pair anybody stuck with somebody who already has one. Watch the built counter climb on this screen.",
  },
  {
    id: "switchboard",
    valSymbol: "table",
    kind: "demo",
    eyebrow: "Live · the part nobody else is doing",
    heading: "Now watch me walk into a conversation that's already happening.",
    lines: [
      "Your assistant takes the question. You see it land, from your phone, as it happens.",
      "When it's worth your voice, you break in — and the caller is TOLD a person joined. No pretending.",
      "Hand it back, and the assistant picks up exactly where you left it.",
    ],
    quote: "An answering machine loses deals. A front desk that knows when to go get you doesn't.",
    cue: "Press W for the switchboard. Have somebody in the room scan THE HOUSE QR and start asking. Let two turns go by on the big screen, then BREAK IN live and type an answer — the room watches the 'Mike Olson joined the chat' line appear on the volunteer's phone. Then hand it back and let the assistant resume. Say it plainly: 'it never pretends to be me, and I never pretend to be it.' Then: 'open your own build screen — that same switchboard is already on your phone, for your listing.'",
  },
  {
    id: "duel",
    valSymbol: "lens",
    kind: "duel",
    eyebrow: "Game two · the room vs. the room",
    heading: "Now try to break each other's.",
    lines: [
      "Pick somebody else's assistant. Ask it something their fact sheet does not cover.",
      "Every honest refusal is +15 to the agent who BUILT it — defending yours is the skill.",
      "Think you made one invent something? Hit I BROKE IT and I'll rule on it from up here.",
    ],
    cue: "The wager out loud: 'if anyone makes one invent a fact tonight, lunch is on me.' Flagged shots land on this screen for you to judge — award or dismiss from the console. The lesson to say plainly when it holds: the assistant is only as good as the fact sheet behind it, and THAT is the part they control.",
  },
  {
    id: "social",
    kind: "demo",
    eyebrow: "Live demo · the other bot I'll build you",
    heading: "A week of content, out of one fact sheet.",
    lanes: [
      {
        tag: "What most agents post",
        heading: "Wallpaper nobody stops for",
        lines: [
          "'Check out this stunning home!' — that first line earns nothing.",
          "Three ideas in one caption, which means it has none.",
          "'DM me for more info' — a call to action that costs a stranger something.",
          "And the landmine nobody mentions: describing WHO a house is right for.",
        ],
      },
      {
        tag: "What the machine does",
        heading: "The hook does the work",
        lines: [
          "First line earns the second. A detail, a number, or a sentence somebody repeats.",
          "One idea. One person. Show the detail and kill the adjective that fits any house.",
          "A CTA that's free to answer: 'comment DOCK and I'll send the disclosure.'",
          "Fair housing as a hard rule, not a footnote — you describe features, never people.",
        ],
      },
    ],
    link: {
      href: "/social",
      label: "The Content Machine",
      note: "pick a platform and an angle on your own phone while I run one up here",
    },
    quote: "Ask it for something it wasn't given and it tells you what it needs instead of inventing it. Same rule you've watched all hour — this time in a caption.",
    cue: "RUN IT LIVE and LET THE ROOM PICK — shout out a platform, shout out an angle, take the one you did not rehearse. That's the whole trick: unrehearsed is the version they believe. Read the NEEDS FROM YOU section OUT LOUD when it comes back: 'look — it wants an open-house time I never gave it, so it asked instead of making one up.' Then the offer, plainly: 'this is a bot. I build these. If you're here, I'll build yours on your listings, with your voice, and you run it.' IF YOU ARE BEHIND ON TIME, this is a cut — but it is the best cut-if-needed slide in the deck, so cut mls-live first.",
  },
  {
    id: "demo-t2k",
    valSymbol: "calendar",
    kind: "demo",
    eyebrow: "Live demo · Track to Keys · open it yourself",
    heading: "The deal that keeps its own promises",
    lines: [
      "Two dates and the terms you actually agreed to. Out comes every deadline, in order.",
      "You get the queue: what's behind, what's inside a week, what it costs if it slips.",
      "Your client gets a porch light — the same chain in plain English, as a link you can text tonight.",
    ],
    link: {
      href: "/t2k",
      label: "Track to Keys",
      note: "scan it and put your own live deal in while I talk — it works on your phone, right now, no login",
    },
    quote: "The contract always had these dates in it. Nobody had ever put them where the client could see them.",
    cue: "Load the sample deal first so the chain builds itself on screen, then switch to Agent view → Client view and let them see the same nine dates said two completely different ways. Then STOP TALKING for sixty seconds while the room puts a real deal in. Watch faces. Somebody will find a date they'd forgotten — ask them to say it out loud.",
  },
  {
    id: "leaderboard",
    valSymbol: "key",
    kind: "leaderboard",
    eyebrow: "THE BOARD · whole-night standings",
    heading: "Somebody's leaving with the crown.",
    lines: [
      "Every vote, every guess, every assistant built, every honest refusal — it all counted.",
      "Post your sparring score from YOUR OWN assistant to make your final move.",
    ],
    cue: "Two boards: the night's points standings and the ring scores feeding them. Ring scores are on their honor — it's a lunch table, not the SEC. Crown the leader OUT LOUD by jersey: 'The 🦈 shark takes it.' Screenshot moment — tell them so.",
  },
  {
    id: "kit",
    valSymbol: "contract",
    kind: "content",
    eyebrow: "Yours · free · no email required",
    heading: "The one-week plan, and everything behind it.",
    lines: [
      "Mon — pick the farm. Tue — export your solds. Wed — run the index prompt.",
      "Thu — one listing, one assistant, one QR on a rider. Fri — ten reps before your next appointment.",
      "Every prompt I used tonight, the fact-sheet template, and both tools — on one page.",
    ],
    link: {
      href: "/kit",
      label: "The Equipped Agent kit",
      note: "screenshot this now — the page is yours whether or not you ever call me",
    },
    quote: "The toolkit is the ad. That's why you can have it for nothing.",
    cue: "Give it away like you mean it, and say the quiet part: 'you can build every bit of this yourself, and some of you will. The ones who want to do it faster, with people who've already done it — that's the next slide.'",
  },
  {
    id: "val",
    kind: "content",
    eyebrow: "The part that isn't a tool",
    heading: "Everything tonight came out of the same library.",
    lanes: [
      {
        tag: "What Val is",
        heading: "A pattern library that remembers",
        lines: [
          "Every build writes back what worked — and only what worked. The default answer to a new entry is NO.",
          "A pattern earns its place by being reusable, non-obvious, load-bearing, and still true six months later.",
          "So the second time a problem shows up, it is already solved — with the fix that survived the first time.",
          "It goes in as a scar. It comes back out as a default.",
        ],
      },
      {
        tag: "What that means for you",
        heading: "You never start from a blank page",
        lines: [
          "Your build starts at the version that already worked on somebody else's listing.",
          "Every agent at The AGENT Connection gets the Val chatbot — the same library, answering for you.",
          "Val runs your agent site: the skills and the automations get pulled off the shelf, not rebuilt from scratch.",
          "It isn't for sale and it isn't a subscription — it came out of our own builds, which is why nobody else has it.",
        ],
      },
    ],
    link: {
      href: "/val",
      label: "Meet Val",
      note: "what it is, the rules that are always on, and what's already on the shelf for real estate",
    },
    quote: "Tools you can buy anywhere. What you can't buy is the notes from every time one of them broke.",
    cue: "Say the loop out loud, then make it concrete with ONE story — a real thing that broke on a real build and the rule that came out of it. The polls-sat-armed bug is the best one: a slide waited on a second button nobody knew about, forty phones showed nothing, and now 'arriving at a slide IS opening it' is a line in the library, so it cannot happen to you. THEN the honest close: 'you can absolutely build all of this yourself. What you can't do by yourself is skip the part where it breaks first.'",
  },
  {
    id: "tac-exp",
    valSymbol: "pin",
    kind: "content",
    eyebrow: "What changes when you're not doing this alone",
    heading: "The systems don't stay in this room.",
    lanes: [
      {
        tag: "The AGENT Connection™",
        heading: "People first, on purpose",
        lines: [
          "Charleston-built and agent-first — small enough that you're a person, not a number.",
          "The lunches, the mentorship, and the people who already solved the thing you're stuck on.",
          "The tech stack you just watched, set up ON your business — not handed to you as a login.",
          "PEOPLE | TOOLS | OPPORTUNITY — in that order, on purpose.",
        ],
      },
      {
        tag: "eXp Realty",
        heading: "The platform underneath it",
        lines: [
          "A cloud brokerage with live training running all day, every day.",
          "Revenue share and equity are part of the model — ask me and I'll pull the CURRENT numbers up on screen, not a screenshot from 2019.",
          "Your office is wherever you are, which is how most of you already work anyway.",
          "Same license. Same relationships. Bigger possibilities.",
        ],
      },
    ],
    cue: "This is the only sales slide in the hour — earn it by being accurate. If anyone asks a numbers question about splits, caps, revenue share, SOAR or FastCAP: DO NOT GUESS and do not paraphrase from memory. Say 'let me pull the current one up' and actually open the program page on screen. You just spent an hour teaching this room never to let AI say a number it can't defend — hold yourself to the identical standard in front of them. Doing that live, on a question you didn't rehearse, is worth more than any slide you could have made about it.",
  },
  {
    id: "the-room",
    valSymbol: "house",
    kind: "content",
    eyebrow: "Minute 55 — the only real pitch of the hour",
    heading: "And you get me. On site.",
    lines: [
      "I'm not a recruiter with a slide deck. I'm the Director of AI Strategy & Innovation, and I'm here in Charleston.",
      "What that means Tuesday: we sit down with YOUR listings, YOUR farm, YOUR live transaction — and we build the thing.",
      "The front desk, the content machine, the date chain, your site — built on your business, in your voice, and you own them.",
      "Everything you watched tonight, I built. So when yours breaks at 9pm you're not filing a ticket. You're texting the guy who wrote it.",
    ],
    quote: "Connecting agents to what matters most.",
    cue: "Short, honest, eye contact, no crescendo. Then hand straight to the ladder — the poll does the closing, not you.",
  },
  {
    id: "poll-ladder",
    kind: "poll",
    eyebrow: "No dead ends",
    heading: "What's your next step?",
    poll: {
      key: "ladder",
      question: "What's your next step?",
      capture: true,
      options: [
        "Send me the toolkit",
        "Save me a seat at the next lunch",
        "Coffee + fifteen minutes",
        "All of it",
      ],
    },
    cue: "Votes are leads. Names land on your console in real time — first replies go out before the room empties. That is not a flourish; it is the last thing you teach them tonight.",
  },
  {
    id: "close",
    /* THE HOUR ENDS HERE. Anything after this slide is spare material —
       strong, but not what the ad promised, so it must never eat the flexmls
       finale. Only go past this if you are genuinely ahead of the clock. */
    valSymbol: "key",
    kind: "close",
    eyebrow: "The Equipped Agent",
    heading: "Go build something unfair.",
    lines: [
      "Smarter tools. Stronger agents. Bigger opportunities. Real impact — starting tonight.",
      "Your assistant is already live. Your kit is on the QR. Your deal chain is one link away.",
      "First replies go out before you're out of the parking lot — that's the standard we just spent an hour teaching.",
    ],
    cue: "Leave the QR up. Work the console: every ladder vote gets a same-hour text. Last thing out of your mouth is the four pillars, in order.",
  },
];

/** The build moment and everything after it — phones may act on their own. */
export const BUILD_FROM_STEP = DECK.findIndex((s) => s.kind === "build");

/** Every real poll/price key in the deck — THE BOARD only counts these. */
export const ALL_POLL_KEYS = DECK.flatMap((s) => [s.poll?.key, s.price?.key]).filter(
  (k): k is string => typeof k === "string"
);

/** The starter fact sheet on the build slide — for anyone who walks in
 *  without a listing of their own. Everyone else pastes their real one. */
export const STUMP_FACTS = `Address: 214 Demo Oak Ln, Johns Island SC 29455
Asking price: $612,000
Bedrooms: 4 · Bathrooms: 2.5 · Square feet: 2,240
Built: 2016 · Lot: 0.21 acres
HOA: $95/mo (covers pool, dock, common areas)
Garage: 2-car attached
Heating/cooling: gas furnace, central air, both original to build
Roof: architectural shingle, original to build
Flood zone: X (lowest risk designation)
Annual property tax: $2,180 at current owner-occupied rate
Showings: Saturday and Sunday, 11am / 1pm / 3pm slots`;

/** TIER 2 — the color. This is what an agent WANTS said, and what turns a
 *  refusal machine into a front desk. Prefilled on the build slide so the
 *  demo lands and every attendee sees the shape of a good one. */
/** THE HOUSE — a permanent target so the duel is playable from the first
 *  second, solo, and from the stage. Fixed code and a non-player device id,
 *  so it never lands on THE BOARD and never counts as somebody's build. */
export const HOUSE_CODE = "HAUS24";
export const HOUSE_DEVICE = "00000000-0000-4000-8000-00000000f00d";

export const STUMP_NOTES = `WHAT MAKES IT SPECIAL
The kitchen was redone in 2023 — quartz, gas range, new cabinet fronts. Screened porch off the back looks over trees, not another house. The primary is downstairs, which is rare at this price point in the neighborhood.

THE NEIGHBORHOOD
Stonoview on Johns Island. Amenities are a pool, a community dock on the Stono River, and a crab dock. It's about 20 minutes to downtown Charleston and 25 to Folly Beach depending on the bridge. Publix and a handful of restaurants are five minutes up Maybank Highway.

SHOWINGS
Saturday and Sunday, 11am, 1pm, and 3pm. Offer those specific times. Weekday evenings can usually be arranged with a day's notice.

ON PRICE
The sellers priced it to move and have already had traffic. Don't speculate about what they'd accept — that's a conversation for the agent.

WHO THE AGENT IS
Licensed in South Carolina, works Johns Island and the surrounding area, and answers texts fast. Happy to send comparable sales or the seller's disclosure on request.`;

/** The next moment an ATTENDEE actually does something with their hands.
 *
 *  This exists because of a real failure: joining the room mid-deck on a slide
 *  with no interaction gave a phone a silent mirror and no way to tell whether
 *  it was working, whether the show had started, or what to wait for. "I don't
 *  know what the f*** is happening" is a UX bug, not a user error. The phone
 *  now always answers: where are we, what do I do now, what's next and how far. */
export interface NextBeat {
  step: number;
  label: string;
}

export function nextInteraction(step: number): NextBeat | null {
  for (let i = step + 1; i < DECK.length; i++) {
    const s = DECK[i];
    if (s.poll) return { step: i, label: "a vote" };
    if (s.price) return { step: i, label: "The Price Is Right" };
    if (s.kind === "build") return { step: i, label: "you build your own assistant" };
    if (s.kind === "duel") return { step: i, label: "the duel" };
    if (s.kind === "leaderboard") return { step: i, label: "THE BOARD" };
  }
  return null;
}

export function pollForStep(step: number) {
  return DECK[step]?.poll ?? null;
}

/** Landing on a game slide opens the floor — the room reads the question and
 *  the phones light up in the same beat, with no second button. One rule,
 *  used by the control route and asserted by /api/selftest, so a deployment
 *  that lost it fails loudly instead of sitting "armed" forever. */
export function opensOnArrival(step: number): boolean {
  const s = DECK[step];
  return Boolean(s?.poll || s?.price);
}
