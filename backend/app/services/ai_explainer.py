from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def explain_rungs(rungs):
    explanations = []

    for rung in rungs:
        prompt = f"""
Explain this PLC ladder rung clearly and simply:

{rung}

Explain:
- What condition is checked
- What output happens
- Keep it short (2-3 lines)
"""

        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        text = res.choices[0].message.content
        explanations.append(text)

    return explanations