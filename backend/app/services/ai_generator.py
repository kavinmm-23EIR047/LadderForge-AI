# app/services/ai_generator.py
import os
import json
import re
import uuid
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ─────────────────────────────────────────────────────────────────────────────
#  SYSTEM PROMPT  –  Expert PLC ladder logic generator with strict time rules
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """
You are an expert industrial PLC (Programmable Logic Controller) ladder logic engineer.
Your ONLY job is to output valid JSON for a clean, correct, industrial-grade ladder logic program.
NEVER output explanations, markdown code fences, or any text outside the JSON.

══════════════════════════════════════════════════════════════════════
INSTRUCTION REFERENCE & TAG NAMING RULES
══════════════════════════════════════════════════════════════════════

1. TAG NAMING & PRESERVATION RULES (CRITICAL):
   • Use the EXACT tag names and I/O addresses provided in the prompt (e.g. "S1", "S2", "M1", "M2", "I0.0", "I0.1", "Q0.0", "Q0.1", "start_pb", "stop_pb").
   • When 2 switches (S1, S2) and 2 motors (M1, M2) are mentioned:
     - ALWAYS name the inputs "S1" (or "S1 (I0.0)") and "S2" (or "S2 (I0.1)").
     - ALWAYS name the outputs "M1" (or "M1 (Q0.0)") and "M2" (or "M2 (Q0.1)").
     - NEVER map 2 switches and 2 motors to generic tags like "A", "B", "C" or a single coil!

2. MULTI-MOTOR & INTERLOCKING RULES (CRITICAL):
   • If a prompt mentions 2 motors (M1, M2), you MUST generate at least 2 separate rungs:
     - Rung 1 for Motor 1 (M1 / Q0.0)
     - Rung 2 for Motor 2 (M2 / Q0.1)
   • For interlocked 2-motor systems (M1 and M2 cannot run together):
     - Rung 1 (Motor 1): Contact NO "S1", Contact NC "M2" (or NC "S2" for priority), Coil OTE "M1"
     - Rung 2 (Motor 2): Contact NO "S2", Contact NC "S1", Contact NC "M1", Coil OTE "M2"

3. CONTACT  – reads a BOOL tag
   NO (Normally Open)  – passes power when tag = TRUE
   NC (Normally Closed) – passes power when tag = FALSE (use for stops, E-stops, interlocks, NC contacts for priority, or NOT logic)
   { "id": "i1", "type": "contact", "mode": "NO", "tag": "S1" }
   { "id": "i2", "type": "contact", "mode": "NC", "tag": "M2" }

4. COIL  – writes a BOOL output
   OTE  – energise output (output = rung power state)
   OTL  – latch (set TRUE until OTU)
   OTU  – unlatch (set FALSE)
   { "id": "i3", "type": "coil", "mode": "OTE", "tag": "M1" }

5. TIMER / COUNTER / COMPARE / MOVE / MATH
   { "id": "i4", "type": "timer", "subtype": "TON", "tag": "T_red", "preset": 10000 }
   { "id": "i5", "type": "compare", "operator": "GRT", "tag": "temp_val", "value": 75 }

══════════════════════════════════════════════════════════════════════
LOGIC GATE & CONTROL SYSTEM DESIGN EXAMPLES
══════════════════════════════════════════════════════════════════════

• 1. Two Switches & Two Motors (Interlocked Control System):
  Rung 1: Contact (NO, "S1"), Contact (NC, "M2"), Coil (OTE, "M1")
  Rung 2: Contact (NO, "S2"), Contact (NC, "S1"), Contact (NC, "M1"), Coil (OTE, "M2")

• 2. AND Gate (Explicit logic gate prompt only):
  Rung 1: Contact (mode: "NO", tag: "A"), Contact (mode: "NO", tag: "B"), Coil (mode: "OTE", tag: "C")

• 3. XOR Gate (Exclusive-OR):
  Rung 1: Contact (mode: "NC", tag: "A"), Contact (mode: "NO", tag: "B"), Coil (mode: "OTE", tag: "C")
  Rung 2: Contact (mode: "NO", tag: "A"), Contact (mode: "NC", tag: "B"), Coil (mode: "OTE", tag: "C")

• 4. Traffic Light System (Red 10s -> Yellow 3s -> Green 10s):
  Rung 1: Contact (NO, "start_pb"), Contact (NC, "T_green_done"), Coil (OTE, "red_light"), Timer (TON, "T_red", 10000)
  Rung 2: Contact (NO, "T_red_done"), Contact (NC, "T_yellow_done"), Coil (OTE, "yellow_light"), Timer (TON, "T_yellow", 3000)
  Rung 3: Contact (NO, "T_yellow_done"), Contact (NC, "T_green_done"), Coil (OTE, "green_light"), Timer (TON, "T_green", 10000)

══════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY)
══════════════════════════════════════════════════════════════════════
{
  "network_id": 1,
  "rungs": [
    {
      "rung_id": "r1",
      "instructions": [ ... ]
    }
  ]
}
"""

def normalize_plc(data):
    """
    POST-PROCESSING VALIDATION LAYER
    Ensures unique IDs and forces ms-time consistency.
    """
    id_counter = 1
    used_ids = set()

    for rung in data.get("rungs", []):
        for inst in rung.get("instructions", []):

            # ✅ Ensure ID exists and is unique
            if "id" not in inst or inst["id"] in used_ids:
                inst["id"] = f"i{id_counter}"
            used_ids.add(inst["id"])
            id_counter += 1

            # ✅ Fix TIMER preset (Direct millisecond enforcement)
            if inst.get("type") == "timer":
                try:
                    p_val = inst.get("preset", 1000)
                    # Handle cases where AI mistakenly output a string or float
                    inst["preset"] = int(float(p_val))
                except:
                    inst["preset"] = 1000

                # 🔥 Seconds Correction: If AI gives 1..60, it probably forgot ms rule
                if 1 <= inst["preset"] <= 60:
                    inst["preset"] *= 1000

            # ✅ Fix numeric compare values
            if inst.get("type") == "compare":
                try:
                    inst["value"] = float(inst["value"])
                except:
                    inst["value"] = 0

    return data

def generate_plc_json(prompt):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ CRITICAL: GROQ_API_KEY is missing from environment")
        return None

    try:
        # Re-initializing client to ensure it uses the fresh key if dynamic
        client = Groq(api_key=api_key)
        
        completion = client.chat.completions.create(
            # Using llama-3.3-70b-versatile as it's the current stable high-end model
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        content = completion.choices[0].message.content
        if not content:
            return None

        data = json.loads(content)
        return normalize_plc(data)

    except Exception as e:
        print(f"❌ Gen Error: {str(e)}")
        return None