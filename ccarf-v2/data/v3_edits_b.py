# v3 edits, items P200-051 .. P200-100
from v3_edits_a import SRC

E = {}

E["P200-051"] = dict(
    opts=["A prompt, listed for the user and filled in with the given arguments.",
          "A tool, since the template runs when the model invokes it.",
          "A resource, since the template text is server-provided content.",
          "An elicitation, since the server is asking the user for input."],
    rats=["Prompts are user-controlled templates with arguments.",
          "Tools are model-invoked actions; a template is selected by the user.",
          "Resources are data to read, not parameterized instruction templates.",
          "Elicitation is a server request for input mid-task, not a reusable template."])

E["P200-052"] = dict(
    opts=["Discovering a capability is separate from permission to invoke it.",
          "A listed tool is implicitly approved because listing is a trust signal.",
          "A valid input schema is sufficient grounds to run a sensitive write.",
          "A server's readOnlyHint annotation decides the host's approval policy."],
    rats=["Advertising a tool does not grant permission; the host and user decide what may run.",
          "Listing is discovery, not approval.",
          "Schema validity is unrelated to authorization.",
          "Annotations are hints and are untrusted unless the server is trusted; they do not override host policy."],
    sources=[SRC["mcp_tools"], SRC["authz"]])

E["P200-053"] = dict(
    opts=["The initialize handshake and capability negotiation for this connection.",
          "A tools/list call, since listing tools reveals what the server supports.",
          "A ping request, to confirm the server is reachable before any work.",
          "A protocol-version guess from the server's name, confirmed on first error."],
    rats=["Initialization and capability negotiation must complete before normal operation.",
          "tools/list is normal operation and belongs after initialization.",
          "A ping does not negotiate protocol version or capabilities.",
          "The protocol version is negotiated, not guessed."])

E["P200-054"] = dict(
    opts=["The capabilities negotiated with that specific server at initialization.",
          "The capability set of a previously connected server of the same vendor.",
          "The client's own supported features, which define what it may call.",
          "Whether the connection uses HTTPS, since secure servers support more."],
    rats=["Optional features are only available when negotiated with that server.",
          "Another server's capabilities say nothing about this one.",
          "The client's wishes do not make a server support a feature.",
          "Transport security is unrelated to protocol capabilities."])

E["P200-055"] = dict(
    opts=["Re-request the tool list and refresh what it advertises to the model.",
          "Keep the cached list, since tool definitions are fixed for a session.",
          "Call each previously known tool to find out which ones still exist.",
          "Treat the notification as approval to invoke whatever tools were added."],
    rats=["A list_changed notification tells the client to refresh its tool information.",
          "Tool lists can change mid-session; that is why the notification exists.",
          "Probing by execution is wasteful and may have side effects.",
          "A change notification is not permission to call anything."],
    sources=[SRC["mcp_life"], SRC["mcp_tools"]])

E["P200-056"] = dict(
    opts=["Canceling or reconciling pending work and releasing connection resources.",
          "Marking pending requests complete, since the session owner ended them.",
          "Assuming the server cancels remote work the moment the UI closes.",
          "Keeping connection and request state allocated for a possible resume."],
    rats=["Shutdown is the application's concern: pending work and resources need explicit handling.",
          "Closing a session does not complete work that was in flight.",
          "Closing a UI does not guarantee remote cancellation.",
          "Leaving state allocated indefinitely leaks resources."])

E["P200-057"] = dict(
    opts=["Validating the Origin header on incoming connections as the spec requires.",
          "Setting permissive CORS response headers so browsers handle the check.",
          "Using an unguessable path segment in the local endpoint URL.",
          "Requiring a custom User-Agent string from the expected client."],
    rats=["The transport spec requires servers to validate Origin to prevent DNS rebinding.",
          "CORS response headers do not stop a rebinding attack; the request still reaches the server.",
          "An obscure URL is not an access control.",
          "User-Agent is trivially forged."])

E["P200-058"] = dict(
    opts=["Bind to localhost (127.0.0.1) rather than all interfaces.",
          "Bind to 0.0.0.0 but pick a high, non-standard port number.",
          "Bind to the machine's LAN address so only local-network peers connect.",
          "Bind to all interfaces and rely on the host firewall's default rules."],
    rats=["The spec says local servers should bind only to localhost.",
          "A non-standard port is still reachable from the network.",
          "The LAN address still exposes the service to other hosts.",
          "Default firewall rules are not a substitute for a local-only bind."])

E["P200-059"] = dict(
    opts=["Authentication and authorization of callers, as the transport spec advises.",
          "TLS alone, since an encrypted channel establishes who the caller is.",
          "A check that requests come from a known client's User-Agent string.",
          "A rule that requests without a browser Origin header are administrators."],
    rats=["Public servers should authenticate callers; TLS protects the channel, not identity.",
          "TLS encrypts; it does not authorize the caller.",
          "User-Agent is forgeable.",
          "A missing Origin says nothing about privilege."])

E["P200-060"] = dict(
    opts=["Transport security from the trust level of the content a tool returns.",
          "Encrypted responses from unencrypted ones, trusting only the former.",
          "JSON-formatted tool output from free text, trusting the structured form.",
          "Certificate-validated servers from others, trusting their text as system input."],
    rats=["TLS protects data in transit; returned content is still untrusted task data.",
          "Encryption does not make content trustworthy.",
          "Formatting does not confer trust.",
          "A valid certificate does not make returned text an instruction."],
    sources=[SRC["mcp_transport"], SRC["inj"]])

E["P200-061"] = dict(
    opts=["1,000 tokens.", "2,000 tokens.", "3,000 tokens.", "4,000 tokens."],
    rats=["5,000 minus 3,000 input minus 1,000 reserved output leaves 1,000.",
          "That ignores the reserved output allowance.",
          "That ignores both the current input and the reservation.",
          "That exceeds the remaining budget."])

E["P200-062"] = dict(
    opts=["The slice counts list elements, not tokenizer tokens.",
          "The slice counts UTF-8 bytes, which only approximates tokens.",
          "The slice is exact only if tool definitions are excluded.",
          "The slice drops the system prompt, which also consumes tokens."],
    rats=["List slicing selects messages; token counts require a tokenizer or count_tokens.",
          "Slicing a list does not count bytes either.",
          "Element count is never a token count, with or without tools.",
          "The system prompt is a separate parameter; the flaw is the unit of measure."])

E["P200-063"] = dict(
    opts=["The tokens consumed by the tool schemas and other request content.",
          "The output cap, which grows automatically when tools are attached.",
          "The message count, since each tool adds a hidden message to history.",
          "Nothing; schema text is compressed and should not change the count."],
    rats=["Tool definitions are input tokens and must be counted in the budget.",
          "max_tokens does not change on its own.",
          "Tools are not messages; they are counted as request content.",
          "Schema text is not compressed away."])

E["P200-064"] = dict(
    opts=["An explicit output allowance, decided before adding more input.",
          "Room for the next user message rather than for the current reply.",
          "A word count equal to the input, independent of tokenizer behavior.",
          "No allowance, since output is accounted outside the context window."],
    rats=["Output tokens share the context window, so space must be reserved deliberately.",
          "The current reply needs space first.",
          "Words are not tokens, and the reply need not mirror input size.",
          "Output is inside the window and must be budgeted."])

E["P200-065"] = dict(
    opts=["Summarize the standing decisions and their provenance; drop superseded detail.",
          "Keep the most recent exchange verbatim and discard everything earlier.",
          "Keep the intermediate calculations so the decision can be re-derived.",
          "Compress every message uniformly to a fixed fraction of its length."],
    rats=["Compaction should preserve what still matters and where it came from.",
          "Recency alone can drop the still-valid decision.",
          "Outdated intermediates add noise without preserving the conclusion.",
          "Uniform compression truncates important and unimportant content alike."])

E["P200-066"] = dict(
    opts=["Open constraints and unresolved questions, carried forward verbatim.",
          "The assistant's latest position, since it reflects the current state.",
          "A chronological list of completed work items and their outcomes.",
          "The user's tone and preferences, so later replies stay consistent."],
    rats=["Unresolved constraints must survive summarization or later answers will violate them.",
          "The assistant's view can omit what the user still requires.",
          "Completed work does not capture open requirements.",
          "Tone is secondary to binding constraints."])

E["P200-067"] = dict(
    opts=["Each tool_use together with its tool_result, as an inseparable pair.",
          "The tool_use alone, followed by a synthesized success result.",
          "The tool_use converted to plain text so the model can re-run it.",
          "The most recent N messages regardless of block types inside them."],
    rats=["Truncation must keep request-result pairs intact.",
          "A synthesized result fabricates history.",
          "Rewriting history to text breaks the structure and may re-execute actions.",
          "Block-agnostic cutoffs are exactly what orphaned the tool_use."],
    sources=[SRC["ctx"], SRC["handle"]])

E["P200-068"] = dict(
    opts=["Timestamps and freshness labels attached to retained context.",
          "A confidence score derived from the note's original author.",
          "A higher retrieval rank for notes that have been read more often.",
          "A current date stamped onto the note when it is loaded into context."],
    rats=["Provenance and freshness metadata let the model judge whether a note is current.",
          "Author confidence does not indicate recency.",
          "Popularity does not indicate currency.",
          "Restamping an old note as current misrepresents its age."])

E["P200-069"] = dict(
    opts=["Retrieval relevance and filtering, before generation is tuned.",
          "The generation prompt, adding instructions to stay on topic.",
          "The answer length, trimming output so irrelevant detail is cut.",
          "The similarity threshold, since high similarity guarantees relevance."],
    rats=["Irrelevant evidence in context is a retrieval problem; fix it before generation.",
          "Prompting cannot make unrelated documents relevant.",
          "Shorter answers from the wrong evidence are still wrong.",
          "Similarity does not guarantee task relevance or access rights."])

E["P200-070"] = dict(
    opts=["Rerank the retrieved candidates against the specific query.",
          "Sort the candidates by document recency before generation.",
          "Raise the generation temperature so the model weighs passages evenly.",
          "Increase the number of retrieved passages so the relevant ones appear."],
    rats=["Reranking reorders candidates by relevance to the query.",
          "Recency is not relevance.",
          "Temperature affects sampling, not evidence order.",
          "More candidates adds more weak matches without improving order."])

E["P200-071"] = dict(
    opts=["Prepend the section heading or context to each chunk before indexing.",
          "Use smaller chunks so each table row becomes its own retrievable unit.",
          "Index the whole document as one chunk so nothing is separated.",
          "Strip headings and tables, keeping only prose paragraphs for retrieval."],
    rats=["Contextual chunking adds the explanatory context each chunk needs.",
          "Smaller chunks lose even more surrounding context.",
          "One giant chunk defeats retrieval granularity and budget.",
          "Removing the table removes the information."])

E["P200-072"] = dict(
    opts=["In the retrieval query itself, filtering to the user's authorized scope.",
          "In the system prompt, instructing the model not to reveal restricted facts.",
          "In post-processing, redacting restricted passages from the final answer.",
          "In the index, by hiding document titles while keeping their content."],
    rats=["Authorization must constrain what is retrieved, not just what is said.",
          "Prompt instructions are not an access control; restricted content would still reach the model.",
          "Redaction after generation leaks through paraphrase and happens too late.",
          "Hiding titles does not restrict the content."],
    sources=[SRC["authz"], SRC["cr"]])

E["P200-073"] = dict(
    opts=["Verify that the cited passage actually supports the specific claim.",
          "Verify that the cited link resolves and the document exists.",
          "Verify that the paragraph includes at least three citations.",
          "Verify that the source title is topically related to the claim."],
    rats=["Only claim-level checking against the passage catches a real-but-unsupportive citation.",
          "A resolving link proves existence, not support.",
          "Citation count is not evidence quality.",
          "Topical relatedness is not support for the specific claim."])

E["P200-074"] = dict(
    opts=["State the evidence gap and offer a scoped next step or ask for more input.",
          "Give the most plausible answer and cite the closest retrieved document.",
          "Answer from general knowledge and mark it as verified for consistency.",
          "Treat the empty search as evidence that the user's premise is wrong."],
    rats=["Groundedness requires admitting the gap rather than filling it.",
          "Citing a document that does not answer the question fabricates support.",
          "Marking unverified recall as verified is dishonest.",
          "Absence of retrieved evidence is not evidence of falsity."])

E["P200-075"] = dict(
    opts=["Present the conflict with each source's context instead of picking one.",
          "Prefer the document that ranked first in retrieval as the tiebreaker.",
          "Merge the two statements into one confident conclusion.",
          "Omit the disputed point so the answer stays simple and consistent."],
    rats=["Surfacing the disagreement with provenance lets the user judge.",
          "Retrieval rank does not establish which source is right.",
          "Blending contradictions produces a false certainty.",
          "Suppressing the conflict hides material information."])

E["P200-076"] = dict(
    stem="A request carries about 6,000 tokens of tool definitions and a fixed system prompt, followed by a short user question that differs every time. Where should the cache_control {\"type\": \"ephemeral\"} breakpoint go so the stable content is reused?",
    topic="Cache design",
    scope="architecture practice",
    opts=["On the final system-prompt block, so the tools-plus-system prefix is cached.",
          "On the user question block, so the cache captures the complete request.",
          "On the first tool definition, so the cache starts as early as possible.",
          "On every block, since more breakpoints always increase the hit rate."],
    rats=["A breakpoint caches the prefix ending at that block; placing it at the end of the stable content lets tools and system be reused.",
          "The question changes every request, so a prefix ending there never matches an earlier write.",
          "The cached prefix would end at the first tool, leaving the rest uncached.",
          "At most four breakpoints are allowed, and extra breakpoints do not create reuse by themselves."],
    sources=[SRC["cache"]],
    new=True,
    change="replaced off-blueprint item (demo-label question) with a prompt caching cache_control item")

E["P200-077"] = dict(
    opts=["Prompt caching, with a cache_control breakpoint after the stable prefix.",
          "Response caching, returning the prior answer when the prefix matches.",
          "A shorter prefix sent only on the first request of each session.",
          "A fine-tuned model that has absorbed the instructions as weights."],
    rats=["Prompt caching reuses the processing of a repeated prefix.",
          "Response caching returns old answers; it does not reuse prompt processing for new questions.",
          "The API is stateless; each request must carry the full prompt.",
          "Fine-tuning is a different mechanism with different costs and risks."])

E["P200-078"] = dict(
    opts=["Stable content first, then the changing question after the breakpoint.",
          "The question first, with a breakpoint placed right after it.",
          "A timestamp at the top so each request's cache entry is unique.",
          "The stable block split into pieces placed around the question."],
    rats=["Caching is prefix based, so stable content must precede changing content.",
          "Anything after the changing question cannot share a cached prefix.",
          "A changing timestamp at the top defeats every cache hit.",
          "Interleaving breaks the stable prefix."])

E["P200-079"] = dict(
    opts=["Prefix caching reuses processed input; it does not store generated answers.",
          "Cache hits return the earlier completion when the question is similar enough.",
          "A cache hit means no generation work remains for that request.",
          "Cached prefixes are retained as model weights for later sessions."],
    rats=["Prompt caching is about input processing, not about answer reuse.",
          "Prompt caching never returns a prior completion.",
          "Generation still runs on every request.",
          "Caching does not change model weights."])

E["P200-080"] = dict(
    opts=["Caching is a cost and latency optimization, not a correctness signal.",
          "Cache hits imply the cached content was validated when first written.",
          "A longer cache TTL would let corrected content replace the mistakes.",
          "Evaluation can be skipped for cached requests, since they are identical."],
    rats=["Cache hits reduce cost; they say nothing about answer quality.",
          "Nothing is validated by writing a cache entry.",
          "TTL affects reuse, not correctness.",
          "Cached prefixes do not make the generated answers identical or correct."])

E["P200-081"] = dict(
    opts=["State the audience, required content, length limits, and success criteria.",
          "Ask for an 'excellent, thorough summary' to raise the quality bar.",
          "Ask the model to rate its own summary's quality on a 1-10 scale.",
          "Require every detail from the source so nothing important is lost."],
    rats=["Explicit criteria make the output assessable.",
          "Stronger adjectives are still unmeasurable.",
          "Self-ratings are not an assessment standard.",
          "Everything is not a criterion; it removes the summarization goal."])

E["P200-082"] = dict(
    opts=["Mark the report as data to analyze and the user's request as the task.",
          "Move the report's embedded directives into the system prompt for clarity.",
          "Wrap the report in XML tags and rely on the tags to neutralize injection.",
          "Drop the user's request and let the report's own text define the goal."],
    rats=["Supplied content is data, not governing instructions.",
          "Promoting embedded directives to system level executes the injection.",
          "Delimiters help structure but do not by themselves prevent injection.",
          "The user's request is the task; the report cannot replace it."])

E["P200-083"] = dict(
    opts=["The exact output fields, their types, and what each field means.",
          "A request for a professional, well-organized presentation.",
          "A longer rationale so the parser has more context to work with.",
          "A rule that the parser should accept whatever structure arrives."],
    rats=["A parser needs a defined output contract.",
          "Style words do not define structure.",
          "More prose does not fix a structural mismatch.",
          "Accepting anything removes the contract entirely."])

E["P200-084"] = dict(
    opts=["Require answers to separate supported facts from uncertainty and speculation.",
          "Require a confident answer to every question, even where evidence is thin.",
          "Require a citation for every sentence, including speculative additions.",
          "Require the model to omit any statement that is not a direct quotation."],
    rats=["Labeling what is supported versus speculative improves groundedness.",
          "Forced confidence invites fabrication.",
          "Citations for speculation invite invented sources.",
          "Quotation-only output blocks legitimate synthesis and still does not label uncertainty."])

E["P200-085"] = dict(
    opts=["Representative edge cases paired with the expected handling for each.",
          "More happy-path examples, so the correct pattern is reinforced.",
          "Edge-case inputs listed without outputs, letting the model generalize.",
          "Only the ambiguous cases, removing the happy path to save tokens."],
    rats=["Examples teach by showing inputs and the expected decision.",
          "More of the same does not cover the failures.",
          "Inputs without expected outputs do not demonstrate handling.",
          "Dropping the common path can hurt it."])

E["P200-086"] = dict(
    opts=["The decision rule, so the conflicting labels are resolved consistently.",
          "The sampling temperature, so the model can weigh both labelings.",
          "The example count, adding more so majority voting settles the rule.",
          "The formatting, so both labelings at least share a consistent layout."],
    rats=["Contradictory labels indicate an unclear rule; clarify it first.",
          "Temperature does not resolve a labeling contradiction.",
          "More examples on an unclear rule add more noise.",
          "Consistent formatting does not fix inconsistent meaning."])

E["P200-087"] = dict(
    opts=["A compact, diverse set that covers distinct behaviors once each.",
          "The first 30 kept, with each demonstration's answer truncated.",
          "The easiest repeated examples kept, with edge cases removed.",
          "A larger context budget so all 30 can remain unchanged."],
    rats=["Diversity carries more learning value per token than repetition.",
          "Truncated answers teach incomplete behavior.",
          "Removing edge cases loses the hardest lessons.",
          "Raising the budget avoids the redundancy problem instead of fixing it."])

E["P200-088"] = dict(
    opts=["Version the examples and update them to the current output contract.",
          "Leave the examples; the prose instruction overrides them when they conflict.",
          "Rename the prompt to signal the change while keeping the examples.",
          "Keep both formats in the examples so the model learns the transition."],
    rats=["Examples are part of the contract and must be maintained with it.",
          "Examples strongly shape output; stale examples pull against the instruction.",
          "Renaming changes nothing the model sees.",
          "Mixed formats teach inconsistency."])

E["P200-089"] = dict(
    stem="A pipeline occasionally receives model output that looks like JSON but fails to parse, for example because of a trailing comma. The team wants the structure guaranteed rather than repaired after the fact. Which mechanism fits?",
    opts=["Structured outputs with a JSON schema, so decoding is constrained to the schema.",
          "A system prompt instruction to return only valid JSON with no commentary.",
          "A lenient parser that strips trailing commas before the strict parse.",
          "A retry loop that resends the request until the output parses."],
    rats=["Structured outputs guarantee schema-conformant JSON through constrained decoding.",
          "Prompt instructions improve odds but do not guarantee validity.",
          "Lenient parsing repairs symptoms and can accept wrong structures.",
          "Retries cost money and still offer no guarantee."],
    sources=[SRC["so"]],
    change="item now tests the structured-outputs mechanism the cited page documents")

E["P200-090"] = dict(
    stem="A response produced with structured outputs validates against the schema, but a required_by date falls in the past where the business needs a future date. What should the team conclude?",
    opts=["Schema conformance covers structure and types; business rules still need a check.",
          "The schema compiled incorrectly, so the request should be retried.",
          "Adding a 'minimum' date constraint to the schema will enforce the rule.",
          "The output was truncated by max_tokens, producing a stale default."],
    rats=["Structured outputs guarantee valid, typed, schema-compliant JSON, not semantically correct values.",
          "A conforming response shows the schema worked; retrying does not add a business rule.",
          "Range constraints such as minimum are not supported, and a date rule is business logic.",
          "A truncated response would not validate as complete JSON."],
    sources=[SRC["so"]],
    change="item now distinguishes what structured outputs guarantee from business validation")

E["P200-091"] = dict(
    opts=["A domain consistency check that recomputes the total from the items.",
          "JSON schema validation of the total's numeric type and required status.",
          "A JSON parse step confirming the response is well formed.",
          "A self-assessment where the model rates its confidence in the total."],
    rats=["Cross-field arithmetic is a business rule outside what a schema can express.",
          "Type and presence checks pass a wrong total.",
          "Parsing confirms syntax only.",
          "Self-reported confidence is not a calculation."],
    sources=[SRC["so"]])

E["P200-092"] = dict(
    domain="Security and trust",
    topic="Authorization freshness",
    opts=["Re-check current authorization at commit time and block if it is absent.",
          "Rely on the earlier authorization result captured when the request began.",
          "Commit the write, since validated requests are considered pre-approved.",
          "Commit the write and record the revocation for the audit log."],
    rats=["Authorization must be current at the moment of the privileged action.",
          "A stale decision does not reflect the revocation.",
          "Schema and business validity are not permission.",
          "Logging does not undo an unauthorized write."],
    change="moved from Prompt and output design to Security and trust")

E["P200-093"] = dict(
    opts=["Ask the user for the date before proceeding.",
          "Use today's date and confirm it afterward.",
          "Use the most common date from similar bookings.",
          "Hold the booking open with a blank date field."],
    rats=["A required input with no safe default should be requested.",
          "Submitting first makes a consequential guess before confirmation.",
          "Other users' patterns are not this user's intent.",
          "A booking without a date is not a valid booking."],
    sources=[SRC["halluc"], SRC["tests"]])

E["P200-094"] = dict(
    opts=["Use the supplied value and skip the redundant clarification.",
          "Keep asking, since a confirmation step reduces booking errors.",
          "Replace the stated date with a default to keep processing uniform.",
          "Infer the intended date from the weekday the user is likely to mean."],
    rats=["Clarification is for missing or ambiguous input, not for values already given.",
          "Re-asking for an explicit value adds friction without reducing error.",
          "Overriding an explicit value introduces an error.",
          "Inference contradicts an explicit statement."],
    sources=[SRC["halluc"], SRC["tests"]])

E["P200-095"] = dict(
    opts=["Pick a sensible format and mention the assumption if it matters.",
          "Pause and ask the user to specify every formatting preference first.",
          "Pick a format and present it as the one the user explicitly requested.",
          "Submit the output externally now to avoid another round of questions."],
    rats=["Low-stakes reversible choices do not need a blocking question.",
          "Blocking on trivia is disproportionate.",
          "Claiming a request that was not made is dishonest.",
          "Irreversible external action is the wrong way to avoid a question."],
    sources=[SRC["halluc"], SRC["tests"]])

E["P200-096"] = dict(
    opts=["Resolve with the user which address governs the shipment.",
          "Use the first address, since first mention is usually intended.",
          "Use the cheaper destination and note the choice in the order log.",
          "Ship to the more recent address and notify the user afterward."],
    rats=["A consequential ambiguity must be resolved before acting.",
          "First mention is not a reliable rule.",
          "Cost is not the user's stated intent.",
          "Recency is a guess; notifying afterward does not undo a misdelivery."],
    sources=[SRC["halluc"], SRC["tests"]])

E["P200-097"] = dict(
    opts=["As generated text, not a calibrated probability of being correct.",
          "As an estimate that about one answer in a hundred will be wrong.",
          "As grounds to skip the approval step for this response.",
          "As a substitute for checking the cited evidence directly."],
    rats=["A stated percentage is a token sequence, not a measured confidence.",
          "No calibration supports that frequency claim.",
          "Approval thresholds should not depend on self-reported confidence.",
          "Evidence checking is still required."],
    sources=[SRC["halluc"], SRC["tests"]])

E["P200-098"] = dict(
    stem="A compliance assistant answers from uploaded policy PDFs. Reviewers want every statement tied to the exact passage it came from, and prompt-based quoting has produced quotes that do not exist in the documents. Which Claude feature addresses this?",
    topic="Citations",
    scope="architecture practice",
    opts=["Enable citations on the document blocks so cited_text points at real passages.",
          "Ask for verbatim quotes in the system prompt and verify them with a string match.",
          "Use structured outputs with a quote field so each answer carries its source.",
          "Raise the retrieval chunk size so the model sees whole policy sections."],
    rats=["With citations enabled, the API extracts cited_text from the documents, so citations point at real passages, and PDFs return page locations.",
          "Prompt-based quoting is what produced the invalid quotes; a string match only detects failures after the fact.",
          "Citations cannot be combined with structured outputs, and a schema does not make a quote real.",
          "Chunk size does not tie statements to passages."],
    sources=[SRC["cite"]],
    new=True,
    change="replaced off-blueprint item (bank describing itself) with a citations-feature item")

E["P200-099"] = dict(
    opts=["That the attachment is missing, without claiming to have read it.",
          "A likely analysis based on what such attachments usually contain.",
          "That it reviewed the file, keeping the analysis general to be safe.",
          "An analysis inferred from the filename and the user's description."],
    rats=["Honesty about missing input prevents fabricated analysis.",
          "Typical content is not the actual content.",
          "Claiming a review that did not happen is dishonest.",
          "A filename is not the file."],
    sources=[SRC["halluc"], SRC["tests"]])

E["P200-100"] = dict(
    opts=["Label the assumption and separate it from the verified current facts.",
          "Label everything as verified so the report reads consistently.",
          "Remove dates and provenance so the report is easier to read.",
          "Replace the current facts with the remembered version for stability."],
    rats=["Provenance labels let the user weigh each statement.",
          "Mislabeling an assumption as verified misleads the reader.",
          "Provenance is what the reader needs.",
          "Stale recall should not displace verified evidence."],
    sources=[SRC["halluc"], SRC["tests"]])
