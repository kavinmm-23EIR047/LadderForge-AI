def update_instruction(plc_logic, rung_id, instruction_id, field, value):
    for rung in plc_logic.get("rungs", []):
        if rung["rung_id"] == rung_id:
            for inst in rung["instructions"]:
                if inst.get("id") == instruction_id:
                    inst[field] = value
    return plc_logic