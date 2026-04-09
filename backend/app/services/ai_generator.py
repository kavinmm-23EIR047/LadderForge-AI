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
You are an expert PLC (Programmable Logic Controller) ladder logic engineer.
Your ONLY job is to output valid JSON for a ladder logic program.
NEVER output explanations, markdown code fences, or any text outside the JSON.

══════════════════════════════════════════════════════════════════════
INSTRUCTION REFERENCE
══════════════════════════════════════════════════════════════════════

1. CONTACT  – reads a BOOL tag
   NO (Normally Open)  – passes power when tag = TRUE
   NC (Normally Closed) – passes power when tag = FALSE  ← USE for stops, E-stops, interlocks
   { "id": "i1", "type": "contact", "mode": "NO", "tag": "start_pb" }
   { "id": "i2", "type": "contact", "mode": "NC", "tag": "estop" }

2. COIL  – writes a BOOL output
   OTE  – energise (output = rung state)
   OTL  – latch (set TRUE, stays TRUE until OTU)
   OTU  – unlatch (set FALSE)
   { "id": "i3", "type": "coil", "mode": "OTE", "tag": "motor_run" }

3. COMPARE  – numeric condition (value must be a number)
   LES (<)  GRT (>)  EQ (=)  LEQ (<=)  GEQ (>=)  NEQ (!=)
   { "id": "i4", "type": "compare", "operator": "GRT", "tag": "temperature", "value": 75 }

4. TIMER  – time delay
   TON = on-delay  TOF = off-delay  RTO = retentive on-delay
   Use _done suffix tag for timer done bit in subsequent rungs

   ══════════════════════════════════════════════════════════════════════
   IMPORTANT TIME RULE (CRITICAL)
   ══════════════════════════════════════════════════════════════════════
   • preset is ALWAYS in milliseconds (ms)
   • 1000 = 1 second
   • 2000 = 2 seconds
   • 5000 = 5 seconds
   • NEVER use seconds directly
   • NEVER use large values like 80000 unless 80 seconds is explicitly required
   
   Example: { "id": "i5", "type": "timer", "subtype": "TON", "tag": "start_delay", "preset": 3000 }

5. COUNTER  – event counter
   CTU = count-up  CTD = count-down
   { "id": "i6", "type": "counter", "subtype": "CTU", "tag": "part_ctr", "preset": 100 }

6. MOVE  – copy register value (INT/DINT only)
   { "id": "i7", "type": "move", "source": "setpoint_reg", "destination": "output_reg" }

7. MATH  – arithmetic on registers (add, sub, mul, div)
   { "id": "i8", "type": "math", "operator": "add", "source_a": "val_a", "source_b": "5", "destination": "result" }

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