# # app/routers/generate.py
# from fastapi import APIRouter
# from app.schemas.prompt_schema import PromptRequest
# from app.services.ai_generator import generate_plc_json
# from app.services.plc_parser import (
#     fix_ai_format,
#     normalize_plc,
#     remove_invalid,
#     fix_timer,
#     fix_order,
#     remove_duplicate_rungs
# )
# from app.config.database import projects_collection

# router = APIRouter()

# # Tags that indicate the AI produced a generic/fallback name
# GENERIC_TAGS = {"input", "output", "value", "tag", "contact", "coil", ""}


# def validate_plc(plc_json: dict) -> list[str]:
#     """
#     Inspect cleaned PLC JSON for known quality issues.
#     Returns a list of human-readable warning strings (empty = all good).
#     These warnings are returned to the caller but do NOT block saving.
#     """
#     warnings = []

#     for rung in plc_json.get("rungs", []):
#         rung_id = rung.get("rung_id", "?")
#         instructions = rung.get("instructions", [])

#         # Warn if rung has no instructions at all
#         if not instructions:
#             warnings.append(f"[{rung_id}] Rung is empty")
#             continue

#         # Warn if rung has no output instruction
#         output_types = {"coil", "set", "reset", "move", "add", "sub", "mul", "div"}
#         has_output = any(inst.get("type") in output_types for inst in instructions)
#         if not has_output:
#             warnings.append(f"[{rung_id}] Rung has no output instruction (coil/set/reset/move/math)")

#         for inst in instructions:
#             inst_type = inst.get("type", "")
#             tag = inst.get("tag", "")

#             # Warn on generic tags
#             if tag in GENERIC_TAGS and inst_type not in ["move", "add", "sub", "mul", "div"]:
#                 warnings.append(
#                     f"[{rung_id}] Generic tag '{tag}' detected in '{inst_type}' instruction"
#                 )

#             # Warn if compare value is not numeric
#             if inst_type == "compare":
#                 val = inst.get("value")
#                 if not isinstance(val, (int, float)):
#                     warnings.append(
#                         f"[{rung_id}] Non-numeric compare value '{val}' in compare instruction"
#                     )

#                 # Warn if operator looks wrong (value stored where operator should be)
#                 operator = inst.get("operator", "")
#                 valid_operators = {"GRT", "LES", "EQU", "NEQ", "GEQ", "LEQ"}
#                 if operator not in valid_operators:
#                     warnings.append(
#                         f"[{rung_id}] Unrecognised compare operator '{operator}'"
#                     )

#             # Warn if coil has no mode
#             if inst_type == "coil" and not inst.get("mode"):
#                 warnings.append(
#                     f"[{rung_id}] Coil instruction missing 'mode' (OTE/OTU/OTL)"
#                 )

#     return warnings


# @router.post("/generate")
# def generate_logic(data: PromptRequest):

#     # STEP 1: Generate raw PLC JSON from AI
#     plc_json = generate_plc_json(data.prompt)

#     # STEP 2: CLEAN PIPELINE (order matters)
#     plc_json = fix_ai_format(plc_json)          # standardize instruction shapes
#     plc_json = remove_invalid(plc_json)          # drop AND/OR/empty-type instructions
#     plc_json = fix_timer(plc_json)               # normalize timers + append done-contacts
#     plc_json = fix_order(plc_json)               # sort: contacts → compares → output
#     plc_json = remove_duplicate_rungs(plc_json)  # deduplicate identical rungs

#     # ALWAYS KEEP NORMALIZE LAST
#     plc_json = normalize_plc(plc_json)           # assign rung_id / instruction ids

#     # STEP 3: Validate output quality
#     warnings = validate_plc(plc_json)

#     # STEP 4: Save to MongoDB
#     result = projects_collection.insert_one({
#         "user_id": data.user_id,
#         "project_name": data.project_name,
#         "prompt": data.prompt,
#         "plc_logic": plc_json,
#         "warnings": warnings                     # store warnings alongside logic
#     })

#     # STEP 5: Return response
#     return {
#         "project_id": str(result.inserted_id),
#         "plc_logic": plc_json,
#         "warnings": warnings                     # surface issues to the API caller
#     }

# app/routers/generate.py
from fastapi import APIRouter
from app.schemas.prompt_schema import PromptRequest
from app.services.ai_generator import generate_plc_json
from app.services.plc_parser import (
    fix_ai_format,
    normalize_plc,
    remove_invalid,
    fix_latch_pairs,
    fix_timer,
    fix_order,
    remove_duplicate_rungs
)
from app.config.database import projects_collection

router = APIRouter()

# Tags that indicate the AI produced a generic/fallback name
GENERIC_TAGS = {"input", "output", "value", "tag", "contact", "coil", ""}

# Valid compare operators
VALID_OPERATORS = {"GRT", "LES", "EQU", "NEQ", "GEQ", "LEQ"}

# Instruction types that count as a valid rung output
OUTPUT_TYPES = {
    "coil",                          # OTE / OTL / OTU
    "move",                          # register copy
    "add", "sub", "mul", "div",      # math
    "timer",                         # TON / TOF / TP
    "counter"                        # CTU / CTD
}


# ---------------- VALIDATE PLC ----------------
def validate_plc(plc_json: dict) -> list[str]:
    """
    Inspect cleaned PLC JSON for known quality issues.

    Checks:
    1.  Empty rungs
    2.  Rungs with no valid output instruction
    3.  Generic / missing tags on contacts, coils, compares
    4.  Non-numeric compare values
    5.  Invalid compare operators
    6.  Coil missing mode field
    7.  OTL coil with no matching OTU in the whole program  (latch without unlatch)
    8.  OTU coil with no matching OTL in the whole program  (unlatch without latch)

    Returns a list of human-readable warning strings.
    Empty list means all checks passed.
    Warnings are returned to the caller but do NOT block saving.

    Latch / Unlatch rules:
    ┌──────────────────────────────────────────────────────────────┐
    │  OTL (Output Latch)   — sets bit ON,  holds until OTU clears │
    │  OTU (Output Unlatch) — sets bit OFF, holds until OTL sets   │
    │                                                              │
    │  Every OTL tag must have a matching OTU tag and vice-versa.  │
    │  A latch without an unlatch means the output can never be    │
    │  turned off. An unlatch without a latch is usually a bug.    │
    └──────────────────────────────────────────────────────────────┘
    """
    warnings = []

    # Collect all OTL / OTU tags across the whole program for pair checking
    latched_tags   = set()
    unlatched_tags = set()

    for rung in plc_json.get("rungs", []):
        rung_id      = rung.get("rung_id", "?")
        instructions = rung.get("instructions", [])

        # 1. Empty rung
        if not instructions:
            warnings.append(f"[{rung_id}] Rung is empty")
            continue

        # 2. No valid output
        has_output = any(inst.get("type") in OUTPUT_TYPES for inst in instructions)
        if not has_output:
            warnings.append(
                f"[{rung_id}] Rung has no output instruction "
                f"(coil / move / math / timer / counter)"
            )

        for inst in instructions:
            inst_type = inst.get("type", "")
            tag       = inst.get("tag", "")

            # 3. Generic tags on contacts / coils / compares
            if inst_type in ("contact", "coil", "compare"):
                if tag in GENERIC_TAGS:
                    warnings.append(
                        f"[{rung_id}] Generic tag '{tag}' in '{inst_type}' instruction"
                    )

            # 4 & 5. Compare value and operator checks
            if inst_type == "compare":
                val = inst.get("value")
                if not isinstance(val, (int, float)):
                    warnings.append(
                        f"[{rung_id}] Non-numeric compare value '{val}'"
                    )

                operator = inst.get("operator", "")
                if operator not in VALID_OPERATORS:
                    warnings.append(
                        f"[{rung_id}] Unrecognised compare operator '{operator}' "
                        f"(valid: {', '.join(sorted(VALID_OPERATORS))})"
                    )

            # 6. Coil missing mode
            if inst_type == "coil":
                mode = inst.get("mode", "")
                if not mode:
                    warnings.append(
                        f"[{rung_id}] Coil tag '{tag}' missing 'mode' (OTE / OTL / OTU)"
                    )
                elif mode == "OTL":
                    latched_tags.add(tag)
                elif mode == "OTU":
                    unlatched_tags.add(tag)

    # 7. OTL without matching OTU
    for tag in latched_tags - unlatched_tags:
        warnings.append(
            f"[latch-check] '{tag}' is latched (OTL) but never unlatched (OTU) — "
            f"output can never be turned off"
        )

    # 8. OTU without matching OTL
    for tag in unlatched_tags - latched_tags:
        warnings.append(
            f"[latch-check] '{tag}' is unlatched (OTU) but never latched (OTL) — "
            f"verify this is intentional"
        )

    return warnings


# ---------------- ROUTE ----------------
@router.post("/generate")
def generate_logic(data: PromptRequest):

    # STEP 1: Generate raw PLC JSON from AI
    plc_json = generate_plc_json(data.prompt)

    if not plc_json:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="AI generation failed. Please check GROQ_API_KEY and Try again later.")

    # STEP 2: CLEAN PIPELINE (order matters)
    plc_json = fix_ai_format(plc_json)          # standardize shapes, normalize latch/unlatch/set/reset
    plc_json = remove_invalid(plc_json)          # drop AND / OR / empty-type instructions
    plc_json = fix_latch_pairs(plc_json)         # log unmatched OTL / OTU pairs
    plc_json = fix_timer(plc_json)               # normalize timers + inject done-contact into next rung
    plc_json = fix_order(plc_json)               # sort: contacts → compares → timers → counters → output
    plc_json = remove_duplicate_rungs(plc_json)  # deduplicate identical rungs

    # ALWAYS KEEP NORMALIZE LAST
    plc_json = normalize_plc(plc_json)           # assign rung_id / instruction ids

    # STEP 3: Validate output quality
    warnings = validate_plc(plc_json)

    # STEP 4: Save to MongoDB
    result = projects_collection.insert_one({
        "user_id":      data.user_id,
        "project_name": data.project_name,
        "prompt":       data.prompt,
        "plc_logic":    plc_json,
        "warnings":     warnings
    })

    # STEP 5: Return response
    return {
        "project_id": str(result.inserted_id),
        "plc_logic":  plc_json,
        "warnings":   warnings
    }