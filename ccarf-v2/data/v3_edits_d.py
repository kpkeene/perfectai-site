# v3 edits, items P200-151 .. P200-200
from v3_edits_a import SRC

E = {}

E["P200-151"] = dict(
    opts=["An opaque, purpose-limited identifier that carries no personal data.",
          "The user's email address, since it is already unique and stable.",
          "A hash of the user's email, since hashing makes it non-personal.",
          "The session's access token, since it is already present on each call."],
    rats=["Correlation needs uniqueness, not identity; an opaque ID minimizes personal data.",
          "Email is direct personal data spread through every log.",
          "A deterministic hash of an identifier is still linkable to the person.",
          "Tokens are secrets and must never be used as log identifiers."])

E["P200-152"] = dict(
    opts=["Restrict the exposed log and rotate the credential through the approved process.",
          "Delete the offending log line and treat the secret as safe once it is gone.",
          "Rotate a related service credential while keeping the exposed one in use.",
          "Add a redaction filter for future logs and leave the existing entries alone."],
    rats=["Containment plus rotation of the exposed credential is the documented response.",
          "Deletion does not undo exposure; copies and readers may already exist.",
          "Rotating the wrong credential leaves the exposed one valid.",
          "Preventing recurrence does not address the secret already exposed."])

E["P200-153"] = dict(
    opts=["Structured arguments passed to a fixed operation, with no shell string built.",
          "A shell string with user text escaped by a quoting helper before execution.",
          "The same shell string executed under a dedicated low-privilege account.",
          "A denylist that rejects shell strings containing common dangerous tokens."],
    rats=["Removing shell composition removes the injection surface.",
          "Escaping is error-prone and still lets the model compose arbitrary commands.",
          "A lower-privilege account limits damage but leaves the injection path open.",
          "Denylists are routinely bypassed."],
    sources=[SRC["inj"], SRC["authz"]])

E["P200-154"] = dict(
    stem="A renderer evaluates JavaScript produced by the language model to animate answers. What safer design fits?",
    opts=["Validated, allowlisted scene descriptors rendered by trusted application code.",
          "Model-generated scripts run inside a sandboxed iframe with the same origin.",
          "Model-generated scripts accepted only when wrapped in a JSON envelope.",
          "Script URLs supplied by the model, loaded only over HTTPS connections."],
    rats=["Data, not code, should cross the trust boundary; trusted code renders it.",
          "A same-origin frame gives generated code the application's privileges.",
          "A JSON wrapper does not make executable code safe.",
          "HTTPS does not make an attacker-chosen script trustworthy."],
    sources=[SRC["inj"], SRC["authz"]])

E["P200-155"] = dict(
    opts=["Parameterized queries behind a constrained data-access interface.",
          "String concatenation with quote characters stripped from the output.",
          "SQL the model marks as read-only, executed under a reporting role.",
          "The same concatenation, run under a privileged account to avoid errors."],
    rats=["Parameterization separates code from data and is the documented defense.",
          "Stripping quotes is an incomplete, bypassable sanitizer.",
          "A model's label is not a security control; the SQL is still untrusted.",
          "More privilege makes a successful injection worse."])

E["P200-156"] = dict(
    opts=["That the fully resolved path stays inside the allowed root before any access.",
          "That the path string contains the workspace directory name somewhere.",
          "That a single leading '../' segment has been removed from the input.",
          "That the file extension is one of the allowed types for the tool."],
    rats=["Containment must be checked on the canonical resolved path.",
          "Substring checks are trivially bypassed.",
          "Removing one segment leaves others and encoded variants.",
          "Extension checks do not address traversal."],
    sources=[SRC["inj"], SRC["authz"]])

E["P200-157"] = dict(
    stem="A team wants Claude to reason at length before answering hard analysis questions, on a model that supports manual extended thinking. Which request change turns that on?",
    domain="Prompt and output design",
    topic="Extended thinking basics",
    scope="architecture practice",
    opts=["Add thinking: {type: 'enabled', budget_tokens: N} with N at least 1,024 and below max_tokens.",
          "Add a system prompt line asking the model to think step by step before replying.",
          "Raise max_tokens so the model has room to reason within its visible answer.",
          "Set tool_choice to {type: 'any'} so the model must reason through a tool call."],
    rats=["Manual extended thinking is enabled with the thinking parameter; the budget has a 1,024 minimum and must leave room under max_tokens.",
          "A prompt instruction produces visible reasoning text; it does not enable the thinking feature or its thinking blocks.",
          "max_tokens alone changes the ceiling, not whether thinking is enabled.",
          "Forced tool use is unrelated and is not supported together with manual extended thinking."],
    sources=[SRC["think"], SRC["think_ov"]],
    new=True,
    change="replaced off-blueprint item (home reverse-proxy routing) with an extended thinking basics item; domain reassigned to keep counts at 20")

E["P200-158"] = dict(
    stem="An MCP client connects to a remote Streamable HTTP server and receives HTTP 401 with a WWW-Authenticate header. Following the MCP authorization specification, what should the client do next?",
    topic="MCP authorization",
    scope="architecture practice",
    opts=["Use the header's resource_metadata URL to discover the authorization server and begin OAuth 2.1 with PKCE.",
          "Retry the request with the user's Anthropic API key in the Authorization header as a bearer token.",
          "Prompt the user for a username and password and send them to the MCP endpoint in the request body.",
          "Fall back to the stdio transport, since HTTP authorization is optional in the MCP specification."],
    rats=["The spec has the client read protected resource metadata (via WWW-Authenticate or the well-known URI), discover the authorization server, and run OAuth 2.1 with PKCE.",
          "Only tokens issued by the server's own authorization server are valid; an unrelated API key is not.",
          "MCP authorization is OAuth based; the resource server does not take user passwords.",
          "stdio is for local subprocess servers and does not solve a remote server's authorization."],
    sources=[SRC["mcp_authz"]],
    new=True,
    change="replaced off-blueprint item (home DNS/localhost reachability, also flagged ambiguous) with an MCP OAuth discovery item")

E["P200-159"] = dict(
    stem="A remote MCP server wraps a third-party API. To save work, it forwards the access token the MCP client presented straight to that upstream API. Which requirement does this violate?",
    topic="MCP authorization",
    scope="architecture practice",
    opts=["Servers must only accept tokens issued for them and must not pass a client's token through to upstream APIs.",
          "Servers must re-encrypt bearer tokens with their own key before forwarding them to any downstream service.",
          "Servers must include the token in the URL query string rather than a header when calling upstream APIs.",
          "Servers must refresh the client's token themselves before each upstream call, using the client's refresh token."],
    rats=["The spec requires audience validation and forbids token passthrough; upstream calls need a separate token from the upstream authorization server.",
          "There is no re-encryption rule; forwarding the token in any form is the violation.",
          "Tokens must never be placed in the URI query string, and passthrough is forbidden regardless.",
          "The server never holds the client's refresh token; it must obtain its own upstream credentials."],
    sources=[SRC["mcp_authz"]],
    new=True,
    change="replaced off-blueprint item (TLS certificate warning) with an MCP token-passthrough item")

E["P200-160"] = dict(
    stem="An MCP server uses sampling to have the host's model draft outreach emails from CRM records. The host application auto-approves every sampling/createMessage request to keep the flow smooth. What does the MCP specification recommend instead?",
    topic="MCP sampling",
    scope="architecture practice",
    opts=["Keep a human able to review, edit, and deny sampling requests and the returned completions.",
          "Give the server its own model API key so it no longer needs to route requests through the client.",
          "Let the server pick the exact model by name and bypass the client's preference handling.",
          "Approve requests automatically but cap maxTokens so a misuse cannot generate long output."],
    rats=["The spec says there should always be a human in the loop able to deny sampling, review prompts, and review generated responses before delivery.",
          "Sampling exists so servers need no API keys; the client keeps control of model access.",
          "Model hints are advisory; the client makes the final selection.",
          "A token cap does not restore the human review the spec calls for."],
    sources=[SRC["mcp_sampling"]],
    new=True,
    change="replaced off-blueprint item (reverse-proxy change policy) with an MCP sampling human-in-the-loop item")

E["P200-161"] = dict(
    opts=["A project CLAUDE.md committed at the repository root.",
          "A CLAUDE.local.md committed so everyone gets the same file.",
          "A ~/.claude/CLAUDE.md on each developer's machine.",
          "A .claude/settings.local.json with the conventions as JSON."],
    rats=["Project CLAUDE.md is the shared, version-controlled place for team instructions.",
          "CLAUDE.local.md is for personal preferences and belongs in .gitignore.",
          "User-level files are personal and not shared with the repository.",
          "settings.local.json is personal, uncommitted configuration, not instructions."])

E["P200-162"] = dict(
    opts=["A Markdown rule under .claude/rules/ with a paths: frontmatter glob.",
          "A section in the root CLAUDE.md headed 'API conventions' for reference.",
          "A permissions allow rule in settings.json that matches the API path.",
          "A rule file named api-only.md placed in .claude/rules/ without frontmatter."],
    rats=["paths frontmatter loads a rule only when Claude works on matching files.",
          "Root CLAUDE.md content loads for every task, not just API files.",
          "Permission rules control tool access, not instructions.",
          "Without paths metadata the rule loads unconditionally."])

E["P200-163"] = dict(
    opts=["Run the agent's task in a separate git worktree on its own branch.",
          "Run both in the same checkout, asking the agent to avoid the developer's files.",
          "Open the agent in a second terminal window on the same working directory.",
          "Stash the developer's changes before the agent starts, then restore them."],
    rats=["Worktrees give each task an isolated checkout, avoiding edit collisions.",
          "Instructions do not isolate the filesystem.",
          "A second window shares the same files.",
          "Stashing disrupts the developer and still shares one checkout."])

E["P200-164"] = dict(
    opts=[".claude/settings.local.json in the project, which is kept out of git.",
          ".claude/settings.json in the project, with a comment marking it personal.",
          "~/.claude/settings.json, which applies to every project on the machine.",
          "The managed settings file, edited to add a project-specific override."],
    rats=["settings.local.json is the documented personal, project-specific, uncommitted scope.",
          "Project settings.json is shared with the team through version control.",
          "User settings are not repository-specific.",
          "Managed settings are organization-controlled and not for personal preferences."])

E["P200-165"] = dict(
    opts=["PreToolUse, where an exit code of 2 blocks the proposed call.",
          "PostToolUse, which fires once the tool has completed.",
          "PermissionRequest, where exit code 2 denies the call.",
          "UserPromptSubmit, which fires before the prompt is processed."],
    rats=["PreToolUse runs before execution and exit code 2 blocks the tool call.",
          "PostToolUse runs after the tool has already modified the file.",
          "Exit code 2 is not honored for PermissionRequest; it only fires when a permission decision is needed.",
          "UserPromptSubmit sees the user's prompt, not the proposed tool call."],
    change="weak distractors replaced with real hook events that require discrimination")

E["P200-166"] = dict(
    opts=["The edit already ran; the hook's feedback can drive a repair but did not prevent it.",
          "The hook's exit code 2 rolled the edit back, so the file is already restored.",
          "The hook blocked the write, because PostToolUse runs before changes are flushed.",
          "The edit is acceptable, because a hook that ran without error implies compliance."],
    rats=["PostToolUse cannot block; the tool already ran, so feedback guides repair only.",
          "Exit code 2 on PostToolUse shows stderr to Claude; it does not roll anything back.",
          "PostToolUse fires after the tool succeeds, not before.",
          "Running a hook is not evidence of compliance; the hook found a violation."])

E["P200-167"] = dict(
    opts=["Review the hook as executable code that runs with the developer's permissions.",
          "Review the hook's Markdown description, since hooks are advisory prompts.",
          "Enable the hook in a trial session and review it after its first run.",
          "Accept the hook if CI passed, since hooks cannot affect the host machine."],
    rats=["Command hooks execute shell commands in the developer's environment and need code review.",
          "Hooks are not prompts; they run commands.",
          "A side effect may already be harmful by the time it is observed.",
          "Hooks run on the host machine; CI status does not vouch for them."])

E["P200-168"] = dict(
    opts=["The tool call is blocked and the stderr text is fed back to Claude.",
          "The tool call runs and the stderr text is shown to the user as a warning.",
          "The session ends immediately and the stderr text is written to the log.",
          "The tool call is blocked and all earlier file changes are rolled back."],
    rats=["For PreToolUse, exit 2 blocks the call and returns stderr to Claude.",
          "Exit 2 on PreToolUse blocks; it is not a decorative warning.",
          "Exit 2 does not terminate the session.",
          "No rollback occurs; only the proposed call is blocked."])

E["P200-169"] = dict(
    opts=["claude -p \"<prompt>\" (print mode).",
          "claude -c \"<prompt>\" (continue mode).",
          "claude --permission-mode plan \"<prompt>\".",
          "claude --output-format json \"<prompt>\"."],
    rats=["-p/--print runs one prompt noninteractively and exits.",
          "-c continues the most recent conversation and, without -p, stays interactive.",
          "Plan mode changes what Claude may do, not whether the session is interactive.",
          "--output-format applies to print mode; on its own this starts an interactive session."],
    change="weak distractors replaced with real flags that do not provide noninteractive execution")

E["P200-170"] = dict(
    opts=["--output-format json, which returns the result envelope as JSON.",
          "--input-format stream-json, which switches the CLI to JSON mode.",
          "--json-schema, which converts the whole result envelope to JSON.",
          "--output-format stream-json, which emits one JSON envelope at exit."],
    rats=["--output-format json is the documented print-mode output format for a JSON result envelope.",
          "--input-format governs how input is read, not how the result is presented.",
          "--json-schema constrains the final structured output to a schema; it is not the envelope format flag.",
          "stream-json emits a stream of events, not a single envelope at exit."])

E["P200-171"] = dict(
    opts=["--max-turns 3, which exits with an error when the limit is reached.",
          "--max-budget-usd 3, which stops the run once three turns have been billed.",
          "--permission-mode dontAsk, which ends the run at the first prompt instead.",
          "--output-format json, which limits the run to a single structured turn."],
    rats=["--max-turns limits agentic turns in print mode and exits with an error at the limit.",
          "--max-budget-usd caps estimated spend in dollars, not turns.",
          "dontAsk denies calls that would prompt; it does not bound turns.",
          "Output format does not limit turns."])

E["P200-172"] = dict(
    opts=["--append-system-prompt \"<instruction>\", which adds to the default prompt.",
          "--system-prompt \"<instruction>\", which keeps the default and adds to it.",
          "--system-prompt-file ./review.txt, which merges the file into the default.",
          "--output-format text with the instruction, which configures system text."],
    rats=["--append-system-prompt appends custom text to the end of the default system prompt.",
          "--system-prompt replaces the entire system prompt.",
          "--system-prompt-file also replaces the default prompt.",
          "--output-format controls presentation, not instructions."])

E["P200-173"] = dict(
    stem="A team defines a custom subagent in .claude/agents/bug-hunter.md (a non-fork subagent), and Claude delegates a narrow bug investigation to it. What should the parent expect about the subagent's context?",
    opts=["It starts fresh with the delegation message, not the parent's conversation history.",
          "It inherits the parent's full conversation history, like any subagent would.",
          "It shares the parent's context window, so its tool calls appear in the parent transcript.",
          "It receives the parent's history only when the model field is set to inherit."],
    rats=["A non-fork subagent starts with a fresh, isolated context and a delegation message; only its result returns to the parent.",
          "Only a fork inherits the whole conversation; a custom non-fork subagent starts fresh.",
          "Subagents run in their own context window; their tool calls stay out of the parent's.",
          "model: inherit selects the model, not the conversation history."],
    change="reworded to a custom .claude/agents non-fork subagent; fork behavior re-verified on 2026-11-01")

E["P200-174"] = dict(
    opts=["A tools: allowlist of read and search tools in the subagent's frontmatter.",
          "A line in the subagent's system prompt asking it to avoid making edits.",
          "A model: haiku setting, since a smaller model is less likely to edit files.",
          "A disallowedTools list naming Bash, with Edit and Write left available."],
    rats=["The tools frontmatter restricts which tools the subagent can use, and host permissions still apply.",
          "Prompt text does not remove the Edit capability.",
          "Model choice has nothing to do with tool access.",
          "Leaving Edit and Write available does not express a read-only boundary."],
    sources=[SRC["cc_sub"], SRC["cc_perm"]])

E["P200-175"] = dict(
    opts=["A skill: a SKILL.md with optional supporting files under .claude/skills/<name>/.",
          "A hook: a PostToolUse command entry in .claude/settings.json.",
          "A rule: a Markdown file under .claude/rules/ with a paths: frontmatter.",
          "A subagent: a Markdown file under .claude/agents/ with its own system prompt."],
    rats=["Skills package reusable instructions with optional supporting files.",
          "Hooks run commands at lifecycle events; they are not procedure packages.",
          "Rules are path-scoped context, not invocable procedures with files.",
          "A subagent is a separate-context worker, not a packaged procedure with supporting files."])

E["P200-176"] = dict(
    opts=["Changed file references, observed validation results, and remaining uncertainty.",
          "A confidence percentage for the fix in place of file references.",
          "The subagent's full reasoning transcript rather than its test outcomes.",
          "A one-line status of fixed or not fixed, to keep the handoff compact."],
    rats=["A reviewable handoff names what changed, what was checked, and what is unknown.",
          "Confidence without artifacts is unverifiable.",
          "Reasoning is not evidence that tests passed.",
          "A bare status gives the reviewer nothing to inspect."],
    sources=[SRC["cc_sub"], SRC["cc_best"]])

E["P200-177"] = dict(
    opts=["A permissions deny rule or managed setting, tested against the file's access paths.",
          "A stronger CLAUDE.md instruction in capital letters near the top of the file.",
          "A .claude/rules/ file with a paths: glob that matches the secrets file.",
          "A PostToolUse hook that logs any read of the file for later audit."],
    rats=["CLAUDE.md is context, not enforcement; deny rules and managed settings are enforced, and must cover each access path.",
          "Emphasis does not make an instruction enforceable.",
          "Rules files are instructions loaded into context, not access controls.",
          "A PostToolUse hook observes after the read has already happened."],
    sources=[SRC["cc_perm"], SRC["cc_memory"]])

E["P200-178"] = dict(
    opts=["A worktree is a fresh checkout; dependencies and approved local config need setup.",
          "A worktree shares untracked files with the main checkout automatically.",
          "A worktree should receive a copy of every local file, secrets included.",
          "A worktree cannot run the project until the main checkout is cleaned."],
    rats=["Gitignored files and installed dependencies are absent in a new worktree unless explicitly provided.",
          "Untracked and ignored files are not shared between worktrees.",
          "Copying secrets wholesale is unnecessary and risky.",
          "The main checkout's state does not block the worktree."])

E["P200-179"] = dict(
    opts=["--json-schema '<schema>', validated JSON after the workflow completes.",
          "--output-format json alone, which enforces any required fields.",
          "--append-system-prompt with the schema, which the CLI validates.",
          "--max-turns 1, which forces a single structured final answer."],
    rats=["--json-schema produces validated JSON matching the schema in print mode.",
          "--output-format json formats the envelope; it does not enforce your fields.",
          "A prompt is advisory and the CLI does not validate against it.",
          "A turn limit does not constrain output structure."])

E["P200-180"] = dict(
    opts=["The affected UI exercised at relevant screen sizes, reviewed alongside the code.",
          "The agent's completion statement, which already reflects its own checks.",
          "A successful compile and a checksum of the changed source files.",
          "A second agent's review concluding that the change looks complete."],
    rats=["Behavioral change needs behavioral evidence, not just syntax checks.",
          "A completion sentence is a claim, not evidence.",
          "Compiling proves syntax, not interaction behavior.",
          "Another opinion is still not an observed result."])

E["P200-181"] = dict(
    opts=["Retrieving the current authorized policy source at answer time.",
          "Fine-tuning on the latest policy each week and redeploying.",
          "A long system prompt refreshed when someone remembers to update it.",
          "A public policy document with a similar title, retrieved by web search."],
    rats=["Fresh, access-controlled facts belong in retrieval, not in weights.",
          "Weekly retraining is slow, costly, and still lags the source.",
          "Manual refresh is unreliable and the prompt is not the source of truth.",
          "A similar public document is not the company's authorized policy."])

E["P200-182"] = dict(
    opts=["A clear style instruction with a few examples, measured before retraining.",
          "A fine-tuning run on a corpus of past replies written in the house style.",
          "A switch to a larger model, on the theory that scale improves style.",
          "A post-processing rewrite of every answer by a second model call."],
    rats=["Prompting is the cheapest lever and should be measured first.",
          "Training is expensive and should follow, not precede, prompt experiments.",
          "Scale does not define style and adds cost.",
          "A second call doubles cost before the cheap option is tried."])

E["P200-183"] = dict(
    opts=["An application-side authorization check plus the required approval for that order.",
          "The user's authentication, which establishes they may act for the company.",
          "The user's explicit approval, which substitutes for a formal spending limit.",
          "Schema validation of the order payload, which confirms it is well formed."],
    rats=["Authentication and approval are not authority; the application must enforce the purchase limit.",
          "Authentication identifies the user; it does not grant spending authority.",
          "Approval by someone without authority does not create authority.",
          "A well-formed payload is unrelated to authorization."])

E["P200-184"] = dict(
    opts=["A deterministic calculator tool called with structured inputs.",
          "A prompt asking for a step-by-step written derivation.",
          "Sampling several answers and taking the most common value.",
          "A lower temperature so the first numeric answer is more stable."],
    rats=["Deterministic computation belongs in a tool, not in generated text.",
          "Written derivations help but do not guarantee exact arithmetic.",
          "Voting is probabilistic and costly; exactness is not guaranteed.",
          "Temperature affects variability, not correctness."])

E["P200-185"] = dict(
    stem="A team wants to embed an agent that reads files, runs commands, and edits code inside its own Python service, reusing Claude Code's tools, agent loop, and context management rather than rebuilding them. Which option fits?",
    topic="Agent SDK basics",
    scope="architecture practice",
    opts=["The Claude Agent SDK, driving the agent through its query() function.",
          "The Claude API client SDK, writing the tool loop and file tools in-house.",
          "The Claude Code CLI launched interactively from the service for each task.",
          "The Message Batches API, submitting each coding task as a batch request."],
    rats=["The Agent SDK exposes Claude Code's tools, agent loop, and context management as a Python or TypeScript library.",
          "The client SDK gives direct API access; you would build the agent loop and tools yourself.",
          "The interactive CLI is for terminal use, not embedding in a service.",
          "Batches process Messages requests asynchronously; they are not an agent harness."],
    sources=[SRC["sdk_ov"]],
    new=True,
    change="replaced off-blueprint item (session scoping in a study app) with an Agent SDK basics item")

E["P200-186"] = dict(
    stem="An Agent SDK service runs jobs for many customers on one host. Engineers notice an agent picked up a CLAUDE.md and hooks from the host's filesystem. Which option change is documented for this isolation need?",
    topic="Agent SDK configuration",
    scope="architecture practice",
    opts=["Set setting_sources to an empty list so user, project, and local settings are not loaded.",
          "Set permission_mode to plan so filesystem settings are read but never executed.",
          "Set allowed_tools to Read only so the agent cannot execute hooks it discovers.",
          "Set cwd to a temporary directory; settings are loaded only from the home folder."],
    rats=["Omitting setting_sources loads user, project, and local settings; an empty list disables them, which the docs recommend for multi-tenant isolation.",
          "Plan mode governs edits, not which settings files are loaded.",
          "The tool allowlist does not control settings discovery, and filesystem hooks run outside the tool list.",
          "cwd changes where project settings are found; user settings under ~/.claude still load by default."],
    sources=[SRC["sdk_feat"]],
    new=True,
    change="replaced off-blueprint item (cancel-button scoping) with an Agent SDK settingSources item")

E["P200-187"] = dict(
    stem="An intake workflow must always call extract_fields on the first turn so the result is machine-parseable, on a model that supports forced tool use. Which request setting does this?",
    topic="Forcing tool use",
    scope="architecture practice",
    opts=["tool_choice: {type: 'tool', name: 'extract_fields'}",
          "tool_choice: {type: 'auto'} with 'use extract_fields' in the prompt",
          "tool_choice: {type: 'none'} with extract_fields as the only tool",
          "tools: [extract_fields] alone, since a single tool is always called"],
    rats=["tool_choice type tool forces the named tool to be called.",
          "auto leaves the decision to the model, so a text answer is still possible.",
          "none prevents any tool call.",
          "With tools provided, the default is auto; a single tool is not guaranteed to be called."],
    sources=[SRC["toolchoice"]],
    new=True,
    change="replaced off-blueprint item (localStorage migration, also flagged ambiguous) with a tool_choice item")

E["P200-188"] = dict(
    scope="architecture practice",
    opts=["Offer a fresh or summarized session and say what context is retained.",
          "Drop the oldest constraints silently and continue the conversation.",
          "Keep answering while stating that the full history is still available.",
          "Raise max_tokens so the missing input can be regenerated in the reply."],
    rats=["Honest recovery tells the user what was kept and what was lost.",
          "Silently dropping constraints breaks later answers.",
          "Claiming unlimited memory after truncation is false.",
          "Output budget cannot restore missing input."])

E["P200-189"] = dict(
    stem="A classifier endpoint exposes three label tools and must return exactly one tool call every time, but may choose which. On a model that supports forced tool use, which tool_choice fits?",
    topic="Forcing tool use",
    scope="architecture practice",
    opts=["{type: 'any'}, which requires some tool call without naming which one.",
          "{type: 'auto'}, which lets the model answer in text when it prefers.",
          "{type: 'tool', name: ...}, which fixes a single tool for every request.",
          "{type: 'none'}, which asks the model to pick a label in plain text."],
    rats=["any forces the model to use one of the provided tools but does not pick which.",
          "auto permits a plain-text answer, so a tool call is not guaranteed.",
          "tool forces one specific tool, removing the model's choice among labels.",
          "none disables tool use entirely."],
    sources=[SRC["toolchoice"]],
    new=True,
    change="replaced off-blueprint item (study feedback) with a tool_choice any-vs-auto item")

E["P200-190"] = dict(
    stem="An MCP server needs the user's preferred region before it can finish a tools/call, and later will need the user's API key for a third-party service. How should it request each, per the MCP specification?",
    topic="MCP elicitation",
    scope="architecture practice",
    opts=["Form-mode elicitation for the region; URL-mode elicitation for the API key.",
          "Form-mode elicitation for both, with the key field marked as a password type.",
          "A tool error for the region asking the model to guess; URL mode for the key.",
          "URL-mode elicitation for both, since all user input must stay out of band."],
    rats=["Form mode suits non-sensitive structured input; the spec requires URL mode for secrets such as API keys.",
          "Servers must not request passwords, API keys, or tokens through form mode.",
          "A tool error is not a user-input mechanism, and guessing is not elicitation.",
          "Form mode exists for ordinary input; URL mode is for sensitive interactions."],
    sources=[SRC["mcp_elicit"]],
    new=True,
    change="replaced off-blueprint item (review filter UI) with an MCP elicitation item")

E["P200-191"] = dict(
    stem="A filesystem MCP server should operate only inside the directories the user has opened in the host. Which MCP mechanism communicates those boundaries, and whose job is enforcement?",
    topic="MCP roots",
    scope="architecture practice",
    opts=["Roots listed by the client via roots/list; the server should respect them and validate paths.",
          "A system prompt from the host naming the directories; the model enforces them.",
          "Resource URIs published by the server; the client enforces them on each read.",
          "A sampling request from the server asking the model which paths are allowed."],
    rats=["Roots are client-exposed file:// boundaries; servers should respect them and validate paths, while clients expose only permitted roots.",
          "Prompts are not a protocol mechanism and the model cannot enforce filesystem bounds.",
          "Resources are server-published data, not client-declared boundaries.",
          "Sampling requests completions; it does not define operating boundaries."],
    sources=[SRC["mcp_roots"]],
    new=True,
    change="replaced off-blueprint item (tutor disagreement display) with an MCP roots item")

E["P200-192"] = dict(
    stem="A team wants every developer who clones the repository to get the same MCP servers in Claude Code, with credentials supplied from each developer's environment rather than committed. Which configuration fits?",
    topic="MCP configuration scope",
    scope="architecture practice",
    opts=["A project-scope .mcp.json at the repo root using ${VAR} expansion for secrets.",
          "A user-scope entry in each developer's ~/.claude.json, shared by a setup script.",
          "A local-scope entry in ~/.claude.json committed to the repository as a template.",
          "A project-scope .mcp.json with the credentials inlined, protected by .gitignore."],
    rats=["Project scope lives in .mcp.json, is meant to be checked in, supports ${VAR} and ${VAR:-default} expansion, and Claude Code asks for approval before using it.",
          "User scope is per machine and private; it is not shared through version control.",
          "Local scope is stored in ~/.claude.json for one project and is not shareable.",
          "Gitignoring .mcp.json defeats sharing, and inlined secrets are a leak risk."],
    sources=[SRC["cc_mcp"]],
    new=True,
    change="replaced off-blueprint item (dashboard score claim) with a .mcp.json project-scope item")

E["P200-193"] = dict(
    stem="A developer runs Claude Code in repo/services/api/. There is a CLAUDE.md at repo/, another at repo/services/api/, and a third at repo/services/api/tests/. Which of these load at launch?",
    topic="CLAUDE.md hierarchy",
    scope="architecture practice",
    opts=["repo/CLAUDE.md and repo/services/api/CLAUDE.md; the tests/ one loads when Claude works in that folder.",
          "Only repo/services/api/CLAUDE.md, because the nearest file overrides any others in the tree.",
          "All three files, because every CLAUDE.md under the repository root is loaded at launch.",
          "Only repo/CLAUDE.md, because project instructions are read from the repository root alone."],
    rats=["Files in the working directory and its ancestors load at launch and are concatenated; subdirectory files load on demand.",
          "Ancestor files are concatenated, not overridden.",
          "Subdirectory CLAUDE.md files load on demand, not at launch.",
          "The working directory's own CLAUDE.md also loads."],
    sources=[SRC["cc_memory"]],
    new=True,
    change="replaced off-blueprint item (reduced-motion accessibility) with a CLAUDE.md hierarchy item")

E["P200-194"] = dict(
    stem="A CLAUDE.md is getting long, so a team wants to pull in a shared style guide from docs/style.md without pasting it. Which mechanism does Claude Code document for this?",
    topic="CLAUDE.md imports",
    scope="architecture practice",
    opts=["An @docs/style.md import line, resolved relative to the importing file.",
          "A Markdown link to docs/style.md, which Claude Code follows on load.",
          "A paths: frontmatter entry naming docs/style.md in CLAUDE.md.",
          "An include: key in .claude/settings.json listing docs/style.md."],
    rats=["@path imports load the file with the CLAUDE.md; paths resolve relative to the importing file and may nest up to four hops.",
          "Links are not followed automatically.",
          "paths frontmatter scopes .claude/rules files; it is not an import mechanism.",
          "No such settings key exists."],
    sources=[SRC["cc_memory"]],
    new=True,
    change="replaced off-blueprint item (canvas text alternative) with a CLAUDE.md @import item")

E["P200-195"] = dict(
    stem="Before letting Claude Code touch an unfamiliar service, an engineer wants it to explore the code and propose an approach without editing anything until they approve. Which built-in mode supports this?",
    topic="Plan mode",
    scope="architecture practice",
    opts=["Plan mode, entered with Shift+Tab or --permission-mode plan.",
          "acceptEdits mode, which stages edits for review before applying.",
          "dontAsk mode, which denies edits and reports what it would change.",
          "bypassPermissions mode, run inside a container to keep it safe."],
    rats=["Plan mode has Claude research and propose changes without editing until the plan is approved.",
          "acceptEdits applies file edits without prompting; it does not stage them.",
          "dontAsk denies calls that would prompt; it is a lockdown for scripts, not a planning mode.",
          "bypassPermissions skips checks entirely, the opposite of the requirement."],
    sources=[SRC["cc_plan"]],
    new=True,
    change="replaced off-blueprint item (keyboard accessibility) with a plan mode item")

E["P200-196"] = dict(
    stem="A team wants a /release-check command available to everyone who clones the repo, taking the release tag as an argument. Which setup matches Claude Code's documented mechanism?",
    topic="Custom slash commands",
    scope="architecture practice",
    opts=[".claude/commands/release-check.md (or a skill's SKILL.md) using $ARGUMENTS for the tag.",
          "A 'release-check' entry in .claude/settings.json whose value is the prompt text.",
          "A release-check.md in ~/.claude/commands/ on each machine, since commands are personal.",
          "A .claude/rules/release-check.md whose paths: frontmatter matches the release tag."],
    rats=["A Markdown file in .claude/commands/ (or .claude/skills/<name>/SKILL.md) creates /release-check and $ARGUMENTS carries the invocation arguments.",
          "settings.json holds configuration, not command prompts.",
          "Project commands live in the repository; personal ones are not shared with cloners.",
          "Rules are path-scoped context; they are not invocable commands."],
    sources=[SRC["cc_slash"]],
    new=True,
    change="replaced off-blueprint item (humor vs error messaging, also citation mismatch) with a custom slash command item")

E["P200-197"] = dict(
    stem="A booking tool's JSON schema marks passenger_count as an integer, yet the model sometimes passes a string such as \"2\". The team wants the input shape guaranteed. Which tool-definition change does this?",
    topic="Strict tool use",
    scope="architecture practice",
    opts=["Set strict: true on the tool so inputs are validated against the schema.",
          "Add 'passenger_count must be an integer' to the tool description.",
          "Change the field type to string and parse the integer in the handler.",
          "Set tool_choice to {type: 'tool'} so the model focuses on one schema."],
    rats=["Strict tool use guarantees that tool inputs conform to the declared schema.",
          "Descriptions guide the model but do not guarantee the type.",
          "Loosening the schema moves the problem into the handler.",
          "tool_choice forces a call; it does not validate the input."],
    sources=[SRC["so"], SRC["toolchoice"]],
    new=True,
    change="replaced off-blueprint item (fine-tuning claim) with a strict tool use item")

E["P200-198"] = dict(
    stem="A database subagent is allowed Bash so it can run SQL, but the team wants every command checked by a script before it runs, only for that subagent. Where does Claude Code let them attach that check?",
    topic="Subagent hooks",
    scope="architecture practice",
    opts=["A hooks: block in the subagent's frontmatter with a PreToolUse matcher on Bash.",
          "A PreToolUse hook in ~/.claude/settings.json, which applies only to subagents.",
          "A tools: entry in the frontmatter listing the approved SQL statements.",
          "A PostToolUse hook in .claude/settings.json matching Bash, to block bad SQL."],
    rats=["Subagent frontmatter supports a hooks block scoped to that subagent, and PreToolUse can block the command.",
          "User settings hooks apply to all your sessions, not only to subagents.",
          "tools lists tool names, not SQL statements.",
          "PostToolUse runs after the command and cannot block it."],
    sources=[SRC["cc_sub"], SRC["cc_hooks"]],
    new=True,
    change="replaced off-blueprint item (adapter manifest) with a subagent-scoped hooks item")

E["P200-199"] = dict(
    stem="A developer has a personal code-reviewer subagent in ~/.claude/agents/ and the repository ships one with the same name in .claude/agents/. Which definition does Claude Code use in that project?",
    topic="Subagent definitions",
    scope="architecture practice",
    opts=["The project's .claude/agents/ version; project scope has higher priority than user scope.",
          "The ~/.claude/agents/ version; personal definitions always override shared ones.",
          "Both are merged, with frontmatter fields from the project and the body from the user.",
          "Neither; Claude Code refuses to load subagents whose names collide across scopes."],
    rats=["When names collide, Claude Code uses the definition from the higher-priority location, and project scope outranks user scope.",
          "User-level subagents have lower priority than project-level ones.",
          "Definitions are not merged.",
          "Collisions are resolved by priority, not rejected."],
    sources=[SRC["cc_sub"]],
    new=True,
    change="replaced off-blueprint item (TV-script licensing) with a subagent precedence item")

E["P200-200"] = dict(
    stem="A team needs a final JSON report from Claude whose schema uses minLength on strings and a numeric maximum. With structured outputs, the request returns 400. What is the documented explanation?",
    topic="Structured outputs limits",
    scope="architecture practice",
    opts=["String length and numeric range constraints are unsupported; remove them and validate those rules client-side.",
          "The schema must be sent as a strict tool rather than as output_config.format when it contains constraints.",
          "Structured outputs are available only on a subset of models, so the model must be changed.",
          "The grammar compilation timed out on the first request, so the identical request should be retried."],
    rats=["minLength, maxLength, minimum and maximum are listed as unsupported and return a 400; such rules belong in client-side validation.",
          "Strict tools share the same schema limitations.",
          "Structured outputs are available on every model.",
          "The error is a schema feature error, not a compilation timeout."],
    sources=[SRC["so"]],
    new=True,
    change="replaced off-blueprint item (humor model comparison) with a structured outputs schema-limits item")
