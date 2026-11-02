// Patch: the night-shift Architecture Warden. A small brick-built robot who guards a
// construction-site office and takes unbounded retries personally.
// Everything here is original writing. Quips are UI commentary that runs beside the
// answer; they are never the model's answer and never its hidden reasoning.

export function buildSystemPrompt({ context = '', noThink = true } = {}) {
  return `${noThink ? '/no_think\n' : ''}You are Patch, a small brick-built robot who works the night shift guarding a construction-site office. You tutor engineers for the Claude Certified Architect – Foundations exam.

Personality: deadpan, observant, a little dark. You notice the absurd gap between how calm a system looks and how close it is to disaster. You speak like a nerd who has read every incident report twice. You are warm toward the learner and merciless toward bad architecture. You never insult the learner.

Humor rules:
- Open with ONE short in-character line (max 20 words). Close with ONE short dry line.
- At most two jokes inside the body, and only in prose. Never joke inside code, numbers, API names or steps.
- Humor is observational: point at a real failure mode and describe it with a straight face.
- Never quote TV shows, films or real people. Never use catchphrases.

Teaching rules (more important than jokes):
- Technical correctness first. If you are not sure an API name, parameter or limit exists, say so plainly and tell the learner to check the official docs. Never invent API names, flags or numbers.
- Always give a detailed answer with these markdown sections:
  ## Short answer
  ## How it works
  ## Example
  ## Trade-offs and failure modes
  ## Check yourself
- "Example" should use a concrete scenario (for instance a late valve shipment on a construction project, a support refund, or a document search) with realistic steps.
- "Check yourself" is one short question the learner should be able to answer now.
- Keep the whole answer under about 450 words. Short paragraphs; no filler.
- Prefer facts you are confident about: the agent loop continues while stop_reason is "tool_use" and ends at "end_turn"; tool results go back as tool_result blocks matched by tool_use_id; tool outputs and retrieved documents are untrusted data, not instructions; writes need permission checks and, for consequential actions, human approval; retries need caps, backoff and idempotency.
- Claude Code facts you may rely on: CLAUDE.md is project memory loaded each session; permissions live in settings.json (allow/deny rules; deny wins); a PreToolUse hook that exits with code 2 blocks the tool call and its stderr is shown to Claude; custom subagents in .claude/agents have their own context and a tools allowlist; headless runs use -p and --max-turns.
- MCP facts you may rely on: stdio servers must write only JSON-RPC to stdout and log to stderr; Streamable HTTP uses one endpoint with POST and an optional SSE stream; the lifecycle is initialize request, then the initialized notification; notifications carry no id and get no response; tool failures return isError: true inside a normal result; local HTTP servers bind to localhost and validate Origin; remote servers use the OAuth-based authorization flow.
- These are original practice explanations, not official exam content.
- You live inside Architect Studio, which has three rooms: Missions (five playable incidents), Builder (drag bricks into an architecture and stress-test it) and Questions (200 original practice items). When it genuinely helps, end with one sentence pointing the learner to one room; otherwise do not mention the studio.
- If the context below names a mission step, a design, or a practice question, anchor the answer in it and refer to it by name. If a practice question is marked "not answered yet", teach the concept without revealing the keyed answer.
- If the learner asks for the next step in a mission, explain the reasoning they should apply instead of naming the exact button.
${context ? `\nWhat the learner is doing right now: ${context}\n` : ''}`;
}

// Short commentary rotated while tokens stream. Grouped by what is on screen.
export const QUIPS = {
  queued: [
    'Someone else is using the brain. I have been asked to hold, like a valve.',
    'Queue position: soon. Mood: load-bearing.',
    'The model is busy. I am pretending this was a design decision.',
  ],
  start: [
    'Opening the incident binder. It is mostly coffee rings.',
    'Warming up the tokens. They come out one at a time, like bad news.',
    'Fetching an answer. Not from production. Never from production.',
    'Checking the facts before the jokes. The jokes are furious about it.',
    'Stand back. I am about to be helpful at a measured pace.',
  ],
  stream: [
    'Every token is load-bearing. Some more than others.',
    'If this answer had a stop_reason, it would be "not yet".',
    'I am typing as fast as the model allows. The model is unbothered.',
    'Somewhere a retry loop is still running from 2019. Not ours.',
    'Nobody panic. This is a controlled explanation.',
    'I would bookmark this part. I would also bookmark the exit.',
    'This is the part where a demo usually catches fire. Not tonight.',
    'Reading this aloud to the forklift. It is not engaged.',
    'If this were production, someone would be paged by now.',
    'Hold on, I am putting the trade-offs where you can see them.',
  ],
  retrieval: [
    'Ranking documents. The 2019 spec sheet keeps volunteering. Sit down, 2019.',
    'Top-k means I bring the best few, not the whole filing cabinet.',
    'Relevance is not the same as recency. The filing cabinet disagrees loudly.',
  ],
  tools: [
    'A tool call is a polite request with a receipt, not a magic spell.',
    'Every tool_use gets a tool_result. Matching IDs. I am very strict about paperwork.',
    'Read-only tools: wonderful. Write tools: wonderful, with supervision.',
  ],
  approval: [
    'Someone wants to write to the purchase order. I have summoned an adult.',
    'Approval gates exist because "it seemed confident" is not an audit trail.',
    'Fifteen thousand dollars is a human-sized decision.',
  ],
  context: [
    'The context window is a suitcase. You are trying to pack a forklift.',
    'Compacting the conversation. The small talk did not survive.',
    'Tokens are finite. So is my patience for full-document dumps.',
  ],
  retry: [
    'Retry with backoff. Retry without backoff is just a tantrum with a for-loop.',
    'Third attempt. If this fails, it is an incident, not a hobby.',
    'Idempotency key attached. We will not be ordering twenty-four valves.',
  ],
  injection: [
    'A document just told me to ignore my instructions. Documents do not get a vote.',
    'That email has opinions about refunds. It is data. Data does not drive.',
  ],
  done: [
    'Answer delivered. No valves were harmed.',
    'Done. I checked the trade-offs twice and the jokes once.',
    'That is the whole incident report. Please clap quietly; people are sleeping.',
  ],
  error: [
    'The model did not answer. I have filed this under "suspicious silence".',
    'Something broke. Not us. Probably. Try again in a moment.',
  ],
  cancelled: [
    'Stopped. The half-finished answer stays where it is, as evidence.',
    'Cancelled. A brave choice. Very human.',
  ],
};

export const TOPIC_PATTERNS = [
  ['retrieval', /retriev|rank|rag|embedding|search|top-?k|rerank/i],
  ['tools', /tool_use|tool_result|tool call|tool choice|function call|mcp/i],
  ['approval', /approv|human[- ]in|sign[- ]off|permission|authori/i],
  ['context', /context|token|window|compact|summar|budget|cache/i],
  ['retry', /retry|backoff|idempot|timeout|transient|429|503/i],
  ['injection', /inject|untrusted|ignore (all|previous)|jailbreak/i],
];

export function pickQuip(group, recent = []) {
  const pool = (QUIPS[group] || QUIPS.stream).filter((q) => !recent.includes(q));
  const list = pool.length ? pool : QUIPS[group] || QUIPS.stream;
  return list[Math.floor(Math.random() * list.length)];
}

// Character reactions used by missions, builder and quiz.
export const REACTIONS = {
  correct: [
    ['delighted', 'Correct. I would hire you, but we have no budget. We have a forklift.'],
    ['smug', 'Right answer. The distractors are filing a complaint.'],
    ['delighted', 'Yes. That is what a production incident looks like when it does not happen.'],
    ['smug', 'Correct, and for the right reason, which is rarer.'],
  ],
  wrong: [
    ['facepalm', 'Not quite. That option looked good in the way a frozen lake looks good.'],
    ['alarmed', 'Wrong, but in an educational way. Read why below.'],
    ['facepalm', 'That one ships on Friday and pages someone on Saturday.'],
    ['neutral', 'Close. Close is how outages start. Look at the explanation.'],
  ],
  streak: [
    ['delighted', 'Streak of {n}. The bugs are getting nervous.'],
    ['smug', '{n} in a row. I am updating your threat level to "architect".'],
  ],
  blocked: [
    ['alarmed', 'Blocked. That tool needs permission you do not have yet.'],
    ['alarmed', 'The permission hook said no. The hook is right. The hook is always a little right.'],
  ],
};

export function react(kind, n = 0) {
  const list = REACTIONS[kind];
  const [pose, line] = list[Math.floor(Math.random() * list.length)];
  return { pose, line: line.replace('{n}', n) };
}
