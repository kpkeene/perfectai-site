// Scripted answers for DEMO mode only (no model connected). The UI labels these
// as scripted samples so they are never mistaken for model output.

const LATE_VALVE = `A valve is four days late and the milestone is acting like it did not hear. Let's do this properly.

## Short answer
Treat the agent as a careful analyst, not a buyer: retrieve the purchase order and schedule evidence first, compare options with costs and dates, then stop and ask a human before changing anything.

## How it works
1. **Retrieve evidence.** A search tool ranks documents for "PO-1042 valves". The top results should be the purchase order and the milestone schedule, not a 2019 spec sheet.
2. **Call read-only tools.** \`get_purchase_order\` returns the promised date (14 Oct). \`get_schedule\` returns the need date for milestone M-220 (10 Oct). The gap is four days.
3. **Compare options.** Expedite for $15,000 (arrives 9 Oct), an alternate supplier for $6,200 (arrives 11 Oct, still one day late), or resequence work around the valves.
4. **Gate the write.** \`update_purchase_order\` is a write tool. A permission policy blocks it until a named human approves the chosen option.
5. **Record the decision.** The approval, evidence and tool results go into an audit log.

## Example
The agent loop sees \`stop_reason: "tool_use"\`, runs \`get_purchase_order\`, and returns a \`tool_result\` with the same \`tool_use_id\`. It repeats for the schedule and quotes. When it has enough evidence it ends with \`stop_reason: "end_turn"\` and a recommendation, not a purchase.

## Trade-offs and failure modes
- **Skipping evidence:** the agent "knows" the valves are late from an old email and recommends a $15,000 expedite for a problem that was already fixed.
- **Write without approval:** a confident model changes a purchase order. Confidence is not authorization.
- **Unbounded retries:** the supplier API times out and the loop retries forever. Cap attempts, back off, and use an idempotency key so a retried write cannot double-order.
- **Cost:** more tool calls and a human step make this slower. For a $15,000 decision, slower is the feature.

## Check yourself
Which tool in this flow must never run before approval, and what enforces that: the prompt or the permission layer?

The valves are late. The paperwork, at least, is on time.

*(Demo mode: this is a scripted sample, not a model response. Connect a local model to get live answers.)*`;

const GENERIC = `I have read your question and the incident binder. Neither is on fire. Yet.

## Short answer
In demo mode I can only show scripted samples. Connect your local model (see README) and I will answer this properly.

## How it works
The preview server forwards your question to a local OpenAI-compatible model server, streams tokens back, and strips any thinking blocks so they are never shown as the answer.

## Example
Ask: "Why does a write tool need human approval when the model is confident?" With a model connected you will get a full answer with examples and failure modes.

## Trade-offs and failure modes
Scripted answers cannot adapt to your question. That is the trade-off for running without a model.

## Check yourself
What would you change in this setup before letting it write to a real system?

Demo mode: all of the personality, none of the brain.

*(Demo mode: this is a scripted sample, not a model response.)*`;

export function demoAnswer(prompt = '') {
  if (/valve|po-?1042|milestone|expedite|late/i.test(prompt)) return LATE_VALVE;
  return GENERIC;
}
