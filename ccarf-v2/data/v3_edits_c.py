# v3 edits, items P200-101 .. P200-150
from v3_edits_a import SRC

E = {}

E["P200-101"] = dict(
    opts=["Recall on the positive (fraud) class.",
          "Precision on the positive (fraud) class.",
          "Overall accuracy across both classes.",
          "Specificity on the negative (legitimate) class."],
    rats=["Recall measures the share of true positives that were caught, so it exposes missed fraud.",
          "Precision measures false alarms among flags, not missed positives.",
          "Accuracy stays high when the rare class is missed.",
          "Specificity concerns correct negatives, not missed positives."])

E["P200-102"] = dict(
    opts=["Precision on the flagged (positive) class.",
          "Recall on the flagged (positive) class.",
          "Overall accuracy across all reviewed cases.",
          "The F1 score averaged over both classes."],
    rats=["Precision is the fraction of flags that are real; it measures false-alarm burden directly.",
          "Recall measures missed cases, not false alarms.",
          "Accuracy blends both error types.",
          "F1 mixes precision and recall; it does not isolate flag reliability."])

E["P200-103"] = dict(
    opts=["Exact match against the reference after documented normalization.",
          "A rubric-based LLM grade of whether the identifier looks plausible.",
          "A regex check that some identifier-shaped string is present.",
          "A BLEU-style similarity score between output and reference text."],
    rats=["Exact identifiers call for exact-match checks with clear normalization rules.",
          "Plausibility is not correctness for an exact identifier.",
          "Presence of a pattern does not confirm the right value.",
          "Similarity scores reward near misses that are wrong identifiers."])

E["P200-104"] = dict(
    opts=["Response latency distribution, including tail percentiles.",
          "Mean accuracy against the answer key per release.",
          "Median output length in tokens per response.",
          "Fastest observed response time per deployment."],
    rats=["Abandonment is driven by slow responses, so latency percentiles are the operational metric.",
          "Accuracy does not capture speed.",
          "Output length is only a weak proxy for time.",
          "The best case hides the tail users actually experience."])

E["P200-105"] = dict(
    opts=["Leakage: the test score no longer measures generalization.",
          "Imbalance: the overlapping examples skew the class distribution.",
          "Drift: the test set no longer represents current production traffic.",
          "Variance: duplicated examples make the score less stable across runs."],
    rats=["Train-test overlap is data leakage and invalidates the generalization claim.",
          "Overlap is about contamination, not class balance.",
          "Drift is a different problem about representativeness over time.",
          "Leakage inflates scores; it is not primarily a variance issue."])

E["P200-106"] = dict(
    opts=["Add representative cases across users, difficulty levels, and failure modes.",
          "Duplicate the existing requests until the sample reaches a target size.",
          "Add only the cases used while designing the prompt, since they are known.",
          "Remove the costly failure cases so the baseline score is comparable."],
    rats=["Coverage comes from representative diversity, not from sample count alone.",
          "Duplicates add no coverage.",
          "Design cases are already optimized for; they do not test generalization.",
          "Dropping failures hides the cases that matter most."])

E["P200-107"] = dict(
    opts=["A development set for tuning, with a separate holdout kept for the final score.",
          "The same test set, since prompt changes do not alter model weights.",
          "A reshuffled copy of the test set under a different filename.",
          "The full test set with only the best score of all attempts reported."],
    rats=["Iteration belongs on a dev set; the holdout is reserved for a clean final measurement.",
          "Tuning on the test set overfits it regardless of whether weights change.",
          "Reshuffling the same labels is not an independent set.",
          "Best-of-many on the test set is selection bias."])

E["P200-108"] = dict(
    opts=["Near-duplicate and scenario-family detection across the splits.",
          "File-hash comparison of each case across the splits.",
          "Random re-splitting after paraphrasing every case.",
          "Treating cases with different names or dates as independent."],
    rats=["Exact matching misses paraphrases; semantic and scenario-family checks are needed.",
          "Hashes catch only byte-identical duplicates.",
          "Paraphrases still leak across random splits.",
          "Surface changes do not make examples independent."])

E["P200-109"] = dict(
    opts=["An explicit rubric, checked for agreement against reference judgments.",
          "Averaging several grader runs without inspecting what the rubric measures.",
          "Accepting the first score, since an LLM grader is not biased by fatigue.",
          "Adjusting the grading standard after seeing which candidate scores higher."],
    rats=["A clear rubric and a consistency check against references make grading reliable.",
          "Averaging an unvalidated rubric averages noise.",
          "A single run of an inconsistent grader is not reliable.",
          "Changing the standard post hoc biases the result."])

E["P200-110"] = dict(
    opts=["Score factual support separately and penalize the unsupported citation.",
          "Award full credit, since the final conclusion is what the user needs.",
          "Count the citation as partial evidence because it is topically close.",
          "Award credit for the answer and ignore sources, which a human will check."],
    rats=["Fabricated evidence is a distinct failure and should lower the score.",
          "A right answer with fake support teaches fabrication.",
          "A fabricated citation is not evidence of any kind.",
          "Deferring source checks to humans leaves the failure unmeasured."])

E["P200-111"] = dict(
    stem="A team must re-run a 20,000-case regression suite against a new prompt overnight. Results are not needed interactively and cost matters. Which API approach fits?",
    topic="Evaluation at scale",
    scope="architecture practice",
    opts=["Submit the cases through the Message Batches API and collect results when the batch ends.",
          "Call the Messages API in parallel at the highest rate limit until the suite finishes.",
          "Stream each Messages API call so partial results can be scored as they arrive.",
          "Use prompt caching on the shared prompt and call the Messages API sequentially."],
    rats=["Batches are asynchronous, priced at half the standard rate, and sized for large volumes, with results available once the batch ends or after 24 hours.",
          "Parallel synchronous calls pay full price and consume Messages API rate limits for a job that needs no interactivity.",
          "Streaming reduces perceived latency; it does not reduce cost or suit a non-interactive bulk job.",
          "Caching lowers input cost but keeps the synchronous pattern; it can also be stacked with batches."],
    sources=[SRC["batch"]],
    new=True,
    change="replaced off-blueprint item (humor judging) with a Message Batches API item")

E["P200-112"] = dict(
    opts=["The parser and schema validator's actual result.",
          "The grader's judgment, since it also reads intent.",
          "A majority vote among several subjective graders.",
          "A check that the output sits inside a fenced code block."],
    rats=["Syntax validity is deterministic; the parser is the authority.",
          "Intent is irrelevant to whether text parses.",
          "Votes cannot overrule a parse failure.",
          "A code fence does not make content valid JSON."])

E["P200-113"] = dict(
    opts=["Both systems run on the same fixed cases with identical settings.",
          "The candidate's easy subset compared with the baseline's hardest cases.",
          "The candidate given the answer key in its prompt to calibrate difficulty.",
          "Scoring adjusted by output length so longer replies are not penalized."],
    rats=["A fair comparison holds cases and settings constant.",
          "Different difficulty makes the comparison meaningless.",
          "Giving one side the key is contamination.",
          "Length adjustments do not fix mismatched test cases."])

E["P200-114"] = dict(
    opts=["Gate the release on critical cases in addition to the aggregate score.",
          "Ship, since the aggregate improvement outweighs one regressed case.",
          "Drop the regressed case from the report and reopen it next cycle.",
          "Ship with a note in the changelog describing the known regression."],
    rats=["Safety-critical cases need hard gates that averages cannot offset.",
          "A mean cannot compensate for a permission violation.",
          "Removing the case hides the regression.",
          "Documenting a boundary regression does not make it acceptable."])

E["P200-115"] = dict(
    opts=["Variation across repeated runs and the uncertainty of the difference.",
          "The best seed's result, described as the typical outcome.",
          "A significance claim based on the single improved run.",
          "Only the runs that improved, stopping once a favorable result appears."],
    rats=["High variance must be reported with repeated measurements and uncertainty.",
          "The best seed is not typical.",
          "One run cannot establish significance.",
          "Stopping on a favorable result is selection bias."])

E["P200-116"] = dict(
    opts=["Controlled comparisons or ablations that vary one component at a time.",
          "Crediting the new model, since it is the largest single change.",
          "Updating the benchmark as well so all components are measured together.",
          "Keeping only the new configuration once it has shown an improvement."],
    rats=["Attribution requires isolating the effect of each change.",
          "Size of a change is not evidence of its contribution.",
          "Changing the benchmark removes the fixed reference point.",
          "Discarding the old configuration prevents controlled comparison."])

E["P200-117"] = dict(
    opts=["Production failure monitoring, feeding representative cases back into the eval set.",
          "A rule to revisit the evals only when the offline average score drops.",
          "Training on all production traffic so the model learns the new request type.",
          "A larger offline suite built from the original specification's request types."],
    rats=["Production reveals unanticipated inputs; the eval set must learn from them.",
          "Offline averages will not drop for request types the suite never contained.",
          "Indiscriminate training on user data raises consent and quality issues and is not evaluation.",
          "Expanding on the old specification still misses new request types."])

E["P200-118"] = dict(
    opts=["A failure category plus relevant non-sensitive context, collected with consent.",
          "The full conversation transcript, captured automatically for every report.",
          "A thumbs-down plus an emoji scale for how bad the answer felt.",
          "The user's login credentials so engineers can reproduce the session."],
    rats=["Categorized, consented, minimized context is diagnosable and respectful of privacy.",
          "Blanket transcript capture over-collects, including secrets.",
          "Sentiment without category does not help diagnosis.",
          "Credentials must never be collected for debugging."])

E["P200-119"] = dict(
    opts=["Survivorship: timeouts and failures must appear in the reporting.",
          "Selection: the chart should keep only the fastest half of requests.",
          "Imputation: missing failures should be recorded as zero-millisecond calls.",
          "Granularity: latency should be rounded to the nearest second."],
    rats=["Reporting only successes hides the worst user experiences.",
          "Keeping the fastest half makes the bias worse.",
          "Zero-latency failures distort the distribution downward.",
          "Rounding does not address the missing failures."])

E["P200-120"] = dict(
    opts=["Model, prompt, dataset, generation settings, and scoring version.",
          "A rounded percentage and the model family's informal nickname.",
          "The scoring code kept private, with the score alone published.",
          "A statement that the current default settings describe all past runs."],
    rats=["Reproduction requires the full configuration that produced the score.",
          "A nickname and a rounded number cannot be reproduced.",
          "Private scoring prevents verification.",
          "Defaults change; past runs need recorded settings."])

E["P200-121"] = dict(
    opts=["An authentication failure (401) that needs a credential fix.",
          "A transient overload (529) that a backoff retry will clear.",
          "A rate limit (429) that calls for honoring retry-after.",
          "An invalid request (400) that needs a payload correction."],
    rats=["An invalid credential is an authentication error; retries will not help until it is fixed.",
          "Overload is a different class and is retryable.",
          "Rate limiting is not an authentication problem.",
          "The payload is fine; the credential is the problem."])

E["P200-122"] = dict(
    opts=["Fix the request to satisfy the schema, treating the 400 as a client bug.",
          "Retry the same payload with backoff, treating the 400 as transient.",
          "Increase max_tokens so the server has room to accept the request.",
          "Rotate the API key, since the server rejected the request."],
    rats=["A validation error is a client-side defect to correct.",
          "Invalid requests do not become valid with time.",
          "Output budget is unrelated to input validation.",
          "A 400 is not an authentication failure."])

E["P200-123"] = dict(
    opts=["A transient availability failure suited to bounded retry.",
          "A permanent authorization denial requiring a new identity.",
          "A successful response that simply returned no records.",
          "A confirmation that any interrupted write had no effect."],
    rats=["Temporary outages are transient failures handled with bounded retry.",
          "An outage is not an authorization decision.",
          "No response was returned at all.",
          "An outage does not prove anything about write outcomes."])

E["P200-124"] = dict(
    opts=["Outcome unknown until reconciled with the server.",
          "Failed, so a duplicate write is safe to issue now.",
          "Succeeded, since the request left the client.",
          "Not attempted, so it can be removed from records."],
    rats=["An interrupted write has an uncertain outcome until checked.",
          "Assuming failure risks duplicates.",
          "Sending is not completing.",
          "The attempt happened and must be tracked."])

E["P200-125"] = dict(
    opts=["Add random jitter to a bounded exponential backoff schedule.",
          "Use the same fixed retry delay for every client and request.",
          "Raise the per-request timeout without changing the retry schedule.",
          "Honor retry-after when present and otherwise retry immediately."],
    rats=["Randomized delays desynchronize clients and spread retry load over time.",
          "Identical delays keep the clients synchronized.",
          "Timeouts do not change when retries fire.",
          "Immediate retries without jitter recreate the synchronized spikes."],
    sources=[SRC["errors"], SRC["aws_jitter"]],
    change="added a source that documents jitter")

E["P200-126"] = dict(
    opts=["An idempotency key reused on retries, or reconciliation before retrying.",
          "A fresh idempotency key generated for every retry attempt.",
          "A longer timeout so the first attempt is less likely to be retried.",
          "A rule that treats each timeout as proof the write never happened."],
    rats=["Safe retry of a non-idempotent write needs deduplication or outcome reconciliation.",
          "A new key per retry defeats deduplication.",
          "Longer timeouts reduce but do not eliminate uncertain outcomes.",
          "A timeout does not prove the write failed."],
    sources=[SRC["errors"], SRC["stripe_idem"]],
    change="added a source that documents idempotency keys")

E["P200-127"] = dict(
    opts=["The remaining end-to-end budget, skipping retries that cannot finish in time.",
          "The full backoff interval, even when it exceeds the remaining time.",
          "A fresh deadline for each attempt so retries are not penalized.",
          "The error class alone; transient errors are retried regardless of time."],
    rats=["Retries must fit inside the remaining deadline or they waste work.",
          "Sleeping past the deadline guarantees a late failure.",
          "Resetting deadlines removes the end-to-end bound.",
          "Transience does not create time that is not there."],
    sources=[SRC["errors"], SRC["sre_cascade"]])

E["P200-128"] = dict(
    opts=["A circuit breaker that opens after failures and probes recovery cautiously.",
          "A higher retry count per worker so the dependency gets more chances.",
          "Longer per-call timeouts so workers wait instead of retrying.",
          "A fallback that returns the last cached response and logs the failure."],
    rats=["A circuit breaker stops calls to a failing dependency and tests recovery with limited probes.",
          "More retries increase the pressure.",
          "Longer waits tie up workers and do not stop the calls.",
          "A fallback shapes the response but does not stop the repeated calls."],
    sources=[SRC["errors"], SRC["azure_cb"]],
    change="added a source that documents the circuit breaker pattern")

E["P200-129"] = dict(
    opts=["Mark completion only on the stream's terminal event (message_stop).",
          "Mark completion when the first content_block_delta arrives.",
          "Mark completion when the HTTP response headers are received.",
          "Mark completion when the connection closes, whatever the last event was."],
    rats=["Completion is signaled by the stream's final event, not by early content.",
          "The first delta is the beginning, not the end.",
          "Headers arrive before any content.",
          "A closed connection may be an error, not completion."])

E["P200-130"] = dict(
    opts=["After content_block_stop, once the accumulated JSON parses and validates.",
          "As soon as the tool name is known, filling arguments from earlier calls.",
          "On each input_json_delta, executing incrementally as fields arrive.",
          "When the opening brace of the argument object has been received."],
    rats=["input_json_delta fragments must be accumulated and parsed when the block stops.",
          "Guessed arguments are not the model's request.",
          "Partial deltas are not complete calls.",
          "An opening brace carries no arguments."],
    sources=[SRC["stream"], SRC["handle"]])

E["P200-131"] = dict(
    opts=["That the answer is partial, and which request was canceled.",
          "That the partial text is final, since the user chose to stop.",
          "That generation stopped for every active user on the shared host.",
          "That the partial text can be appended to history as a completed turn."],
    rats=["Cancellation should be explicit about partiality and scoped to the right request.",
          "Stopping does not make a partial answer complete.",
          "One user's cancel must not affect others.",
          "Recording partial output as a completed turn corrupts history."])

E["P200-132"] = dict(
    opts=["The partial text with a visible error state and a bounded retry option.",
          "The partial text with a success indicator so the user is not alarmed.",
          "A regenerated completion that fills in the missing ending automatically.",
          "An automatic retry loop that runs until a full response arrives."],
    rats=["Keep what arrived, show the failure honestly, and offer a bounded recovery.",
          "A success indicator misrepresents a failure.",
          "Invented completion text fabricates content.",
          "Unbounded automatic retries lack a limit and duplicate-effect checks."])

E["P200-133"] = dict(
    stem="A nightly job submits 5,000 document summaries through the Message Batches API. The engineer polls the batch immediately and sees processing_status 'in_progress'. What should the job do?",
    topic="Asynchronous processing",
    scope="architecture practice",
    opts=["Keep polling until processing_status is 'ended', then download results from results_url.",
          "Treat 'in_progress' as a transient error and resubmit the same requests as a new batch.",
          "Cancel the batch and switch to synchronous Messages calls to get results sooner.",
          "Download results_url now, since completed requests are streamed as they finish."],
    rats=["A batch starts in_progress and moves to ended when all requests finish; results are then available at results_url.",
          "in_progress is the normal state, not an error; resubmitting duplicates the work and cost.",
          "Canceling abandons the half-price asynchronous processing for a job that does not need low latency.",
          "Results become available when the batch ends or after 24 hours, not request by request."],
    sources=[SRC["batch"]],
    new=True,
    change="replaced off-blueprint item (local GPU admission control) with a Message Batches lifecycle item")

E["P200-134"] = dict(
    stem="A request to a model that supports manual extended thinking (interleaved thinking not enabled) sets max_tokens to 4,000 and thinking budget_tokens to 6,000. The request fails. What is the most likely cause?",
    topic="Extended thinking budgets",
    scope="architecture practice",
    opts=["budget_tokens must be below max_tokens, because thinking counts toward max_tokens.",
          "budget_tokens must be an exact multiple of 1,024 tokens, and 6,000 is not one.",
          "Extended thinking requires streaming, and the request was sent without it.",
          "A thinking budget cannot be combined with any tools in the same request."],
    rats=["Thinking tokens count toward max_tokens, so the budget must be less than max_tokens and leave room for the reply; the documented minimum is 1,024.",
          "The minimum is 1,024 tokens; there is no multiple-of-1,024 rule.",
          "Streaming is not required to enable thinking.",
          "Thinking works with tools; only forced tool_choice (any/tool) is unsupported in manual mode."],
    sources=[SRC["think"], SRC["think_ov"]],
    new=True,
    change="replaced off-blueprint item (request-body size limit) with an extended thinking budget_tokens item")

E["P200-135"] = dict(
    stem="A batch of 2,000 classification requests has ended. The job matches each result line to its input by position in the results file, and some labels land on the wrong records. What is the fix?",
    topic="Asynchronous processing",
    scope="architecture practice",
    opts=["Match results by the custom_id each request carried; result order is not guaranteed.",
          "Sort the results file by its line timestamp before matching by position.",
          "Submit smaller batches so the results file keeps the original request order.",
          "Re-run the mismatched records synchronously, since batch ordering is random."],
    rats=["Batch results can come back in any order; custom_id is the documented way to correlate them.",
          "Result lines carry no ordering guarantee to sort by; correlation must use custom_id.",
          "Batch size does not change the ordering guarantee.",
          "Re-running does not fix the correlation logic, and the results were correct."],
    sources=[SRC["batch"]],
    new=True,
    change="replaced off-blueprint item (server output budget) with a Message Batches result-correlation item")

E["P200-136"] = dict(
    stem="A service marks its system prompt with cache_control. Usage shows cache_creation_input_tokens on every request and cache_read_input_tokens always 0, even though requests arrive seconds apart. Which cause fits?",
    topic="Cache diagnostics",
    scope="architecture practice",
    opts=["Something before the breakpoint differs per request, such as a timestamp in the system prompt.",
          "The 5-minute cache lifetime has expired between requests and must be raised to 1 hour.",
          "The prompt is below the minimum cacheable length, so the API falls back silently.",
          "Cache reads are reported only when the breakpoint is placed on a user message."],
    rats=["A cache hit needs an identical prefix; any change before the breakpoint (tools, system text, images) forces a new write every time.",
          "Requests seconds apart are well inside the 5-minute lifetime, which also refreshes on use.",
          "Below the minimum, the request is processed without caching and no cache_creation tokens are reported.",
          "Reads are reported for any breakpoint position when the prefix matches."],
    sources=[SRC["cache"]],
    new=True,
    change="replaced off-blueprint item (dashboard polling) with a prompt caching diagnostics item")

E["P200-137"] = dict(
    opts=["A request correlation ID propagated through every step of the workflow.",
          "A timestamp rounded to the minute, recorded on each log line.",
          "A per-deployment identifier shared by all requests in a release.",
          "The user's account email recorded against every tool call."],
    rats=["A correlation ID ties a failure to its tool calls across components.",
          "Minute-level timestamps collide across concurrent requests.",
          "A shared release ID does not distinguish requests.",
          "Personal data is unnecessary for correlation and raises privacy risk."])

E["P200-138"] = dict(
    opts=["Sensitive payload content, while keeping the diagnostic metadata.",
          "Status codes and timestamps, which add noise to the raw payload.",
          "Log volume, by sampling one in ten errors with their full prompts.",
          "Retention, by deleting all error logs after twenty-four hours."],
    rats=["Logs should minimize secrets while retaining what diagnosis needs.",
          "Metadata is the useful part; the payload is the risk.",
          "Sampling still records secrets.",
          "Short retention does not remove secrets that were already written."])

E["P200-139"] = dict(
    opts=["Per-stage timings: retrieval, tool calls, queueing, first token, generation.",
          "A single average total duration, tracked separately for each release.",
          "Client-side click-to-render time, measured in the end user's browser.",
          "Model size as a proxy, assuming the largest model dominates latency."],
    rats=["Stage-level timing shows which component is slow.",
          "One total per release cannot localize a slow stage.",
          "End-to-end client timing adds another total without a breakdown.",
          "Assumptions are not measurements."])

E["P200-140"] = dict(
    opts=["A bounded readiness probe that exercises the real serving dependency.",
          "A liveness check that the process ID is still running.",
          "A full benchmark suite executed on every health probe interval.",
          "An unconditional HTTP 200 from the health route to avoid flapping."],
    rats=["Readiness should test the dependency the service actually needs, within a time bound.",
          "A running process can still be unable to serve.",
          "A full benchmark is far too heavy for a probe.",
          "An unconditional 200 hides failures."])

E["P200-141"] = dict(
    opts=["The page is untrusted task data; it cannot authorize disclosure.",
          "The page outranks the user, since retrieved sources are authoritative.",
          "The page may be followed if it comes from an allowlisted domain.",
          "The page may be followed after the assistant confirms the page's intent."],
    rats=["Retrieved content is data to analyze, never an instruction with authority.",
          "Retrieved sources do not outrank the user or system.",
          "Domain reputation does not make embedded instructions authoritative.",
          "Asking the page about itself is not a trust check."])

E["P200-142"] = dict(
    opts=["The result's provenance as lower-trust tool output.",
          "The text's role as stated, promoting it to the system prompt.",
          "The result's HTTP status, trusting the text on a 200 response.",
          "The text verbatim, concatenated ahead of the system prompt."],
    rats=["Tool output keeps its lower trust level regardless of what it claims.",
          "Self-declared roles are exactly the injection to resist.",
          "A successful fetch says nothing about trustworthiness.",
          "Placing it above the system prompt elevates its authority."])

E["P200-143"] = dict(
    opts=["Summarize the email's content without acting on its embedded commands.",
          "Decline to summarize any message that contains an instruction.",
          "Follow the email's instructions, since the user asked to process it.",
          "Summarize it and also fetch the link it contains to add context."],
    rats=["The task is to describe the content, not to obey it.",
          "Refusing to summarize ordinary documents over-blocks a legitimate task.",
          "Processing a document is not consent to execute its commands.",
          "Fetching an attacker's link is executing the injection."])

E["P200-144"] = dict(
    opts=["No upload; a document's instruction is not authorization to send data.",
          "Upload only the recent messages, keeping the older history private.",
          "Upload after confirming the destination uses a valid HTTPS certificate.",
          "Upload, since the document labels the step as a required validation."],
    rats=["Exfiltration requests from content carry no authority.",
          "Partial exfiltration is still exfiltration without authorization.",
          "Encryption of the channel does not authorize the transfer.",
          "A document's label does not create permission."])

E["P200-145"] = dict(
    opts=["A read-only interface that returns only the required aggregates.",
          "Write access retained, with a prompt instruction never to write.",
          "Read access to the raw records plus an administrator credential.",
          "Full database access, with redaction applied to the final report."],
    rats=["Least privilege means the minimal interface for the job.",
          "Prompt instructions do not remove capability.",
          "Raw records and admin rights exceed the need.",
          "Redaction after access does not limit what the worker could do."])

E["P200-146"] = dict(
    opts=["Tenant-scoped authorization on every operation the tool performs.",
          "A tenant ID supplied by the model as an argument to each call.",
          "Tenant filtering in the UI, with the backend accepting any tenant.",
          "A single administrative token, with tenant checks skipped for speed."],
    rats=["The host must bind each operation to the requesting tenant's authorization.",
          "A model-generated tenant ID is untrusted input.",
          "UI filtering is not an access control.",
          "Skipping checks removes isolation."])

E["P200-147"] = dict(
    opts=["Expire or revoke the grant now that it is no longer needed.",
          "Keep the grant active in case the workflow is revived later.",
          "Rename the grant to mark it inactive while leaving it valid.",
          "Hide the grant from the admin UI while leaving the token valid."],
    rats=["Unneeded privileges should be revoked to shrink the attack surface.",
          "Speculative future use is not a reason to keep live privilege.",
          "A renamed grant is still usable.",
          "Hiding does not revoke."])

E["P200-148"] = dict(
    opts=["A privileged executor separate from the model that generates proposals.",
          "Deployment credentials given to the model with instructions not to use them.",
          "A generated plan treated as approval once it passes a format check.",
          "Automatic execution of each proposal, followed by human review."],
    rats=["Separating proposal from privileged execution enforces the policy structurally.",
          "Possessing credentials with a promise is not separation.",
          "A plan is a proposal, not an approval.",
          "Review after execution does not prevent unauthorized changes."])

E["P200-149"] = dict(
    opts=["Keep the key on a trusted server and expose only a scoped API to the browser.",
          "Obfuscate the key inside the minified JavaScript bundle before shipping.",
          "Store the key in a hidden form field instead of the script source.",
          "Rename the key's variable so its purpose is not obvious to readers."],
    rats=["Secrets must stay server-side behind a scoped interface.",
          "Obfuscation is reversible; the key still ships to the client.",
          "Hidden fields are visible in the page source.",
          "A renamed secret is still a secret in public."])

E["P200-150"] = dict(
    opts=["Anonymous access to the diagnostic data; gate it behind authentication.",
          "The link to the debug route from the UI, leaving the route in place.",
          "The plaintext encoding; return the variables base64-encoded instead.",
          "The default exposure; return variables only when debug=true is passed."],
    rats=["Sensitive diagnostics must not be reachable without authorization.",
          "An unlinked route is still reachable.",
          "Base64 is an encoding, not protection.",
          "A query parameter is not an access control."])
