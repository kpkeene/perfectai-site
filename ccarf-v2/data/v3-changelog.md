# Practice bank v3 changelog (practice-200-v3-20261101)

Produced 2026-11-01 from `questions.live-snapshot.json` (v2, 200 items) by `build_v3.py`
with the edit tables `v3_edits_a.py` .. `v3_edits_d.py` and the rebalancing layer
`v3_edits_patch.py`. Output: `questions.v3.json` (200 items, same schema, ids P200-001..P200-200).
Run: `python3 -I build_v3.py`.

This is assistant-authored practice material. It is not official exam content, and no
independent expert or psychometric validation was performed.

## Validation report (printed by build_v3.py)

```
seed used: 20261101
items: 200
domains: {'Agent orchestration': 20, 'Application design': 20, 'Claude Code workflows': 20, 'Context and retrieval': 20, 'Evaluation': 20, 'MCP': 20, 'Prompt and output design': 20, 'Reliability': 20, 'Security and trust': 20, 'Tool use': 20}
keys: {'A': 50, 'B': 50, 'C': 50, 'D': 50}
difficulty: {'Advanced': 50, 'Applied': 100, 'Foundational': 50}
worst_length_ratio: (1.344, 'P200-176')
length_ratio_failures: []
key_strictly_longest: (45, 0.225)
key_strictly_shortest: 31
position_of_longest_option: {'A': 58, 'B': 41, 'C': 52, 'D': 49}
key_only_option_with_safeguard_word: 0
max_stem_jaccard: (0.346, 'P200-001', 'P200-004')
new_items: ['P200-076', 'P200-098', 'P200-111', 'P200-133', 'P200-134', 'P200-135', 'P200-136', 'P200-157', 'P200-158', 'P200-159', 'P200-160', 'P200-185', 'P200-186', 'P200-187', 'P200-189', 'P200-190', 'P200-191', 'P200-192', 'P200-193', 'P200-194', 'P200-195', 'P200-196', 'P200-197', 'P200-198', 'P200-199', 'P200-200']
scopes: {'architecture practice': 200}

VALIDATION PASSED; wrote /home/claude/ccarf-v2/data/questions.v3.json (200 items)
```

Interpretation:

- Every item's four options are within a 1.35x character-length ratio (worst 1.344, P200-176).
- The key is strictly the longest option in 45/200 items (22.5%; snapshot was 96/200 = 48%) and
  strictly the shortest in 31/200, so option length no longer predicts the key.
- Key letters are 50/50/50/50 and the longest option falls on A/B/C/D 58/41/52/49 times, so
  key position is not correlated with length.
- 0 items where the key is the only option containing a safeguard word
  (bounded / explicit / authorized / validate / reconcile / scope); snapshot had ~39.
- Max token-Jaccard between any two stems is 0.346 (threshold 0.45).
- 10 domains x 20 items; difficulty mix unchanged (50 Foundational / 100 Applied / 50 Advanced).
- `question` == stem + "\n" + "A) ...\nB) ...\nC) ...\nD) ..." for every item.
- `content_hash` = sha256(stem + "\n" + "\n".join(options A..D) + "\n" + correct_option).
  The snapshot's exact hash recipe could not be reproduced from the stated description, so v3
  defines it explicitly as above.

## What changed, by requirement

1. **Answer cueing removed (all 200 items).** Every option set was rewritten so the four options
   are similar in length and every distractor is a professionally phrased action or diagnosis a
   reasonable engineer might choose, each wrong for a stated reason (see `distractor_rationales`).
   Safeguard words now appear in distractors as well. Keys were re-assigned by a seeded balanced
   shuffle (50 per letter) with distractors shuffled, so key position is independent of the text.
2. **Flagged items fixed.**
   - P200-173 (ambiguous): reworded to a custom non-fork subagent in `.claude/agents/`. Re-verified
     at code.claude.com/docs/en/sub-agents on 2026-11-01: fork mode is on by default from
     v2.1.302 and a fork inherits the whole conversation; a non-fork subagent starts with a fresh
     context. The item no longer makes a "by default" claim about all subagents.
   - P200-158 and P200-187 (ambiguous): both are also on the off-blueprint list and were replaced
     outright (MCP OAuth discovery; tool_choice).
   - P200-092: domain moved to Security and trust. To keep 20/20, replaced item P200-157 was
     assigned to Prompt and output design (extended thinking basics, Foundational, matching the
     replaced item's difficulty).
   - Weak distractors strengthened: P200-165 (real hook events PostToolUse / PermissionRequest /
     UserPromptSubmit), P200-169 (real flags -c, --permission-mode plan, --output-format),
     P200-034 (competing approval policies), P200-047 (four layers), P200-045 (four diagnoses).
   - Citation mismatches: P200-089/090/091 now test what the structured-outputs page documents
     (constrained decoding guarantee; unsupported `minimum`; schema vs business rules).
     P200-125 adds the AWS backoff-and-jitter article; P200-126 and P200-031 add Stripe's
     idempotent-requests reference; P200-128 adds the Azure Circuit Breaker pattern page;
     P200-006, P200-016 and P200-127 add the Google SRE chapter on cascading failures
     (deadlines, retry amplification, per-client limits); P200-008 adds the Agent SDK cost-tracking
     page (per-step usage, cumulative cost, spend cap). P200-005 was narrowed so its key rests on
     what Building Effective Agents actually says (stopping conditions; pausing on blockers).
     P200-133, 157-160, 185, 187, 196 were replaced, which removes those mismatches.
3. **Off-blueprint items replaced (26).** See the table below. Each new item is an original
   scenario; every fact in it was read on the cited page on 2026-11-01 via WebFetch. `scope` is now
   "architecture practice" for all 200 items (the 20 "supplemental engineering practice" items
   were among those replaced, plus P200-188 which was kept and relabeled).
4. Metadata: `bank_version` = practice-200-v3-20261101, `reviewed_on` = 2026-11-01,
   `content_revision` = 3 on all items (every item changed), `review_status` set to the v3 text,
   `source_basis` reworded to say references were read and checked; `official_exam_question` and
   `training_or_model_eval_allowed` remain false.

## New items and the page each was verified against

| id | domain | difficulty | topic | verified against |
|---|---|---|---|---|
| P200-076 | Context and retrieval | Advanced | Cache design | https://platform.claude.com/docs/en/build-with-claude/prompt-caching |
| P200-098 | Prompt and output design | Applied | Citations | https://platform.claude.com/docs/en/build-with-claude/citations |
| P200-111 | Evaluation | Applied | Evaluation at scale | https://platform.claude.com/docs/en/build-with-claude/batch-processing |
| P200-133 | Reliability | Foundational | Asynchronous processing | https://platform.claude.com/docs/en/build-with-claude/batch-processing |
| P200-134 | Reliability | Applied | Extended thinking budgets | https://platform.claude.com/docs/en/build-with-claude/extended-thinking<br>https://platform.claude.com/docs/en/build-with-claude/thinking |
| P200-135 | Reliability | Applied | Asynchronous processing | https://platform.claude.com/docs/en/build-with-claude/batch-processing |
| P200-136 | Reliability | Advanced | Cache diagnostics | https://platform.claude.com/docs/en/build-with-claude/prompt-caching |
| P200-157 | Prompt and output design | Foundational | Extended thinking basics | https://platform.claude.com/docs/en/build-with-claude/extended-thinking<br>https://platform.claude.com/docs/en/build-with-claude/thinking |
| P200-158 | Security and trust | Applied | MCP authorization | https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization |
| P200-159 | Security and trust | Applied | MCP authorization | https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization |
| P200-160 | Security and trust | Advanced | MCP sampling | https://modelcontextprotocol.io/specification/2025-11-25/client/sampling |
| P200-185 | Application design | Foundational | Agent SDK basics | https://code.claude.com/docs/en/agent-sdk/overview |
| P200-186 | Application design | Applied | Agent SDK configuration | https://code.claude.com/docs/en/agent-sdk/claude-code-features |
| P200-187 | Application design | Applied | Forcing tool use | https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use |
| P200-189 | Application design | Foundational | Forcing tool use | https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use |
| P200-190 | Application design | Applied | MCP elicitation | https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation |
| P200-191 | Application design | Applied | MCP roots | https://modelcontextprotocol.io/specification/2025-11-25/client/roots |
| P200-192 | Application design | Advanced | MCP configuration scope | https://code.claude.com/docs/en/mcp |
| P200-193 | Application design | Foundational | CLAUDE.md hierarchy | https://code.claude.com/docs/en/memory |
| P200-194 | Application design | Applied | CLAUDE.md imports | https://code.claude.com/docs/en/memory |
| P200-195 | Application design | Applied | Plan mode | https://code.claude.com/docs/en/permission-modes |
| P200-196 | Application design | Advanced | Custom slash commands | https://code.claude.com/docs/en/slash-commands |
| P200-197 | Application design | Foundational | Strict tool use | https://platform.claude.com/docs/en/build-with-claude/structured-outputs<br>https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use |
| P200-198 | Application design | Applied | Subagent hooks | https://code.claude.com/docs/en/sub-agents<br>https://code.claude.com/docs/en/hooks |
| P200-199 | Application design | Applied | Subagent definitions | https://code.claude.com/docs/en/sub-agents |
| P200-200 | Application design | Advanced | Structured outputs limits | https://platform.claude.com/docs/en/build-with-claude/structured-outputs |

Facts used (all read on 2026-11-01):
- tool_choice: `auto` (default with tools), `any`, `tool` + `name`, `none`; `any`/`tool` not supported
  with manual extended thinking and return 400 on some newest models, hence "on a model that
  supports forced tool use" in the stems.
- Message Batches: asynchronous, 50% of standard price, most finish within 1 hour, 24-hour
  expiry, `processing_status` in_progress -> ended, results at `results_url` (.jsonl), results in
  any order so correlate by `custom_id`, results kept 29 days.
- Extended thinking (manual): `thinking: {type: "enabled", budget_tokens}`, minimum 1,024, budget
  must be below `max_tokens` (except interleaved thinking), budget is a target not a hard cap,
  thinking tokens billed as output, `thinking` blocks carry a `signature` and must be passed back
  unmodified in tool-use turns. The page marks manual mode legacy in favor of adaptive thinking;
  items are scoped to "a model that supports manual extended thinking".
- Prompt caching: `cache_control {type: "ephemeral"}`, optional `ttl: "1h"`, up to 4 breakpoints,
  prefix order tools -> system -> messages, a breakpoint caches the prefix ending at that block,
  5-minute default lifetime refreshed on use, `cache_creation_input_tokens` /
  `cache_read_input_tokens`, prompts below the per-model minimum are processed without caching.
- Structured outputs: `output_config.format` with `json_schema` (the older `output_format` is
  deprecated) and `strict: true` on tools; constrained decoding; unsupported keywords (minLength,
  maxLength, minimum, maximum, recursive schemas, etc.) return 400; available on every model;
  incompatible with citations.
- Citations: `citations: {enabled: true}` on document blocks (all or none), `cited_text`,
  `char_location` / `page_location` / `content_block_location`, cannot be combined with
  structured outputs.
- Claude Agent SDK: Python/TypeScript `query()`, same tools/agent loop/context management as
  Claude Code; omitting `settingSources` loads user+project+local; `settingSources: []` disables
  filesystem settings and is recommended for multi-tenant isolation; client SDK requires writing
  the tool loop yourself.
- MCP authorization: OAuth 2.1, server is a resource server, discovery via WWW-Authenticate
  `resource_metadata` or well-known URI, PKCE required, `resource` parameter (RFC 8707), tokens in
  `Authorization: Bearer`, never in the query string, audience validation required, token
  passthrough forbidden.
- MCP sampling: human in the loop should be able to review/edit/deny requests and completions;
  servers need no API keys; model hints are advisory.
- MCP elicitation: form mode for structured non-sensitive data; servers MUST NOT request secrets
  via form mode and MUST use URL mode for them; accept/decline/cancel.
- MCP roots: client exposes `file://` roots via `roots/list`; servers should respect boundaries and
  validate paths; clients expose only permitted roots.
- Claude Code `.mcp.json`: project scope, checked into version control, approval prompt before
  use, `${VAR}` / `${VAR:-default}` expansion; local and user scopes live in `~/.claude.json`;
  precedence local > project > user.
- CLAUDE.md: managed / `~/.claude/CLAUDE.md` / `./CLAUDE.md` or `./.claude/CLAUDE.md` /
  `CLAUDE.local.md` (gitignored); ancestors load at launch and are concatenated; subdirectory
  files load on demand; `@path` imports resolve relative to the importing file, up to four hops,
  skipped inside code spans; CLAUDE.md is context, not enforcement (use permissions / hooks).
- Plan mode: `Shift+Tab`, `/plan`, `--permission-mode plan`; researches and proposes without
  editing until the plan is approved; other modes default, acceptEdits, auto, dontAsk,
  bypassPermissions.
- Custom slash commands: `.claude/commands/<name>.md` -> `/name`; merged with skills
  (`.claude/skills/<name>/SKILL.md` creates the same command); `$ARGUMENTS`; subdirectory
  namespacing `/dir:name`.
- Subagents and hooks: `.claude/agents/` (project) outranks `~/.claude/agents/` (user) on name
  collisions; frontmatter `tools`, `disallowedTools`, `model`, `hooks` (scoped to the subagent);
  PreToolUse exit 2 blocks, PostToolUse cannot block, PermissionRequest ignores exit 2,
  UserPromptSubmit fires before the prompt is processed.
- CLI: `-p/--print`, `-c/--continue`, `--output-format text|json|stream-json`,
  `--input-format text|stream-json`, `--max-turns`, `--max-budget-usd`, `--json-schema`,
  `--append-system-prompt`, `--system-prompt` (replaces), `--permission-mode`.

## Not verified / caveats (honest notes)

- The snapshot's `content_hash` recipe could not be reproduced; v3 defines its own (above).
- OWASP, Google SRE, AWS, Stripe and Microsoft pages were read for topic support only; they are
  general engineering references, not Claude documentation.
- P200-115, P200-116 and P200-117 (seeds/variance, ablations, production monitoring) still cite the
  develop-tests page, which covers evaluation methodology generally but not those specific topics.
  They were not in the audit's flag list and were left with their original citation; their keys
  are general evaluation practice rather than Claude-specific claims.
- P200-005's key (treat a repeating identical failure as a blocker and stop/pause) is applied
  reasoning anchored to the article's statements about stopping conditions and pausing on
  blockers; the article does not describe signature-based loop detection, which is why that
  mechanism was removed from the key.
- The Messages API reference page was too large to read fully through the fetch tool; usage-field
  facts were taken from the prompt-caching, thinking and Agent SDK cost-tracking pages instead.
- The Claude Code hooks page notes that `Edit|Write` style matchers are exact-match lists and
  regexes apply only when other characters are present; no item depends on matcher syntax.
- Whether these topics match the official CCA-F blueprint cannot be confirmed from public
  official sources; the gap list came from the audit, and items are labeled practice material.

## Per-item change log

| id | domain (v3) | difficulty | key v2->v3 | change type | note |
|---|---|---|---|---|---|
| P200-001 | Agent orchestration | Foundational | A->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-002 | Agent orchestration | Applied | A->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-003 | Agent orchestration | Applied | B->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-004 | Agent orchestration | Advanced | A->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-005 | Agent orchestration | Foundational | D->B | options rewritten: length-balanced, plausible distractors, key rotated; stem reworded; rebalance patch | citation narrowed: key now rests on stopping conditions and pausing on blockers, which the cited article supports |
| P200-006 | Agent orchestration | Applied | B->A | options rewritten: length-balanced, plausible distractors, key rotated; sources changed | added a source that discusses deadlines |
| P200-007 | Agent orchestration | Applied | C->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-008 | Agent orchestration | Advanced | A->A | options rewritten: length-balanced, plausible distractors, key rotated; sources changed; rebalance patch | added a source that documents per-step usage accumulation and a spend cap |
| P200-009 | Agent orchestration | Foundational | A->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-010 | Agent orchestration | Applied | B->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-011 | Agent orchestration | Applied | B->A | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-012 | Agent orchestration | Advanced | C->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-013 | Agent orchestration | Foundational | C->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-014 | Agent orchestration | Applied | B->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-015 | Agent orchestration | Applied | D->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-016 | Agent orchestration | Advanced | A->B | options rewritten: length-balanced, plausible distractors, key rotated; sources changed | added a source that discusses overload, per-client limits and retry amplification |
| P200-017 | Agent orchestration | Foundational | D->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-018 | Agent orchestration | Applied | B->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-019 | Agent orchestration | Applied | C->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-020 | Agent orchestration | Advanced | A->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-021 | Tool use | Foundational | D->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-022 | Tool use | Applied | C->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-023 | Tool use | Applied | A->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-024 | Tool use | Advanced | B->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-025 | Tool use | Foundational | C->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-026 | Tool use | Applied | D->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-027 | Tool use | Applied | C->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-028 | Tool use | Advanced | A->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-029 | Tool use | Foundational | C->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-030 | Tool use | Applied | D->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-031 | Tool use | Applied | A->C | options rewritten: length-balanced, plausible distractors, key rotated; sources changed | added a source that documents idempotency keys for safe retries |
| P200-032 | Tool use | Advanced | D->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-033 | Tool use | Foundational | A->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-034 | Tool use | Applied | A->A | options rewritten: length-balanced, plausible distractors, key rotated | weak distractors replaced with plausible competing policies |
| P200-035 | Tool use | Applied | B->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-036 | Tool use | Advanced | C->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-037 | Tool use | Foundational | A->A | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-038 | Tool use | Applied | C->C | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-039 | Tool use | Applied | C->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-040 | Tool use | Advanced | D->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-041 | MCP | Foundational | B->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-042 | MCP | Applied | D->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-043 | MCP | Applied | D->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-044 | MCP | Advanced | D->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-045 | MCP | Foundational | D->A | options rewritten: length-balanced, plausible distractors, key rotated | all four options are now diagnoses, removing the grammatical cue |
| P200-046 | MCP | Applied | D->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-047 | MCP | Applied | A->A | options rewritten: length-balanced, plausible distractors, key rotated | all four options are now layers, removing the grammatical cue |
| P200-048 | MCP | Advanced | C->C | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-049 | MCP | Foundational | B->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-050 | MCP | Applied | B->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-051 | MCP | Applied | A->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-052 | MCP | Advanced | B->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-053 | MCP | Foundational | C->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-054 | MCP | Applied | A->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-055 | MCP | Applied | C->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-056 | MCP | Advanced | C->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-057 | MCP | Foundational | B->C | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-058 | MCP | Applied | D->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-059 | MCP | Applied | A->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-060 | MCP | Advanced | D->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-061 | Context and retrieval | Foundational | C->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-062 | Context and retrieval | Applied | B->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-063 | Context and retrieval | Applied | D->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-064 | Context and retrieval | Advanced | C->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-065 | Context and retrieval | Foundational | B->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-066 | Context and retrieval | Applied | C->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-067 | Context and retrieval | Applied | B->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-068 | Context and retrieval | Advanced | D->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-069 | Context and retrieval | Foundational | C->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-070 | Context and retrieval | Applied | B->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-071 | Context and retrieval | Applied | C->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-072 | Context and retrieval | Advanced | B->C | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-073 | Context and retrieval | Foundational | A->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-074 | Context and retrieval | Applied | D->C | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-075 | Context and retrieval | Applied | B->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-076 | Context and retrieval | Advanced | C->A | REPLACED (new doc-verified item); sources changed; rebalance patch | replaced off-blueprint item (demo-label question) with a prompt caching cache_control item |
| P200-077 | Context and retrieval | Foundational | C->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-078 | Context and retrieval | Applied | D->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-079 | Context and retrieval | Applied | A->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-080 | Context and retrieval | Advanced | D->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-081 | Prompt and output design | Foundational | C->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-082 | Prompt and output design | Applied | A->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-083 | Prompt and output design | Applied | A->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-084 | Prompt and output design | Advanced | D->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-085 | Prompt and output design | Foundational | C->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-086 | Prompt and output design | Applied | B->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-087 | Prompt and output design | Applied | B->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-088 | Prompt and output design | Advanced | C->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-089 | Prompt and output design | Foundational | D->A | options rewritten: length-balanced, plausible distractors, key rotated; stem reworded; rebalance patch | item now tests the structured-outputs mechanism the cited page documents |
| P200-090 | Prompt and output design | Applied | A->D | options rewritten: length-balanced, plausible distractors, key rotated; stem reworded | item now distinguishes what structured outputs guarantee from business validation |
| P200-091 | Prompt and output design | Applied | C->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-092 | Security and trust | Advanced | B->A | options rewritten: length-balanced, plausible distractors, key rotated; domain Prompt and output design -> Security and trust | moved from Prompt and output design to Security and trust |
| P200-093 | Prompt and output design | Foundational | A->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-094 | Prompt and output design | Applied | A->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-095 | Prompt and output design | Applied | A->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-096 | Prompt and output design | Advanced | C->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-097 | Prompt and output design | Foundational | A->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-098 | Prompt and output design | Applied | C->D | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (bank describing itself) with a citations-feature item |
| P200-099 | Prompt and output design | Applied | C->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-100 | Prompt and output design | Advanced | B->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-101 | Evaluation | Foundational | D->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-102 | Evaluation | Applied | A->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-103 | Evaluation | Applied | A->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-104 | Evaluation | Advanced | B->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-105 | Evaluation | Foundational | B->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-106 | Evaluation | Applied | B->A | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-107 | Evaluation | Applied | D->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-108 | Evaluation | Advanced | A->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-109 | Evaluation | Foundational | D->C | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-110 | Evaluation | Applied | A->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-111 | Evaluation | Applied | D->C | REPLACED (new doc-verified item); sources changed; rebalance patch | replaced off-blueprint item (humor judging) with a Message Batches API item |
| P200-112 | Evaluation | Advanced | A->C | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-113 | Evaluation | Foundational | A->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-114 | Evaluation | Applied | C->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-115 | Evaluation | Applied | B->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-116 | Evaluation | Advanced | D->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-117 | Evaluation | Foundational | D->A | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-118 | Evaluation | Applied | D->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-119 | Evaluation | Applied | A->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-120 | Evaluation | Advanced | D->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-121 | Reliability | Foundational | C->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-122 | Reliability | Applied | A->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-123 | Reliability | Applied | B->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-124 | Reliability | Advanced | B->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-125 | Reliability | Foundational | C->C | options rewritten: length-balanced, plausible distractors, key rotated; sources changed; rebalance patch | added a source that documents jitter |
| P200-126 | Reliability | Applied | D->C | options rewritten: length-balanced, plausible distractors, key rotated; sources changed; rebalance patch | added a source that documents idempotency keys |
| P200-127 | Reliability | Applied | B->D | options rewritten: length-balanced, plausible distractors, key rotated; sources changed |  |
| P200-128 | Reliability | Advanced | B->A | options rewritten: length-balanced, plausible distractors, key rotated; sources changed; rebalance patch | added a source that documents the circuit breaker pattern |
| P200-129 | Reliability | Foundational | C->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-130 | Reliability | Applied | A->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-131 | Reliability | Applied | A->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-132 | Reliability | Advanced | D->C | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-133 | Reliability | Foundational | C->C | REPLACED (new doc-verified item); sources changed; rebalance patch | replaced off-blueprint item (local GPU admission control) with a Message Batches lifecycle item |
| P200-134 | Reliability | Applied | D->B | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (request-body size limit) with an extended thinking budget_tokens item |
| P200-135 | Reliability | Applied | B->C | REPLACED (new doc-verified item); sources changed; rebalance patch | replaced off-blueprint item (server output budget) with a Message Batches result-correlation item |
| P200-136 | Reliability | Advanced | B->C | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (dashboard polling) with a prompt caching diagnostics item |
| P200-137 | Reliability | Foundational | B->A | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-138 | Reliability | Applied | A->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-139 | Reliability | Applied | C->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-140 | Reliability | Advanced | C->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-141 | Security and trust | Foundational | D->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-142 | Security and trust | Applied | B->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-143 | Security and trust | Applied | C->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-144 | Security and trust | Advanced | B->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-145 | Security and trust | Foundational | B->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-146 | Security and trust | Applied | D->C | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-147 | Security and trust | Applied | A->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-148 | Security and trust | Advanced | B->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-149 | Security and trust | Foundational | C->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-150 | Security and trust | Applied | D->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-151 | Security and trust | Applied | B->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-152 | Security and trust | Advanced | A->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-153 | Security and trust | Foundational | B->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-154 | Security and trust | Applied | C->D | options rewritten: length-balanced, plausible distractors, key rotated; stem reworded; rebalance patch |  |
| P200-155 | Security and trust | Applied | D->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-156 | Security and trust | Advanced | C->C | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-157 | Prompt and output design | Foundational | B->C | REPLACED (new doc-verified item); domain Security and trust -> Prompt and output design; sources changed | replaced off-blueprint item (home reverse-proxy routing) with an extended thinking basics item; domain reassigned to keep counts at 20 |
| P200-158 | Security and trust | Applied | B->D | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (home DNS/localhost reachability, also flagged ambiguous) with an MCP OAuth discovery item |
| P200-159 | Security and trust | Applied | D->B | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (TLS certificate warning) with an MCP token-passthrough item |
| P200-160 | Security and trust | Advanced | D->B | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (reverse-proxy change policy) with an MCP sampling human-in-the-loop item |
| P200-161 | Claude Code workflows | Foundational | A->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-162 | Claude Code workflows | Applied | B->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-163 | Claude Code workflows | Applied | A->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-164 | Claude Code workflows | Advanced | C->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-165 | Claude Code workflows | Foundational | C->B | options rewritten: length-balanced, plausible distractors, key rotated | weak distractors replaced with real hook events that require discrimination |
| P200-166 | Claude Code workflows | Applied | C->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-167 | Claude Code workflows | Applied | D->A | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-168 | Claude Code workflows | Advanced | C->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-169 | Claude Code workflows | Foundational | C->D | options rewritten: length-balanced, plausible distractors, key rotated | weak distractors replaced with real flags that do not provide noninteractive execution |
| P200-170 | Claude Code workflows | Applied | C->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-171 | Claude Code workflows | Applied | C->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-172 | Claude Code workflows | Advanced | A->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-173 | Claude Code workflows | Foundational | D->A | options rewritten: length-balanced, plausible distractors, key rotated; stem reworded | reworded to a custom .claude/agents non-fork subagent; fork behavior re-verified on 2026-11-01 |
| P200-174 | Claude Code workflows | Applied | D->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-175 | Claude Code workflows | Applied | B->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-176 | Claude Code workflows | Advanced | C->B | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-177 | Claude Code workflows | Foundational | D->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-178 | Claude Code workflows | Applied | B->A | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-179 | Claude Code workflows | Applied | A->B | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-180 | Claude Code workflows | Advanced | A->A | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-181 | Application design | Foundational | D->D | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-182 | Application design | Applied | A->A | options rewritten: length-balanced, plausible distractors, key rotated; rebalance patch |  |
| P200-183 | Application design | Applied | D->D | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-184 | Application design | Advanced | B->C | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-185 | Application design | Foundational | B->C | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (session scoping in a study app) with an Agent SDK basics item |
| P200-186 | Application design | Applied | D->C | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (cancel-button scoping) with an Agent SDK settingSources item |
| P200-187 | Application design | Applied | B->A | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (localStorage migration, also flagged ambiguous) with a tool_choice item |
| P200-188 | Application design | Advanced | A->A | options rewritten: length-balanced, plausible distractors, key rotated |  |
| P200-189 | Application design | Foundational | D->B | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (study feedback) with a tool_choice any-vs-auto item |
| P200-190 | Application design | Applied | D->B | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (review filter UI) with an MCP elicitation item |
| P200-191 | Application design | Applied | C->B | REPLACED (new doc-verified item); sources changed; rebalance patch | replaced off-blueprint item (tutor disagreement display) with an MCP roots item |
| P200-192 | Application design | Advanced | D->D | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (dashboard score claim) with a .mcp.json project-scope item |
| P200-193 | Application design | Foundational | C->A | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (reduced-motion accessibility) with a CLAUDE.md hierarchy item |
| P200-194 | Application design | Applied | D->A | REPLACED (new doc-verified item); sources changed; rebalance patch | replaced off-blueprint item (canvas text alternative) with a CLAUDE.md @import item |
| P200-195 | Application design | Applied | A->D | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (keyboard accessibility) with a plan mode item |
| P200-196 | Application design | Advanced | A->A | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (humor vs error messaging, also citation mismatch) with a custom slash command item |
| P200-197 | Application design | Foundational | B->C | REPLACED (new doc-verified item); sources changed; rebalance patch | replaced off-blueprint item (fine-tuning claim) with a strict tool use item |
| P200-198 | Application design | Applied | A->A | REPLACED (new doc-verified item); sources changed; rebalance patch | replaced off-blueprint item (adapter manifest) with a subagent-scoped hooks item |
| P200-199 | Application design | Applied | A->A | REPLACED (new doc-verified item); sources changed | replaced off-blueprint item (TV-script licensing) with a subagent precedence item |
| P200-200 | Application design | Advanced | B->D | REPLACED (new doc-verified item); sources changed; rebalance patch | replaced off-blueprint item (humor model comparison) with a structured outputs schema-limits item |
