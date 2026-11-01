#!/usr/bin/env python3
"""Build questions.v3.json from the live snapshot plus the v3 edits tables.

Run with:  python3 -I build_v3.py
Validation is printed; the script exits non-zero if any hard check fails.
"""
import hashlib
import json
import os
import random
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import v3_edits_a, v3_edits_b, v3_edits_c, v3_edits_d, v3_edits_patch  # noqa: E402

SNAPSHOT = os.path.join(HERE, "questions.live-snapshot.json")
OUT = os.path.join(HERE, "questions.v3.json")

BANK_VERSION = "practice-200-v3-20261101"
REVIEWED_ON = "2026-11-01"
CHECKED_ON = "2026-11-01"
REVIEW_STATUS = ("v3: options length-balanced and distractors made plausible; flagged items "
                 "reworded; off-blueprint items replaced with doc-verified items. Assistant "
                 "review only; no independent expert or psychometric validation.")
SOURCE_BASIS = ("Original scenario and applied engineering reasoning; cited primary technical "
                "references read and checked on 2026-11-01. Not an official exam item and not a "
                "quotation from any reference.")
LETTERS = "ABCD"
SAFEGUARD = re.compile(r"\b(bounded|explicit(ly)?|authorized|validat\w*|reconcil\w*|scope[sd]?)\b", re.I)

EDITS = {}
for mod in (v3_edits_a, v3_edits_b, v3_edits_c, v3_edits_d):
    for k, v in mod.E.items():
        assert k not in EDITS, f"duplicate edit for {k}"
        EDITS[k] = v
for k, repl in v3_edits_patch.P.items():
    assert k in EDITS, f"patch for unknown item {k}"
    opts = list(EDITS[k]["opts"])
    for idx, text in repl.items():
        opts[idx] = text
    EDITS[k] = dict(EDITS[k], opts=opts)


def content_hash(stem, options, key):
    """sha256 of stem + options (A..D, newline-joined) + correct_option."""
    payload = stem + "\n" + "\n".join(options[L] for L in LETTERS) + "\n" + key
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def tokens(s):
    return set(re.findall(r"[a-z0-9_]+", s.lower()))


def jaccard(a, b):
    return len(a & b) / len(a | b) if (a | b) else 0.0


def assign_keys(ids, seed):
    rng = random.Random(seed)
    letters = list("A" * 50 + "B" * 50 + "C" * 50 + "D" * 50)
    rng.shuffle(letters)
    return dict(zip(ids, letters)), rng


def build(seed):
    with open(SNAPSHOT, encoding="utf-8") as f:
        snap = json.load(f)
    ids = [it["id"] for it in snap]
    key_for, rng = assign_keys(ids, seed)
    out = []
    for it in snap:
        iid = it["id"]
        ed = EDITS.get(iid)
        if ed is None:
            raise SystemExit(f"no v3 edit authored for {iid}")
        opts, rats = ed["opts"], ed["rats"]
        assert len(opts) == 4 and len(rats) == 4, iid
        key_letter = key_for[iid]
        distractor_idx = [1, 2, 3]
        rng.shuffle(distractor_idx)
        slots = {}
        rat_slots = {}
        d_iter = iter(distractor_idx)
        for L in LETTERS:
            if L == key_letter:
                slots[L], rat_slots[L] = opts[0], "Correct: " + rats[0]
            else:
                j = next(d_iter)
                slots[L], rat_slots[L] = opts[j], rats[j]
        stem = ed.get("stem", it["stem"])
        topic = ed.get("topic", it["topic"])
        domain = ed.get("domain", it["domain"])
        difficulty = ed.get("difficulty", it["difficulty"])
        scope = ed.get("scope", it["scope"])
        if "sources" in ed:
            sources = [{"title": t, "url": u, "checked_on": CHECKED_ON} for (t, u) in ed["sources"]]
        else:
            sources = [dict(s, checked_on=CHECKED_ON) for s in it["sources"]]
        key_reason = rats[0]
        reasoning = key_reason + "".join(
            f"\n\n{L}: {rat_slots[L]}" for L in LETTERS if L != key_letter)
        question = stem + "\n" + "\n".join(f"{L}) {slots[L]}" for L in LETTERS)
        new_item = {
            "id": iid,
            "domain": domain,
            "topic": topic,
            "difficulty": difficulty,
            "stem": stem,
            "question": question,
            "options": slots,
            "correct_option": key_letter,
            "reference_reasoning": reasoning,
            "distractor_rationales": rat_slots,
            "sources": sources,
            "source_basis": SOURCE_BASIS,
            "review_status": REVIEW_STATUS,
            "bank_version": BANK_VERSION,
            "official_exam_question": False,
            "training_or_model_eval_allowed": False,
            "learning_objective": f"{topic}: {key_reason}",
            "content_revision": 3,
            "reviewed_on": REVIEWED_ON,
            "scope": scope,
            "content_hash": content_hash(stem, slots, key_letter),
        }
        # keep the snapshot's key order
        ordered = {k: new_item[k] for k in it.keys()}
        for k in new_item:
            if k not in ordered:
                ordered[k] = new_item[k]
        out.append(ordered)
    return snap, out


def validate(snap, out):
    problems = []
    report = {}
    report["items"] = len(out)
    if len(out) != 200:
        problems.append(f"expected 200 items, got {len(out)}")
    ids = [i["id"] for i in out]
    expected_ids = [f"P200-{n:03d}" for n in range(1, 201)]
    if ids != expected_ids:
        problems.append("ids are not P200-001..P200-200 in order")
    if [i["id"] for i in snap] != ids:
        problems.append("ids differ from snapshot")

    dom = Counter(i["domain"] for i in out)
    report["domains"] = dict(sorted(dom.items()))
    if len(dom) != 10 or any(v != 20 for v in dom.values()):
        problems.append(f"domain counts not 10x20: {dict(dom)}")

    keys = Counter(i["correct_option"] for i in out)
    report["keys"] = dict(sorted(keys.items()))
    if any(keys[L] != 50 for L in LETTERS):
        problems.append(f"key distribution not 50/50/50/50: {dict(keys)}")

    diff = Counter(i["difficulty"] for i in out)
    report["difficulty"] = dict(sorted(diff.items()))
    snap_diff = Counter(i["difficulty"] for i in snap)
    if diff != snap_diff:
        problems.append(f"difficulty mix changed: {dict(diff)} vs snapshot {dict(snap_diff)}")

    # length balance and key-longest
    worst_ratio = 0.0
    worst_id = None
    key_longest = 0
    key_shortest = 0
    longest_pos = Counter()
    safeguard_only_key = 0
    ratio_fail = []
    for it in out:
        lens = {L: len(it["options"][L]) for L in LETTERS}
        lo, hi = min(lens.values()), max(lens.values())
        ratio = hi / lo if lo else 99
        if ratio > worst_ratio:
            worst_ratio, worst_id = ratio, it["id"]
        if ratio > 1.35:
            ratio_fail.append((it["id"], round(ratio, 3)))
        k = it["correct_option"]
        maxL = max(lens, key=lens.get)
        minL = min(lens, key=lens.get)
        # strictly longest
        if lens[k] > max(v for L, v in lens.items() if L != k):
            key_longest += 1
        if lens[k] < min(v for L, v in lens.items() if L != k):
            key_shortest += 1
        longest_pos[maxL] += 1
        sg = {L: bool(SAFEGUARD.search(it["options"][L])) for L in LETTERS}
        if sg[k] and not any(sg[L] for L in LETTERS if L != k):
            safeguard_only_key += 1
    report["worst_length_ratio"] = (round(worst_ratio, 3), worst_id)
    report["length_ratio_failures"] = ratio_fail
    if ratio_fail:
        problems.append(f"{len(ratio_fail)} items exceed 1.35 length ratio: {ratio_fail}")
    rate = key_longest / len(out)
    report["key_strictly_longest"] = (key_longest, round(rate, 3))
    report["key_strictly_shortest"] = key_shortest
    report["position_of_longest_option"] = dict(sorted(longest_pos.items()))
    if not (0.15 <= rate <= 0.35):
        problems.append(f"key-is-longest rate {rate:.3f} outside 15%-35%")
    report["key_only_option_with_safeguard_word"] = safeguard_only_key

    # rationales
    for it in out:
        for L in LETTERS:
            if not it["distractor_rationales"].get(L, "").strip():
                problems.append(f"{it['id']} missing rationale for {L}")
        if not it["distractor_rationales"][it["correct_option"]].startswith("Correct:"):
            problems.append(f"{it['id']} key rationale not marked Correct")
        exp_q = it["stem"] + "\n" + "\n".join(f"{L}) {it['options'][L]}" for L in LETTERS)
        if it["question"] != exp_q:
            problems.append(f"{it['id']} question text does not match stem+options")
        if it["content_hash"] != content_hash(it["stem"], it["options"], it["correct_option"]):
            problems.append(f"{it['id']} content_hash mismatch")
        if len(set(it["options"].values())) != 4:
            problems.append(f"{it['id']} has duplicate option text")
        for s in it["sources"]:
            if not re.match(r"^https?://", s["url"]):
                problems.append(f"{it['id']} non-http source {s['url']}")
            if s.get("checked_on") != CHECKED_ON:
                problems.append(f"{it['id']} source checked_on not {CHECKED_ON}")
        if not it["sources"]:
            problems.append(f"{it['id']} has no sources")
        for fld in ("bank_version", "reviewed_on", "content_revision", "review_status"):
            pass
        if it["bank_version"] != BANK_VERSION or it["reviewed_on"] != REVIEWED_ON or it["content_revision"] != 3:
            problems.append(f"{it['id']} metadata not v3")
        if it["official_exam_question"] is not False or it["training_or_model_eval_allowed"] is not False:
            problems.append(f"{it['id']} flags must be false")

    # near-duplicate stems
    toks = [(i["id"], tokens(i["stem"])) for i in out]
    dups = []
    max_j = (0.0, None, None)
    for a in range(len(toks)):
        for b in range(a + 1, len(toks)):
            j = jaccard(toks[a][1], toks[b][1])
            if j > max_j[0]:
                max_j = (j, toks[a][0], toks[b][0])
            if j > 0.45:
                dups.append((toks[a][0], toks[b][0], round(j, 3)))
    report["max_stem_jaccard"] = (round(max_j[0], 3), max_j[1], max_j[2])
    if dups:
        problems.append(f"near-duplicate stems (Jaccard>0.45): {dups}")

    # schema parity with snapshot
    snap_keys = list(snap[0].keys())
    for it in out:
        if list(it.keys()) != snap_keys:
            problems.append(f"{it['id']} schema keys differ from snapshot")
            break

    report["new_items"] = sorted(k for k, v in EDITS.items() if v.get("new"))
    report["scopes"] = dict(Counter(i["scope"] for i in out))
    return problems, report


def main():
    seed = 20261101
    for attempt in range(200):
        snap, out = build(seed + attempt)
        problems, report = validate(snap, out)
        rate_problem = any("key-is-longest" in p for p in problems)
        if not rate_problem:
            break
    print(f"seed used: {seed + attempt}")
    for k, v in report.items():
        print(f"{k}: {v}")
    if problems:
        print("\nVALIDATION FAILED:")
        for p in problems:
            print(" -", p)
        sys.exit(1)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"\nVALIDATION PASSED; wrote {OUT} ({len(out)} items)")


if __name__ == "__main__":
    main()
