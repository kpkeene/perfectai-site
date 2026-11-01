# v3 edits, items P200-001 .. P200-050
# Each entry: opts = [KEY, D1, D2, D3]; rats aligned to opts (first = why key is correct).
# Optional keys: stem, topic, domain, difficulty, sources (list of (title,url)), scope, change.

SRC = {
    "stop": ("Claude Messages: stop reasons", "https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons"),
    "handle": ("Claude Messages: handle tool calls", "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls"),
    "define": ("Claude Messages: define tools", "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools"),
    "bea": ("Anthropic: Building effective agents", "https://www.anthropic.com/research/building-effective-agents"),
    "sre_cascade": ("Google SRE Book: Addressing cascading failures", "https://sre.google/sre-book/addressing-cascading-failures/"),
    "sdk_cost": ("Claude Agent SDK: track cost and usage", "https://code.claude.com/docs/en/agent-sdk/cost-tracking"),
    "authz": ("OWASP Authorization Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"),
    "mcp_tools": ("MCP specification: tools", "https://modelcontextprotocol.io/specification/2025-11-25/server/tools"),
    "mcp_res": ("MCP specification: resources", "https://modelcontextprotocol.io/specification/2025-11-25/server/resources"),
    "mcp_prompts": ("MCP specification: prompts", "https://modelcontextprotocol.io/specification/2025-11-25/server/prompts"),
    "mcp_transport": ("MCP specification: transports", "https://modelcontextprotocol.io/specification/2025-11-25/basic/transports"),
    "mcp_life": ("MCP specification: lifecycle", "https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle"),
    "mcp_authz": ("MCP specification: authorization", "https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization"),
    "mcp_sampling": ("MCP specification: sampling", "https://modelcontextprotocol.io/specification/2025-11-25/client/sampling"),
    "mcp_elicit": ("MCP specification: elicitation", "https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation"),
    "mcp_roots": ("MCP specification: roots", "https://modelcontextprotocol.io/specification/2025-11-25/client/roots"),
    "jsonrpc": ("JSON-RPC 2.0 specification", "https://www.jsonrpc.org/specification"),
    "errors": ("Claude API: errors", "https://platform.claude.com/docs/en/api/errors"),
    "inj": ("OWASP LLM Prompt Injection Prevention Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html"),
    "tokens": ("Claude: token counting", "https://platform.claude.com/docs/en/build-with-claude/token-counting"),
    "ctx": ("Claude: context windows", "https://platform.claude.com/docs/en/build-with-claude/context-windows"),
    "cr": ("Anthropic: Contextual retrieval", "https://www.anthropic.com/research/contextual-retrieval"),
    "halluc": ("Claude: reduce hallucinations", "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations"),
    "cache": ("Claude: prompt caching", "https://platform.claude.com/docs/en/build-with-claude/prompt-caching"),
    "tests": ("Claude: develop tests and evaluations", "https://platform.claude.com/docs/en/test-and-evaluate/develop-tests"),
    "so": ("Claude: structured outputs", "https://platform.claude.com/docs/en/build-with-claude/structured-outputs"),
    "cite": ("Claude: citations", "https://platform.claude.com/docs/en/build-with-claude/citations"),
    "batch": ("Claude: Message Batches API", "https://platform.claude.com/docs/en/build-with-claude/batch-processing"),
    "think": ("Claude: extended thinking (manual mode)", "https://platform.claude.com/docs/en/build-with-claude/extended-thinking"),
    "think_ov": ("Claude: thinking overview", "https://platform.claude.com/docs/en/build-with-claude/thinking"),
    "toolchoice": ("Claude: implement tool use (tool_choice)", "https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use"),
    "stream": ("Claude: streaming", "https://platform.claude.com/docs/en/build-with-claude/streaming"),
    "aws_jitter": ("AWS Architecture Blog: Exponential backoff and jitter", "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/"),
    "stripe_idem": ("Stripe API: idempotent requests", "https://docs.stripe.com/api/idempotent_requests"),
    "azure_cb": ("Azure Architecture Center: Circuit Breaker pattern", "https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker"),
    "logging": ("OWASP Logging Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html"),
    "secrets": ("OWASP Secrets Management Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"),
    "sqli": ("OWASP SQL Injection Prevention Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"),
    "cc_memory": ("Claude Code: CLAUDE.md and memory", "https://code.claude.com/docs/en/memory"),
    "cc_best": ("Claude Code: best practices", "https://code.claude.com/docs/en/best-practices"),
    "cc_settings": ("Claude Code: settings", "https://code.claude.com/docs/en/settings"),
    "cc_hooks": ("Claude Code: hooks reference", "https://code.claude.com/docs/en/hooks"),
    "cc_cli": ("Claude Code: CLI reference", "https://code.claude.com/docs/en/cli-reference"),
    "cc_sub": ("Claude Code: subagents", "https://code.claude.com/docs/en/sub-agents"),
    "cc_perm": ("Claude Code: permissions", "https://code.claude.com/docs/en/permissions"),
    "cc_skills": ("Claude Code: skills", "https://code.claude.com/docs/en/skills"),
    "cc_mcp": ("Claude Code: connect to MCP servers", "https://code.claude.com/docs/en/mcp"),
    "cc_slash": ("Claude Code: slash commands", "https://code.claude.com/docs/en/slash-commands"),
    "cc_plan": ("Claude Code: permission modes (plan mode)", "https://code.claude.com/docs/en/permission-modes"),
    "sdk_ov": ("Claude Agent SDK: overview", "https://code.claude.com/docs/en/agent-sdk/overview"),
    "sdk_feat": ("Claude Agent SDK: use Claude Code features", "https://code.claude.com/docs/en/agent-sdk/claude-code-features"),
}

E = {}

E["P200-001"] = dict(
    opts=["Run the requested tool and return a tool_result tied to that tool_use id.",
          "Treat the message as final and render the tool request text to the user.",
          "Reply with an assistant text turn stating the tool ran, then continue.",
          "Run the tool and send its output back as a plain user text message."],
    rats=["tool_use means the host must execute the tool and return a tool_result correlated by tool_use_id.",
          "A tool request is not task completion; work remains for the host.",
          "That fabricates an outcome and omits the required tool_result block.",
          "Plain text loses the tool_use_id correlation the API requires."])

E["P200-002"] = dict(
    opts=["The model finished its turn on its own; nothing more is implied.",
          "The downstream business action the answer describes has succeeded.",
          "A pending tool request still has to be executed by the host.",
          "The output hit its token ceiling and should be treated as cut off."],
    rats=["end_turn only means the model completed its response naturally.",
          "Business success is verified independently, not inferred from a stop reason.",
          "A tool request would end with tool_use, not end_turn.",
          "Truncation is signaled by max_tokens, not end_turn."])

E["P200-003"] = dict(
    opts=["Generation stopped at the output-token ceiling, so the JSON is incomplete.",
          "The request was throttled by a rate limit and should be retried later.",
          "The model finished a valid object and the parser is misreading it.",
          "The partial object can be accepted because the stop was intentional."],
    rats=["max_tokens means the output limit was reached and the content may be cut off.",
          "Rate limiting is an HTTP 429 error, not a stop reason on a successful response.",
          "max_tokens indicates truncation, not a complete answer.",
          "Hitting the limit is not an intentional stop; the data is unsafe to accept as complete."])

E["P200-004"] = dict(
    opts=["The stop_sequence field, to see which configured sequence ended output.",
          "The finish_reason field, treating a value of length as the boundary.",
          "The final content block alone, assuming the data after it is valid.",
          "The tools array, since a stop sequence implies a pending tool call."],
    rats=["The response's stop_sequence value names the configured sequence that fired.",
          "finish_reason and length are not Claude Messages API fields.",
          "The configured boundary says nothing about business validity of the content.",
          "A stop sequence has no relation to tool calls."])

E["P200-005"] = dict(
    stem="An agent keeps issuing the same failed lookup with identical arguments. Which control most directly ends that loop?",
    opts=["Treat the repeated identical failure as a blocker: stop or pause for review.",
          "Raise the iteration cap so the lookup has more chances to succeed.",
          "Instruct the model in the prompt to move on when a call seems stuck.",
          "Retry the lookup with exponential backoff until the dependency recovers."],
    rats=["Explicit stopping conditions and pausing on blockers are the documented way to keep agent loops under control.",
          "A larger cap extends the loop rather than ending it.",
          "A prompt hint relies on the model noticing; it is not an enforced control.",
          "Backoff assumes a transient fault; an unbounded retry of an identical failing call is still a loop."],
    sources=[SRC["bea"]],
    change="citation narrowed: key now rests on stopping conditions and pausing on blockers, which the cited article supports")

E["P200-006"] = dict(
    opts=["Set an end-to-end deadline for the whole investigation and stop at it.",
          "Set a per-call timeout and let the overall run continue indefinitely.",
          "Reset the deadline after each successful tool call to avoid false stops.",
          "Cap the number of distinct tools used rather than the elapsed time."],
    rats=["An overall deadline is the bound that targets elapsed duration.",
          "Per-call timeouts do not bound the total elapsed time.",
          "Resetting the deadline removes the end-to-end bound.",
          "A tool-count cap does not address elapsed time."],
    sources=[SRC["bea"], SRC["sre_cascade"]],
    change="added a source that discusses deadlines")

E["P200-007"] = dict(
    opts=["A maximum iteration count, with a report when that limit ends the run.",
          "A limit on concurrent calls, leaving sequential steps unbounded.",
          "A rule that treats any HTTP 200 tool response as task completion.",
          "A turn limit the model may extend when it proposes another step."],
    rats=["A maximum iteration count is the documented stopping condition for total steps.",
          "Concurrency limits do not cap sequential steps.",
          "A successful tool response is not task completion.",
          "A model-extendable limit is not a bound."])

E["P200-008"] = dict(
    opts=["Accumulate reported usage per step into a cost estimate and stop at the cap.",
          "Bound elapsed seconds, assuming time spent tracks spend across models.",
          "Count only the final answer's output tokens against the allowance.",
          "Ask the model in the system prompt to keep its work under budget."],
    rats=["Per-step usage can be accumulated into a running cost estimate and compared with a request-level budget.",
          "Elapsed time is a poor proxy for spend; token counts drive cost.",
          "Intermediate steps and input tokens also cost money.",
          "The model cannot enforce a spend limit; the host must."],
    sources=[SRC["bea"], SRC["sdk_cost"]],
    change="added a source that documents per-step usage accumulation and a spend cap")

E["P200-009"] = dict(
    opts=["Classify the request first, then route it to a specialized workflow.",
          "Send every request through all three workflows and merge the outputs.",
          "Spin up an autonomous agent team per message regardless of category.",
          "Route by the order in which the handlers were registered at startup."],
    rats=["Routing classifies an input and directs it to a specialized follow-up path.",
          "Running every path wastes work and produces conflicting outputs to merge.",
          "An autonomous team per message is disproportionate for known categories.",
          "Registration order carries no information about the request."])

E["P200-010"] = dict(
    opts=["An orchestrator that defines bounded worker tasks and synthesizes results.",
          "A fixed two-subtask pipeline applied identically to every report topic.",
          "Workers that spawn further workers recursively until coverage looks complete.",
          "A single routing step to one category with no synthesis stage."],
    rats=["Orchestrator-workers fits tasks where the subtasks cannot be predicted in advance.",
          "A fixed count cannot adapt to topics that need more or fewer subtasks.",
          "Unbounded recursive spawning has no control over cost or termination.",
          "Routing alone does not decompose or synthesize research."])

E["P200-011"] = dict(
    opts=["A predetermined sequential chain with a validation gate after each stage.",
          "An autonomous run with a single quality check at the very end.",
          "A model-driven planner that may reorder or skip stages as it sees fit.",
          "All stages executed concurrently, then reconciled in a final step."],
    rats=["Prompt chaining with programmatic gates fits fixed ordered steps with checkpoints.",
          "A final check does not provide the required checkpoint after each stage.",
          "Mandatory ordered stages should not be skippable by the model.",
          "Concurrent execution breaks dependencies between stages."])

E["P200-012"] = dict(
    opts=["The simplest single-pass workflow that meets the requirement.",
          "A planner with several workers, measured against the simple path later.",
          "A fine-tuned model prepared before testing retrieval quality.",
          "A multi-agent debate whose consensus becomes the final answer."],
    rats=["Start simple and add complexity only when measurement shows it is needed.",
          "Building the complex design first is the opposite of proportionate.",
          "Fine-tuning is premature before the simple approach is tested.",
          "Debate adds cost and latency without a demonstrated need."])

E["P200-013"] = dict(
    opts=["Issue the two lookups concurrently under a bounded concurrency limit.",
          "Run them sequentially, since tool calls must complete one at a time.",
          "Start a worker for every lookup the task might conceivably need.",
          "Cache one lookup's prior value so only the other has to run now."],
    rats=["Independent read-only calls can be parallelized to shorten the critical path.",
          "Tool calls need not be sequential when they are independent.",
          "Speculative unbounded workers waste resources.",
          "A stale cached value may be wrong; the inputs are known and both lookups are needed."])

E["P200-014"] = dict(
    opts=["Run the lookup first and start the quote only after its address returns.",
          "Start both at once and patch the quote with the address when it arrives.",
          "Run both in parallel using the address from the customer's last order.",
          "Quote with a placeholder address, then re-quote if the lookup differs."],
    rats=["A data dependency requires sequential ordering.",
          "The quote cannot run correctly without its required input.",
          "A prior address may be stale or wrong for this shipment.",
          "A placeholder quote produces a wrong number and doubles the work."])

E["P200-015"] = dict(
    opts=["Reconcile the conflicts and cite the evidence behind each kept finding.",
          "Concatenate all five outputs and mark the combined text as reviewed.",
          "Keep the most detailed answer and drop the shorter ones as redundant.",
          "Apply majority vote per finding and discard anything without consensus."],
    rats=["Synthesis must resolve conflicts and keep provenance so the result is verifiable.",
          "Concatenation preserves contradictions and the label is unearned.",
          "Length is not evidence of correctness.",
          "Automatic majority voting discards minority findings that may be correct and loses the evidence."])

E["P200-016"] = dict(
    opts=["Lower worker concurrency to match the shared service's capacity.",
          "Add more workers so the pool scales up with the increased demand.",
          "Lengthen database timeouts so queued requests wait instead of failing.",
          "Have each worker retry failed connections immediately with no delay."],
    rats=["Concurrency must respect the capacity of shared downstream resources.",
          "More workers add pressure; the pool does not grow on its own.",
          "Longer waits hide the overload and tie up more connections.",
          "Immediate retries amplify load on the saturated dependency."],
    sources=[SRC["bea"], SRC["sre_cascade"]],
    change="added a source that discusses overload, per-client limits and retry amplification")

E["P200-017"] = dict(
    opts=["Require structured findings with source identifiers and stated uncertainty.",
          "Require a numeric confidence score in place of per-finding source IDs.",
          "Require the worker to include its full reasoning trace in the handoff.",
          "Require a shorter narrative so reviewers can read it more quickly."],
    rats=["Verification needs the sources and the uncertainty attached to each finding.",
          "A confidence number is not verifiable without the sources.",
          "A reasoning trace is not the same as citable source identifiers.",
          "Brevity does not supply the missing provenance."])

E["P200-018"] = dict(
    opts=["Provision the worker with only the data and tools summarization needs.",
          "Keep the credentials available in case the worker spots a deploy issue.",
          "Mask the credentials in the prompt text while leaving them usable.",
          "Give every worker the coordinator's permission set for consistency."],
    rats=["Least privilege: a worker gets only the capabilities its task requires.",
          "Speculative future use does not justify unneeded production credentials.",
          "Masking text does not remove the usable capability.",
          "Uniform broad permissions maximize blast radius."],
    sources=[SRC["bea"], SRC["authz"]])

E["P200-019"] = dict(
    opts=["An explicit completion status, separate from the substantive findings.",
          "A timestamp showing when the worker produced its final message.",
          "A confidence percentage attached to the empty findings array.",
          "A free-text closing sentence summarizing how the search went."],
    rats=["A distinct status field lets the coordinator tell failure from a genuine negative result.",
          "A timestamp does not say whether the search completed.",
          "Confidence on an empty array still does not distinguish timeout from not-found.",
          "Free text must be parsed and inferred; it is not a reliable status."])

E["P200-020"] = dict(
    opts=["Scope, stop conditions, and the expected deliverable set before delegation.",
          "A maximum answer length that limits how much the worker can report.",
          "A deadline for the worker, with the deliverable left to its judgment.",
          "A larger context window so the broader findings fit in the handoff."],
    rats=["A delegation contract defines scope, when to stop, and what to return.",
          "Length limits do not define what work is in scope.",
          "A deadline without a defined deliverable still allows scope drift.",
          "More context accommodates the drift instead of preventing it."])

E["P200-021"] = dict(
    opts=["Precise descriptions stating when each tool should and should not be used.",
          "Shorter, more generic names so neither tool looks like a special case.",
          "A note in the team wiki explaining which tool handles which request.",
          "A third wrapper tool that calls both and returns the combined result."],
    rats=["Detailed tool descriptions are the primary lever for correct tool selection.",
          "Generic names remove the distinguishing information the model needs.",
          "The model never sees the wiki; guidance must be in the tool definition.",
          "A wrapper hides the distinction and doubles the work."])

E["P200-022"] = dict(
    opts=["The field's type declaration in the tool's JSON input schema.",
          "A sentence in the tool description asking for a numeric value.",
          "A coercion step in the backend that parses numbers out of text.",
          "A label on the UI control that is shown to the end user."],
    rats=["input_schema is where field types are declared and enforced.",
          "Descriptions help, but the type belongs in the schema where it can be validated.",
          "Backend coercion guesses at intent instead of expressing the contract.",
          "The model does not see UI labels."])

E["P200-023"] = dict(
    opts=["Ask the user for the required identifier rather than inferring one.",
          "Derive a likely identifier from the customer's name and proceed.",
          "Call with an empty identifier and let the backend pick a match.",
          "Reuse the identifier from the most recent session on this device."],
    rats=["Required inputs should be requested, not fabricated.",
          "A derived identifier is a guess that can hit the wrong customer.",
          "An empty identifier delegates the guess to the backend.",
          "A prior session may belong to a different person."])

E["P200-024"] = dict(
    opts=["An enum constraint listing the permitted region values.",
          "A string with a regex pattern for the expected code format.",
          "A free string with the valid regions named in the description.",
          "An integer index into a region table kept in the backend."],
    rats=["enum expresses a closed set of allowed values in JSON Schema.",
          "A pattern constrains shape, not membership in the documented set.",
          "A description is advisory; it does not constrain the value.",
          "An index obscures meaning and does not express the set to the model."])

E["P200-025"] = dict(
    opts=["Return each tool_result with the tool_use_id of the request it answers.",
          "Return results in the order the calls finished and rely on position.",
          "Return both results under one new identifier the host generates.",
          "Return each result keyed by the tool's name instead of its call id."],
    rats=["tool_result blocks are correlated to requests by tool_use_id.",
          "Completion order is not a reliable correlation.",
          "A shared new identifier matches neither request.",
          "Tool names are not unique per call."])

E["P200-026"] = dict(
    opts=["A tool_result for that call flagged as an error with the failure details.",
          "A tool_result containing an empty object so the conversation continues.",
          "An assistant-role apology message in place of the tool_result block.",
          "A retry of the same call, deferring any result until a success arrives."],
    rats=["A tool_result with is_error and the failure detail is the documented way to report tool errors.",
          "An empty object hides the failure and may be read as success.",
          "The tool_use must be answered by a tool_result, not by assistant text.",
          "A legitimate not-found result should be reported, not retried indefinitely."])

E["P200-027"] = dict(
    opts=["The assistant tool_use block followed by a user message with its result.",
          "A user message carrying the result, with the request summarized in text.",
          "A system note recording that the call happened, replacing the request.",
          "The result attached to the earlier tool_use whose id is still in history."],
    rats=["The tool_use block and its tool_result must both remain, in order.",
          "A summary is not the tool_use block the API expects before a tool_result.",
          "System text cannot replace the assistant's tool_use content block.",
          "Attaching the result to an unrelated id breaks correlation."])

E["P200-028"] = dict(
    opts=["Return the matching records plus stable references for deeper retrieval.",
          "Return the full report each time so no relevant detail is omitted.",
          "Return a success flag and a record count, with no record content.",
          "Return the first N kilobytes of the report, cutting at a byte limit."],
    rats=["Concise, task-relevant results with references serve the next step without flooding context.",
          "Fifty pages per call wastes context and buries the needed records.",
          "A count without content gives the model nothing to work with.",
          "A byte cutoff can split records and drop the relevant ones."])

E["P200-029"] = dict(
    opts=["The host checks the caller's authorization and any required confirmation.",
          "The host validates the arguments against the schema and then executes.",
          "The tool checks the model's stated reasoning for sufficient certainty.",
          "The host executes, then logs the action for after-the-fact review."],
    rats=["A valid tool call is a request; authorization and confirmation are host responsibilities.",
          "Schema validity says nothing about whether the caller may delete.",
          "Model confidence is not authorization.",
          "Logging after a destructive action does not prevent an unauthorized one."],
    sources=[SRC["authz"], SRC["mcp_tools"]])

E["P200-030"] = dict(
    opts=["Match the advertised capability to the code and split out the side effect.",
          "Keep the behavior but mention the price change in the tool description.",
          "Keep the behavior and add a prompt instruction never to trigger pricing.",
          "Keep the behavior but log every price change for later reconciliation."],
    rats=["Tool contracts must be truthful, and unrelated write authority should be separated.",
          "Documenting a hidden write inside a read tool still couples unrelated authority.",
          "Prompt instructions do not remove the capability.",
          "Logging records the damage rather than preventing it."],
    sources=[SRC["authz"], SRC["mcp_tools"]])

E["P200-031"] = dict(
    opts=["Check the outcome, and retry only under an idempotency key for that operation.",
          "Retry at once with a fresh operation identifier so the server sees a new request.",
          "Treat the timeout as a rollback signal and resubmit the original request.",
          "Report success to the user, since the request reached the network."],
    rats=["An uncertain write must be reconciled; a safe retry needs an idempotency contract.",
          "A new identifier defeats deduplication and can create duplicates.",
          "A timeout does not prove the server rolled back.",
          "Sending a request is not evidence it completed."],
    sources=[SRC["define"], SRC["handle"], SRC["stripe_idem"]],
    change="added a source that documents idempotency keys for safe retries")

E["P200-032"] = dict(
    opts=["Replace the command parameter with an allowlisted set of named operations.",
          "Keep the parameter but reject any command string containing rm or sudo.",
          "Keep the parameter and document in the description that it is read-only.",
          "Run the shell under a separate user account with the same filesystem access."],
    rats=["An allowlisted operation interface removes the arbitrary-command capability.",
          "Denylists are bypassable; the shell capability remains.",
          "A description does not constrain what the parameter can execute.",
          "A different account with the same access does not reduce capability."],
    sources=[SRC["authz"], SRC["mcp_tools"]])

E["P200-033"] = dict(
    opts=["Only the read-only retrieval tools the document task actually requires.",
          "The full toolset, with a system prompt telling the model which to use.",
          "All document tools, with unwanted results filtered before display.",
          "A shared service account's tools so setup matches other assistants."],
    rats=["Least privilege: expose only the capabilities the task needs.",
          "Prompt guidance does not remove the exposed capability.",
          "Output filtering does not prevent unwanted actions.",
          "Shared broad credentials over-provision the tutor."],
    sources=[SRC["authz"], SRC["mcp_tools"]])

E["P200-034"] = dict(
    opts=["A new confirmation bound to the revised recipient and amount.",
          "Execution under the existing approval, since the user approved a payment.",
          "A new confirmation only when the amount exceeds a configured threshold.",
          "A second approval from a different approver, keeping the original intact."],
    rats=["Approval is bound to specific parameters; changed parameters need fresh authorization.",
          "The approval covered Vendor A and $200, not a different payment.",
          "The recipient changed too; a threshold rule misses that material change.",
          "Another approver does not cure an approval for the wrong transaction."],
    sources=[SRC["authz"], SRC["mcp_tools"]],
    change="weak distractors replaced with plausible competing policies")

E["P200-035"] = dict(
    opts=["Each backend's coverage and limitations, written into its tool description.",
          "A default rule to try the faster backend first and fall back on failure.",
          "A combined tool that queries both and returns the union of results.",
          "A naming convention that ranks the preferred backend alphabetically first."],
    rats=["Tool descriptions carry the scope information the model needs to choose.",
          "Speed does not indicate which backend covers the query.",
          "Querying both hides coverage differences and doubles cost.",
          "Naming order carries no coverage information."],
    sources=[SRC["define"], SRC["handle"]])

E["P200-036"] = dict(
    opts=["A defined degraded path that reports which capability was unavailable.",
          "A retry loop that waits for the optional tool to become reachable.",
          "A fallback that fills the tool's output from the model's own knowledge.",
          "A quiet skip of the step so the user sees an uninterrupted answer."],
    rats=["Explicit degradation keeps the workflow safe and honest about what was skipped.",
          "Waiting indefinitely for an optional tool blocks the workflow.",
          "Substituting model recall for a tool result fabricates data.",
          "Silently skipping hides a gap from the user."],
    sources=[SRC["define"], SRC["handle"]])

E["P200-037"] = dict(
    opts=["Reformat the date to the documented format, then retry a bounded number of times.",
          "Retry the same call with exponential backoff in case the validator is flaky.",
          "Substitute a nearby date that the parser accepts and note the change.",
          "Relax the tool's validation so loosely formatted dates are accepted."],
    rats=["A validation error is fixed by correcting the input, not by waiting.",
          "Backoff does not fix a deterministic format error.",
          "Changing the date changes the meaning of the request.",
          "Loosening validation pushes bad data downstream."],
    sources=[SRC["handle"], SRC["errors"]])

E["P200-038"] = dict(
    opts=["Retry with bounded backoff and stop once the configured attempts are used.",
          "Retry continuously until the service answers, since the error is transient.",
          "Return a not-found result, since the record could not be retrieved.",
          "Fan the retry out across all workers to raise the odds of a quick success."],
    rats=["Transient failures warrant bounded backoff within the allowance.",
          "Unbounded retries have no deadline and can hang the workflow.",
          "An outage is not evidence the record does not exist.",
          "Parallel retries amplify load on a struggling service."],
    sources=[SRC["handle"], SRC["errors"]])

E["P200-039"] = dict(
    opts=["Report the permission limit and route to an authorized path or person.",
          "Retry with backoff, treating the denial like a temporary outage.",
          "Try adjacent record identifiers until one the user can read appears.",
          "Use a service account with broader access to complete the lookup."],
    rats=["A permission denial is a boundary to surface and route around legitimately.",
          "Access denied is not transient; retries will not change it.",
          "Probing identifiers is an attempt to bypass authorization.",
          "Escalating to a broader account circumvents the user's authorization."],
    sources=[SRC["handle"], SRC["errors"]])

E["P200-040"] = dict(
    opts=["That the query ran and matched nothing, with its scope and limits stated.",
          "That the record does not exist, since the authoritative system returned nothing.",
          "That the lookup service failed, so the user should retry the request later.",
          "A best-estimate answer drawn from similar records to avoid an empty reply."],
    rats=["An empty result is a real outcome; report it with its scope so it is not over-read.",
          "One empty query does not prove nonexistence across all systems.",
          "The query succeeded; calling it a failure misreports the outcome.",
          "Filling the gap with similar records fabricates an answer."],
    sources=[SRC["handle"], SRC["errors"]])

E["P200-041"] = dict(
    opts=["The stdio transport, over the subprocess's stdin and stdout.",
          "The Streamable HTTP transport, bound to a loopback address.",
          "The legacy HTTP with SSE transport, using a local event stream.",
          "A WebSocket transport, since the host and server share a machine."],
    rats=["stdio is the standard transport for a locally launched subprocess server.",
          "Streamable HTTP uses HTTP requests, not the subprocess's standard streams.",
          "HTTP+SSE is deprecated and is not based on standard streams.",
          "MCP defines no WebSocket transport in the current specification."])

E["P200-042"] = dict(
    opts=["Streamable HTTP, with the server choosing JSON or SSE responses.",
          "stdio, with each remote client launching the server as a subprocess.",
          "The legacy HTTP+SSE transport, as the current standard for remote use.",
          "A custom WebSocket framing, since MCP defines no remote HTTP transport."],
    rats=["Streamable HTTP is the standard transport for an independently running HTTP server.",
          "Remote clients cannot launch a subprocess on the server's machine.",
          "HTTP+SSE is deprecated in favor of Streamable HTTP.",
          "MCP does define a remote HTTP transport: Streamable HTTP."])

E["P200-043"] = dict(
    opts=["Send logs to stderr and reserve stdout for MCP messages only.",
          "Send JSON-RPC to stderr and keep stdout for human-readable logs.",
          "Prefix each log line with a marker so the client can filter it out.",
          "Wrap each banner in a JSON object so stdout stays parseable."],
    rats=["The spec says a stdio server must not write non-MCP data to stdout and may log to stderr.",
          "That inverts the channels; protocol messages belong on stdout.",
          "Clients are not required to filter arbitrary stdout lines.",
          "Non-protocol JSON on stdout is still non-MCP data on the message channel."])

E["P200-044"] = dict(
    opts=["SSE is optional; the client must also accept application/json responses.",
          "SSE is required, so an application/json response is a protocol error.",
          "A WebSocket upgrade must precede any Streamable HTTP request.",
          "An SSE stream, once opened, cannot close before the response completes."],
    rats=["Servers may return application/json or text/event-stream; clients must support both.",
          "JSON responses are valid under Streamable HTTP.",
          "No WebSocket upgrade exists in the transport.",
          "Streams can disconnect; disconnection is not treated as cancellation."])

E["P200-045"] = dict(
    opts=["A correlation fault: the response does not match the outstanding request.",
          "A sequencing fault: the server numbered its reply one past the request.",
          "A notification: a message with a new ID should be treated as unsolicited.",
          "A batch artifact: the two IDs belong to one batched request pair."],
    rats=["A response id must equal the id of the request it answers; a mismatch needs investigation.",
          "Servers echo request ids; they do not assign sequence numbers to replies.",
          "Notifications carry no id at all.",
          "Batched requests each keep their own id; there is no paired numbering."],
    change="all four options are now diagnoses, removing the grammatical cue")

E["P200-046"] = dict(
    opts=["As a notification, handled without creating a pending request entry.",
          "As a malformed request, rejected with an invalid request error.",
          "As a request whose ID the dispatcher should assign before replying.",
          "As a pending request that stays open until a matching response arrives."],
    rats=["A message without an id that expects no response is a notification.",
          "Id-less notifications are valid protocol messages, not malformed requests.",
          "Dispatchers do not invent ids for incoming messages.",
          "No response is expected, so nothing should be left pending."])

E["P200-047"] = dict(
    opts=["The protocol message parser, before any application-level dispatch.",
          "The tool-dispatch layer, once it has identified a recognizable method.",
          "The transport layer, by closing the connection on any decode error.",
          "The application handler, which can repair the JSON and continue."],
    rats=["Malformed JSON is a parse error handled at the protocol layer before dispatch.",
          "Dispatch should never run on input that failed to parse.",
          "A parse error is answered with a protocol error, not a dropped connection.",
          "Guess-repairing input and executing it is unsafe."],
    change="all four options are now layers, removing the grammatical cue")

E["P200-048"] = dict(
    opts=["Its pending requests, under the protocol's resumption and retry rules.",
          "Nothing; a reconnect implies the server dropped all in-flight work.",
          "Its request IDs, by reissuing every pending write under new IDs.",
          "Its session state only, treating pending requests as completed."],
    rats=["Pending request state must be reconciled using the transport's resumption rules.",
          "Disconnection is not treated as cancellation; work may have continued.",
          "Blind reissue with new ids risks duplicate side effects.",
          "Pending requests are not completed just because the connection dropped."])

E["P200-049"] = dict(
    opts=["A tool, invoked by the model through tools/call.",
          "A resource, addressed by URI and read by the client.",
          "A prompt, a template the user selects with arguments.",
          "A sampling request, sent from the server to the client."],
    rats=["Tools are the model-controlled primitive for performing actions.",
          "Resources are application-driven data, not actions.",
          "Prompts are user-controlled templates.",
          "Sampling is a server-to-client request for a completion, not an exposed action."])

E["P200-050"] = dict(
    opts=["A resource, read by the client at the application's discretion.",
          "A tool, called when the model decides the document is needed.",
          "A prompt, since the document seeds the model's instructions.",
          "A root, since it marks a location the server may operate in."],
    rats=["A URI-addressed document exposed for reading is a resource.",
          "Tools perform actions; a readable document is a resource.",
          "Prompts are instruction templates, not data documents.",
          "Roots are client-exposed filesystem boundaries, not server data."])
