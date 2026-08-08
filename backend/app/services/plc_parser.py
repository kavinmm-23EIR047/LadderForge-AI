# # app/services/plc_parser.py
# import logging

# logger = logging.getLogger(__name__)

# # Tags that indicate the AI used a generic/fallback name instead of a real one
# GENERIC_TAGS = {"input", "output", "value", "tag", "contact", "coil", ""}


# # ---------------- FIX AI FORMAT ----------------
# def fix_ai_format(plc):
#     """
#     Convert raw AI-generated PLC JSON into standardized structure.
#     Logs warnings for generic/suspicious tags instead of silently masking them.
#     """
#     for rung in plc.get("rungs", []):
#         cleaned = []

#         for inst in rung.get("instructions", []):
#             t = inst.get("type", "").lower()

#             # CONTACT
#             if t == "contact":
#                 tag = inst.get("contact_id") or inst.get("tag", "")
#                 if not tag or tag in GENERIC_TAGS:
#                     logger.warning(
#                         f"[fix_ai_format] Generic/missing tag in contact: {inst}"
#                     )
#                 cleaned.append({
#                     "type": "contact",
#                     "mode": inst.get("mode", "NO"),
#                     "tag": tag or "input"
#                 })

#             # COIL
#             elif t == "coil":
#                 tag = inst.get("coil_id") or inst.get("tag", "")
#                 mode = inst.get("mode", "OTE")
#                 if not tag or tag in GENERIC_TAGS:
#                     logger.warning(
#                         f"[fix_ai_format] Generic/missing tag in coil: {inst}"
#                     )
#                 cleaned.append({
#                     "type": "coil",
#                     "mode": mode,   # preserve OTE / OTU / OTL
#                     "tag": tag or "output"
#                 })

#             # SET
#             elif t == "set":
#                 tag = inst.get("tag", "")
#                 if not tag or tag in GENERIC_TAGS:
#                     logger.warning(
#                         f"[fix_ai_format] Generic/missing tag in set: {inst}"
#                     )
#                 cleaned.append({
#                     "type": "set",
#                     "tag": tag or "output"
#                 })

#             # RESET
#             elif t == "reset":
#                 tag = inst.get("tag", "")
#                 if not tag or tag in GENERIC_TAGS:
#                     logger.warning(
#                         f"[fix_ai_format] Generic/missing tag in reset: {inst}"
#                     )
#                 cleaned.append({
#                     "type": "reset",
#                     "tag": tag or "output"
#                 })

#             # COMPARE
#             elif t == "compare":
#                 tag = inst.get("compare_id") or inst.get("tag", "")
#                 if not tag or tag in GENERIC_TAGS:
#                     logger.warning(
#                         f"[fix_ai_format] Generic/missing tag in compare: {inst}"
#                     )

#                 # Ensure value is numeric — AI sometimes puts operator string here
#                 raw_value = inst.get("value", 0)
#                 try:
#                     numeric_value = float(raw_value)
#                     # Convert to int if it's a whole number for cleaner output
#                     if numeric_value == int(numeric_value):
#                         numeric_value = int(numeric_value)
#                 except (ValueError, TypeError):
#                     logger.warning(
#                         f"[fix_ai_format] Non-numeric compare value '{raw_value}' in: {inst} — defaulting to 0"
#                     )
#                     numeric_value = 0

#                 cleaned.append({
#                     "type": "compare",
#                     "operator": inst.get("operator", "EQU"),
#                     "tag": tag or "value",
#                     "value": numeric_value
#                 })

#             # TIMER
#             elif t == "timer":
#                 cleaned.append({
#                     "type": "timer",
#                     "subtype": inst.get("subtype", "TON"),
#                     "tag": inst.get("tag", "T1"),
#                     "preset": inst.get("preset", 5000),
#                     "acc": inst.get("acc", 0),
#                     "done": inst.get("done", False)
#                 })

#             # COUNTER
#             elif t == "counter":
#                 cleaned.append({
#                     "type": "counter",
#                     "subtype": inst.get("subtype", "CTU"),
#                     "tag": inst.get("tag", "C1"),
#                     "preset": inst.get("preset", 0),
#                     "acc": inst.get("acc", 0)
#                 })

#             # MOVE
#             elif t == "move":
#                 cleaned.append({
#                     "type": "move",
#                     "source": inst.get("source", ""),
#                     "destination": inst.get("destination", "")
#                 })

#             # MATH
#             elif t in ["add", "sub", "mul", "div"]:
#                 cleaned.append({
#                     "type": t,
#                     "source_a": inst.get("source_a", 0),
#                     "source_b": inst.get("source_b", 0),
#                     "destination": inst.get("destination", "result")
#                 })

#             # KEEP OTHER VALID BLOCKS AS-IS
#             else:
#                 cleaned.append(inst)

#         rung["instructions"] = cleaned

#     return plc


# # ---------------- REMOVE INVALID ----------------
# def remove_invalid(plc):
#     """
#     Remove unsupported logical words and empty-type instructions.
#     """
#     invalid_types = {"and", "or", ""}

#     for rung in plc.get("rungs", []):
#         before = len(rung.get("instructions", []))
#         rung["instructions"] = [
#             inst for inst in rung.get("instructions", [])
#             if inst.get("type", "").lower() not in invalid_types
#         ]
#         after = len(rung["instructions"])
#         if before != after:
#             logger.warning(
#                 f"[remove_invalid] Removed {before - after} invalid instruction(s) from {rung.get('rung_id', '?')}"
#             )

#     return plc


# # ---------------- FIX TIMER ----------------
# def fix_timer(plc):
#     """
#     Standardize timer blocks and append a done-contact for simulation use.
#     """
#     for rung in plc.get("rungs", []):
#         new_list = []

#         for inst in rung.get("instructions", []):
#             if inst.get("type") == "timer":
#                 tag = inst.get("tag", "T1")
#                 inst["preset"] = inst.get("preset", 5000)
#                 inst["acc"] = inst.get("acc", 0)
#                 inst["done"] = inst.get("done", False)
#                 new_list.append(inst)

#                 # Append done-bit contact for downstream simulation usage
#                 new_list.append({
#                     "type": "contact",
#                     "mode": "NO",
#                     "tag": f"{tag}_done"
#                 })
#             else:
#                 new_list.append(inst)

#         rung["instructions"] = new_list

#     return plc


# # ---------------- FIX ORDER ----------------
# def fix_order(plc):
#     """
#     Reorder instructions for proper ladder rendering:
#     contacts → compares → timers → counters → others → output (coil/set/reset)
#     """
#     for rung in plc.get("rungs", []):
#         contacts  = []
#         compares  = []
#         timers    = []
#         counters  = []
#         others    = []
#         output    = None

#         for inst in rung.get("instructions", []):
#             t = inst.get("type")

#             if t in ["coil", "set", "reset"]:
#                 output = inst          # keep only last output if duplicated
#             elif t == "contact":
#                 contacts.append(inst)
#             elif t == "compare":
#                 compares.append(inst)
#             elif t == "timer":
#                 timers.append(inst)
#             elif t == "counter":
#                 counters.append(inst)
#             else:
#                 others.append(inst)

#         rung["instructions"] = (
#             contacts +
#             compares +
#             timers +
#             counters +
#             others +
#             ([output] if output else [])
#         )

#     return plc


# # ---------------- REMOVE DUPLICATE RUNGS ----------------
# def remove_duplicate_rungs(plc):
#     """
#     Remove rungs whose (type, tag) fingerprint has already been seen.
#     """
#     seen   = set()
#     unique = []

#     for rung in plc.get("rungs", []):
#         key = tuple(
#             (inst.get("type"), inst.get("tag"))
#             for inst in rung.get("instructions", [])
#         )

#         if key not in seen:
#             seen.add(key)
#             unique.append(rung)
#         else:
#             logger.warning(
#                 f"[remove_duplicate_rungs] Duplicate rung removed: {rung.get('rung_id', '?')}"
#             )

#     plc["rungs"] = unique
#     return plc


# # ---------------- NORMALIZE ----------------
# def normalize_plc(plc):
#     """
#     Assign sequential rung_id and instruction ids AFTER all cleanup passes.
#     Must always be called last in the pipeline.
#     """
#     for r_index, rung in enumerate(plc.get("rungs", []), start=1):
#         rung["rung_id"] = f"r{r_index}"

#         for i_index, inst in enumerate(rung.get("instructions", []), start=1):
#             inst["id"] = f"r{r_index}_i{i_index}"

#     return plc





# app/services/plc_parser.py
import logging

logger = logging.getLogger(__name__)

# Tags that indicate the AI used a generic/fallback name instead of a real one
GENERIC_TAGS = {"input", "output", "value", "tag", "contact", "coil", ""}


# ---------------- FIX AI FORMAT ----------------
def fix_ai_format(plc):
    """
    Convert raw AI-generated PLC JSON into standardized structure.
    - Normalizes set/reset/latch/unlatch → coil OTL / coil OTU
    - Preserves coil mode (OTE / OTL / OTU)
    - Validates compare values are numeric
    - Logs warnings for generic/missing tags
    """
    for rung in plc.get("rungs", []):
        cleaned = []

        for inst in rung.get("instructions", []):
            t = inst.get("type", "").lower()

            # ── CONTACT ──────────────────────────────────────────────────────
            if t == "contact":
                tag = inst.get("contact_id") or inst.get("tag", "")
                if not tag or tag in GENERIC_TAGS:
                    logger.warning(f"[fix_ai_format] Generic/missing tag in contact: {inst}")
                cleaned.append({
                    "type": "contact",
                    "mode": inst.get("mode", "NO"),
                    "tag":  tag or "input"
                })

            # ── COIL (OTE / OTL / OTU) ───────────────────────────────────────
            elif t == "coil":
                tag  = inst.get("coil_id") or inst.get("tag", "")
                mode = inst.get("mode", "OTE")
                if not tag or tag in GENERIC_TAGS:
                    logger.warning(f"[fix_ai_format] Generic/missing tag in coil: {inst}")
                cleaned.append({
                    "type": "coil",
                    "mode": mode,
                    "tag":  tag or "output"
                })

            # ── SET → coil OTL (latch) ────────────────────────────────────────
            elif t == "set":
                tag = inst.get("tag", "")
                if not tag or tag in GENERIC_TAGS:
                    logger.warning(f"[fix_ai_format] Generic/missing tag in set: {inst}")
                cleaned.append({
                    "type": "coil",
                    "mode": "OTL",
                    "tag":  tag or "output"
                })

            # ── RESET → coil OTU (unlatch) ────────────────────────────────────
            elif t == "reset":
                tag = inst.get("tag", "")
                if not tag or tag in GENERIC_TAGS:
                    logger.warning(f"[fix_ai_format] Generic/missing tag in reset: {inst}")
                cleaned.append({
                    "type": "coil",
                    "mode": "OTU",
                    "tag":  tag or "output"
                })

            # ── LATCH (explicit keyword) → coil OTL ───────────────────────────
            elif t == "latch":
                tag = inst.get("tag", "")
                if not tag or tag in GENERIC_TAGS:
                    logger.warning(f"[fix_ai_format] Generic/missing tag in latch: {inst}")
                cleaned.append({
                    "type": "coil",
                    "mode": "OTL",
                    "tag":  tag or "output"
                })

            # ── UNLATCH (explicit keyword) → coil OTU ─────────────────────────
            elif t == "unlatch":
                tag = inst.get("tag", "")
                if not tag or tag in GENERIC_TAGS:
                    logger.warning(f"[fix_ai_format] Generic/missing tag in unlatch: {inst}")
                cleaned.append({
                    "type": "coil",
                    "mode": "OTU",
                    "tag":  tag or "output"
                })

            # ── COMPARE ───────────────────────────────────────────────────────
            elif t == "compare":
                tag = inst.get("compare_id") or inst.get("tag", "")
                if not tag or tag in GENERIC_TAGS:
                    logger.warning(f"[fix_ai_format] Generic/missing tag in compare: {inst}")

                raw_value = inst.get("value", 0)
                try:
                    numeric_value = float(raw_value)
                    if numeric_value == int(numeric_value):
                        numeric_value = int(numeric_value)
                except (ValueError, TypeError):
                    logger.warning(
                        f"[fix_ai_format] Non-numeric compare value '{raw_value}' "
                        f"in: {inst} — defaulting to 0"
                    )
                    numeric_value = 0

                cleaned.append({
                    "type":     "compare",
                    "operator": inst.get("operator", "EQU"),
                    "tag":      tag or "value",
                    "value":    numeric_value
                })

            # ── TIMER ─────────────────────────────────────────────────────────
            elif t == "timer":
                cleaned.append({
                    "type":    "timer",
                    "subtype": inst.get("subtype", "TON"),
                    "tag":     inst.get("tag", "T1"),
                    "preset":  inst.get("preset", 5000),
                    "acc":     inst.get("acc", 0),
                    "done":    inst.get("done", False)
                })

            # ── COUNTER ───────────────────────────────────────────────────────
            elif t == "counter":
                cleaned.append({
                    "type":    "counter",
                    "subtype": inst.get("subtype", "CTU"),
                    "tag":     inst.get("tag", "C1"),
                    "preset":  inst.get("preset", 0),
                    "acc":     inst.get("acc", 0)
                })

            # ── MOVE ──────────────────────────────────────────────────────────
            elif t == "move":
                cleaned.append({
                    "type":        "move",
                    "source":      inst.get("source", ""),
                    "destination": inst.get("destination", "")
                })

            # ── MATH ──────────────────────────────────────────────────────────
            elif t in ["add", "sub", "mul", "div"]:
                cleaned.append({
                    "type":        t,
                    "source_a":    inst.get("source_a", 0),
                    "source_b":    inst.get("source_b", 0),
                    "destination": inst.get("destination", "result")
                })

            # ── LOGIC GATE AUTO-EXPANSION (AND / OR / XOR / NOT) ──────────────
            elif t in ["and", "gate_and"]:
                cleaned.append({ "type": "contact", "mode": "NO", "tag": inst.get("tag_a") or "input_a" })
                cleaned.append({ "type": "contact", "mode": "NO", "tag": inst.get("tag_b") or "input_b" })
                cleaned.append({ "type": "coil", "mode": "OTE", "tag": inst.get("tag_out") or "and_output" })

            elif t in ["or", "gate_or"]:
                cleaned.append({ "type": "contact", "mode": "NO", "tag": inst.get("tag_a") or "input_a" })
                cleaned.append({ "type": "coil", "mode": "OTE", "tag": inst.get("tag_out") or "or_output" })

            elif t in ["xor", "gate_xor"]:
                cleaned.append({ "type": "contact", "mode": "NO", "tag": inst.get("tag_a") or "input_a" })
                cleaned.append({ "type": "contact", "mode": "NC", "tag": inst.get("tag_b") or "input_b" })
                cleaned.append({ "type": "coil", "mode": "OTE", "tag": inst.get("tag_out") or "xor_output" })

            elif t in ["not", "gate_not"]:
                cleaned.append({ "type": "contact", "mode": "NC", "tag": inst.get("tag_a") or "input_a" })
                cleaned.append({ "type": "coil", "mode": "OTE", "tag": inst.get("tag_out") or "not_output" })

            # ── KEEP OTHER VALID BLOCKS AS-IS ─────────────────────────────────
            else:
                cleaned.append(inst)

        rung["instructions"] = cleaned

    return plc


# ---------------- REMOVE INVALID ----------------
def remove_invalid(plc):
    """
    Remove empty-type instructions.
    """
    invalid_types = {""}

    for rung in plc.get("rungs", []):
        rung["instructions"] = [
            inst for inst in rung.get("instructions", [])
            if inst.get("type", "").strip().lower() not in invalid_types
        ]

    return plc


# ---------------- FIX LATCH / UNLATCH PAIRS ----------------
def fix_latch_pairs(plc):
    latched_tags   = set()
    unlatched_tags = set()

    for rung in plc.get("rungs", []):
        for inst in rung.get("instructions", []):
            if inst.get("type") == "coil":
                mode = inst.get("mode", "")
                tag  = inst.get("tag", "")
                if mode == "OTL":
                    latched_tags.add(tag)
                elif mode == "OTU":
                    unlatched_tags.add(tag)

    return plc


# ---------------- FIX TIMER ----------------
def fix_timer(plc):
    rungs = plc.get("rungs", [])

    # Collect all timer block tags
    timer_tags = set()
    for rung in rungs:
        for inst in rung.get("instructions", []):
            if inst.get("type") == "timer":
                timer_tags.add(inst.get("tag", ""))

    for rung in rungs:
        new_list = []

        for inst in rung.get("instructions", []):
            if inst.get("type") == "timer":
                tag            = inst.get("tag", "T1")
                inst["preset"] = inst.get("preset", 5000)
                inst["acc"]    = inst.get("acc", 0)
                inst["done"]   = inst.get("done", False)
                new_list.append(inst)
            else:
                # Standardize contacts referencing a raw timer tag to use _done suffix
                if (
                    inst.get("type") == "contact" and
                    inst.get("tag") in timer_tags
                ):
                    inst["tag"] = f"{inst['tag']}_done"
                    new_list.append(inst)
                else:
                    new_list.append(inst)

        rung["instructions"] = new_list

    return plc

# ---------------- FIX ORDER ----------------
def fix_order(plc):
    """
    Reorder instructions for correct ladder rendering:
    contacts → compares → timers → counters → math/move → coil output
    """
    for rung in plc.get("rungs", []):
        contacts = []
        compares = []
        timers   = []
        counters = []
        others   = []
        output   = None

        for inst in rung.get("instructions", []):
            t = inst.get("type")

            if t == "coil":
                output = inst
            elif t == "contact":
                contacts.append(inst)
            elif t == "compare":
                compares.append(inst)
            elif t == "timer":
                timers.append(inst)
            elif t == "counter":
                counters.append(inst)
            else:
                others.append(inst)

        rung["instructions"] = (
            contacts +
            compares +
            timers +
            counters +
            others +
            ([output] if output else [])
        )

    return plc


# ---------------- REMOVE DUPLICATE RUNGS ----------------
def remove_duplicate_rungs(plc):
    """
    Remove rungs whose complete instruction fingerprints (type, mode, tag, subtype, operator, value) match.
    """
    seen   = set()
    unique = []

    for rung in plc.get("rungs", []):
        key = tuple(
            (
                inst.get("type"),
                inst.get("mode", ""),
                inst.get("tag", ""),
                inst.get("subtype", ""),
                inst.get("operator", ""),
                inst.get("value", "")
            )
            for inst in rung.get("instructions", [])
        )

        if key not in seen and len(rung.get("instructions", [])) > 0:
            seen.add(key)
            unique.append(rung)
        else:
            logger.warning(
                f"[remove_duplicate_rungs] Duplicate rung removed: "
                f"{rung.get('rung_id', '?')}"
            )

    plc["rungs"] = unique
    return plc


# ---------------- NORMALIZE ----------------
def normalize_plc(plc):
    """
    Assign sequential rung_id and instruction ids AFTER all cleanup passes.
    Must always be called last in the pipeline.
    """
    for r_index, rung in enumerate(plc.get("rungs", []), start=1):
        rung["rung_id"] = f"r{r_index}"

        for i_index, inst in enumerate(rung.get("instructions", []), start=1):
            inst["id"] = f"r{r_index}_i{i_index}"

    return plc


# ---------------- LOGIC GATES PRESET RESOLVER ----------------
def get_logic_gate_preset(prompt: str):
    """
    Check if the user prompt is requesting a standalone basic Logic Gate
    (AND, OR, XOR, NAND, NOR, NOT, XNOR, BUFFER).
    Returns a static preset ONLY if the prompt is strictly asking for a standard logic gate.
    All other prompts are passed to the Groq AI generator.
    """
    import re
    p = (prompt or "").lower().strip()

    # Exact standalone gate patterns only
    # E.g. "and", "and gate", "xor", "xor gate", "exclusive-or", "not gate", "inverter"
    if p in ["xnor", "xnor gate", "exclusive-nor", "ex-nor"] or p == "xnor logic":
        return {
            "network_id": 1,
            "rungs": [
                {
                    "rung_id": "r1",
                    "instructions": [
                        { "id": "r1_i1", "type": "contact", "mode": "NO", "tag": "A" },
                        { "id": "r1_i2", "type": "contact", "mode": "NO", "tag": "B" },
                        { "id": "r1_i3", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                },
                {
                    "rung_id": "r2",
                    "instructions": [
                        { "id": "r2_i1", "type": "contact", "mode": "NC", "tag": "A" },
                        { "id": "r2_i2", "type": "contact", "mode": "NC", "tag": "B" },
                        { "id": "r2_i3", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                }
            ]
        }

    if p in ["xor", "xor gate", "exclusive-or", "ex-or"] or p == "xor logic":
        return {
            "network_id": 1,
            "rungs": [
                {
                    "rung_id": "r1",
                    "instructions": [
                        { "id": "r1_i1", "type": "contact", "mode": "NC", "tag": "A" },
                        { "id": "r1_i2", "type": "contact", "mode": "NO", "tag": "B" },
                        { "id": "r1_i3", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                },
                {
                    "rung_id": "r2",
                    "instructions": [
                        { "id": "r2_i1", "type": "contact", "mode": "NO", "tag": "A" },
                        { "id": "r2_i2", "type": "contact", "mode": "NC", "tag": "B" },
                        { "id": "r2_i3", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                }
            ]
        }

    if p in ["nand", "nand gate"] or p == "nand logic":
        return {
            "network_id": 1,
            "rungs": [
                {
                    "rung_id": "r1",
                    "instructions": [
                        { "id": "r1_i1", "type": "contact", "mode": "NC", "tag": "A" },
                        { "id": "r1_i2", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                },
                {
                    "rung_id": "r2",
                    "instructions": [
                        { "id": "r2_i1", "type": "contact", "mode": "NC", "tag": "B" },
                        { "id": "r2_i2", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                }
            ]
        }

    if p in ["nor", "nor gate"] or p == "nor logic":
        return {
            "network_id": 1,
            "rungs": [
                {
                    "rung_id": "r1",
                    "instructions": [
                        { "id": "r1_i1", "type": "contact", "mode": "NC", "tag": "A" },
                        { "id": "r1_i2", "type": "contact", "mode": "NC", "tag": "B" },
                        { "id": "r1_i3", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                }
            ]
        }

    if p in ["not", "not gate", "inverter"] or p == "not logic":
        return {
            "network_id": 1,
            "rungs": [
                {
                    "rung_id": "r1",
                    "instructions": [
                        { "id": "r1_i1", "type": "contact", "mode": "NC", "tag": "A" },
                        { "id": "r1_i2", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                }
            ]
        }

    if p in ["and", "and gate"] or p == "and logic":
        return {
            "network_id": 1,
            "rungs": [
                {
                    "rung_id": "r1",
                    "instructions": [
                        { "id": "r1_i1", "type": "contact", "mode": "NO", "tag": "A" },
                        { "id": "r1_i2", "type": "contact", "mode": "NO", "tag": "B" },
                        { "id": "r1_i3", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                }
            ]
        }

    if p in ["or", "or gate"] or p == "or logic":
        return {
            "network_id": 1,
            "rungs": [
                {
                    "rung_id": "r1",
                    "instructions": [
                        { "id": "r1_i1", "type": "contact", "mode": "NO", "tag": "A" },
                        { "id": "r1_i2", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                },
                {
                    "rung_id": "r2",
                    "instructions": [
                        { "id": "r2_i1", "type": "contact", "mode": "NO", "tag": "B" },
                        { "id": "r2_i2", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                }
            ]
        }

    if p in ["buffer", "buffer gate", "yes gate"]:
        return {
            "network_id": 1,
            "rungs": [
                {
                    "rung_id": "r1",
                    "instructions": [
                        { "id": "r1_i1", "type": "contact", "mode": "NO", "tag": "A" },
                        { "id": "r1_i2", "type": "coil", "mode": "OTE", "tag": "C" }
                    ]
                }
            ]
        }

    return None