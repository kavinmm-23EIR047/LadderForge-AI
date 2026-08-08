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

1. TAG NAMING RULES (CRITICAL):
   • Keep tag names short, clear, and professional (e.g. "input_a", "input_b", "start_pb", "stop_pb", "red_light", "T_red", "T_red_done", "output_y").
   • NEVER concatenate long descriptive strings (e.g. NEVER use "red_light_yellow_duration_done").
   • Every instruction MUST have a valid "type": "contact", "coil", "timer", "counter", "compare", "move", or "math".
   • NEVER use "type": "and" or "type": "or" directly — express logic gates using contacts (NO/NC) and coils (OTE).

2. CONTACT  – reads a BOOL tag
   NO (Normally Open)  – passes power when tag = TRUE
   NC (Normally Closed) – passes power when tag = FALSE (use for stops, E-stops, interlocks, or NOT logic)
   { "id": "i1", "type": "contact", "mode": "NO", "tag": "input_a" }
   { "id": "i2", "type": "contact", "mode": "NC", "tag": "input_b" }

3. COIL  – writes a BOOL output
   OTE  – energise output (output = rung power state)
   OTL  – latch (set TRUE until OTU)
   OTU  – unlatch (set FALSE)
   { "id": "i3", "type": "coil", "mode": "OTE", "tag": "output_y" }

4. TIMER  – time delay block (preset in ms: 1000 = 1s, 3000 = 3s, 10000 = 10s)
   { "id": "i4", "type": "timer", "subtype": "TON", "tag": "T_red", "preset": 10000 }

5. COUNTER / COMPARE / MOVE / MATH
   { "id": "i5", "type": "compare", "operator": "GRT", "tag": "temp_val", "value": 75 }

══════════════════════════════════════════════════════════════════════
LOGIC GATE DESIGN EXAMPLES (TEXTBOOK ACCURACY)
══════════════════════════════════════════════════════════════════════

• 1. AND Gate:
  Rung 1: Contact (mode: "NO", tag: "A"), Contact (mode: "NO", tag: "B"), Coil (mode: "OTE", tag: "C")

• 2. OR Gate:
  Rung 1: Contact (mode: "NO", tag: "A"), Coil (mode: "OTE", tag: "C")
  Rung 2: Contact (mode: "NO", tag: "B"), Coil (mode: "OTE", tag: "C")

• 3. XOR Gate (Exclusive-OR):
  Rung 1: Contact (mode: "NC", tag: "A"), Contact (mode: "NO", tag: "B"), Coil (mode: "OTE", tag: "C")
  Rung 2: Contact (mode: "NO", tag: "A"), Contact (mode: "NC", tag: "B"), Coil (mode: "OTE", tag: "C")

• 4. NAND Gate:
  Rung 1: Contact (mode: "NC", tag: "A"), Coil (mode: "OTE", tag: "C")
  Rung 2: Contact (mode: "NC", tag: "B"), Coil (mode: "OTE", tag: "C")

• 5. NOR Gate:
  Rung 1: Contact (mode: "NC", tag: "A"), Contact (mode: "NC", tag: "B"), Coil (mode: "OTE", tag: "C")

• 6. NOT Gate (Inverter):
  Rung 1: Contact (mode: "NC", tag: "A"), Coil (mode: "OTE", tag: "C")

• 7. XNOR Gate (Exclusive-NOR):
  Rung 1: Contact (mode: "NO", tag: "A"), Contact (mode: "NO", tag: "B"), Coil (mode: "OTE", tag: "C")
  Rung 2: Contact (mode: "NC", tag: "A"), Contact (mode: "NC", tag: "B"), Coil (mode: "OTE", tag: "C")

• 8. BUFFER Gate:
  Rung 1: Contact (mode: "NO", tag: "A"), Coil (mode: "OTE", tag: "C")

• Traffic Light System (Red 10s -> Yellow 3s -> Green 10s):
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