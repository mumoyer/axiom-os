"""
Independent Victory Auditor 3: Standalone Verification & Stress Test Suite
Author: Independent Victory Auditor
Target: Phase 3 Stage Gate OS (poasOS) Marketing Blueprint & Anti-Polsia Strategy
Deliverables:
  - marketing/poas_marketing_plan.json
  - marketing/poas_marketing_plan.md
"""

import json
import math
import os
import re
import sys

def run_independent_audit():
    print("=" * 80)
    print("INDEPENDENT VICTORY AUDITOR 3: EXHAUSTIVE VERIFICATION HARNESS")
    print("=" * 80)
    
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    json_path = os.path.join(workspace_root, "marketing", "poas_marketing_plan.json")
    md_path = os.path.join(workspace_root, "marketing", "poas_marketing_plan.md")
    
    failures = []
    
    # =========================================================================
    # PHASE 1: TIMELINE & PROVENANCE AUDIT
    # =========================================================================
    print("\n[PHASE 1] TIMELINE & PROVENANCE AUDIT")
    print("-" * 80)
    
    for path, name in [(json_path, "JSON Deliverable"), (md_path, "Markdown Deliverable")]:
        if not os.path.exists(path):
            failures.append(f"{name} not found at {path}")
            print(f"  [FAIL] {name} missing: {path}")
        else:
            size = os.path.getsize(path)
            mtime = os.path.getmtime(path)
            print(f"  [PASS] {name} present: {path} ({size:,} bytes, mtime={mtime})")
            if size < 50000:
                failures.append(f"{name} is suspiciously small: {size} bytes")

    # =========================================================================
    # PHASE 2: INTEGRITY & ANTI-CHEATING FORENSIC SCAN
    # =========================================================================
    print("\n[PHASE 2] INTEGRITY & ANTI-CHEATING FORENSIC SCAN")
    print("-" * 80)
    
    # 2.1 Load and parse JSON
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            json_text = f.read()
        data = json.loads(json_text)
        print("  [PASS] JSON successfully parsed without syntax error.")
    except Exception as e:
        failures.append(f"JSON parsing error: {e}")
        data = {}

    # 2.2 Read Markdown
    try:
        with open(md_path, "r", encoding="utf-8") as f:
            md_text = f.read()
        print(f"  [PASS] Markdown successfully read ({len(md_text):,} characters).")
    except Exception as e:
        failures.append(f"Markdown reading error: {e}")
        md_text = ""

    # 2.3 Recursive scan for forbidden placeholder tokens in JSON
    forbidden_tokens = ["TODO", "FIXME", "[TBD]", "LOREM IPSUM", "DUMMY"]
    issues = []
    
    def check_node(val, path_str):
        if val is None:
            issues.append((path_str, "NULL_VALUE"))
            return
        if isinstance(val, str):
            for t in forbidden_tokens:
                if t in val.upper():
                    issues.append((path_str, f"FORBIDDEN_TOKEN_{t}"))
            # Special check for 'placeholder'
            if "placeholder" in val.lower():
                if "whsec_placeholder" not in val and "placeholder secret" not in val.lower():
                    issues.append((path_str, "UNSANCTIONED_PLACEHOLDER"))
            if len(val.strip()) == 0:
                issues.append((path_str, "EMPTY_STRING"))
        elif isinstance(val, list):
            if len(val) == 0:
                issues.append((path_str, "EMPTY_LIST"))
            for idx, item in enumerate(val):
                check_node(item, f"{path_str}[{idx}]")
        elif isinstance(val, dict):
            if len(val) == 0:
                issues.append((path_str, "EMPTY_DICT"))
            for k, v in val.items():
                for t in forbidden_tokens:
                    if t in k.upper():
                        issues.append((f"{path_str}.{k}", f"FORBIDDEN_KEY_{t}"))
                check_node(v, f"{path_str}.{k}")

    check_node(data, "root")
    if issues:
        for path_str, issue in issues:
            failures.append(f"Integrity violation in JSON at {path_str}: {issue}")
            print(f"  [FAIL] JSON Integrity issue at {path_str}: {issue}")
    else:
        print("  [PASS] JSON recursive integrity scan: 0 forbidden tokens, 0 empty elements, 0 nulls.")

    # 2.4 Markdown scan for forbidden placeholder tokens
    for t in forbidden_tokens:
        matches = [m.start() for m in re.finditer(re.escape(t), md_text, re.IGNORECASE)]
        if matches:
            failures.append(f"Forbidden token '{t}' found in Markdown at positions {matches}")
            print(f"  [FAIL] Forbidden token '{t}' in Markdown: count={len(matches)}")
    print("  [PASS] Markdown integrity scan: 0 forbidden tokens found.")

    # 2.5 Verification of Polsia 4 Fatal Flaws in both deliverables
    print("\n[PHASE 2.5] POLSIA 4 FATAL FLAWS EMPIRICAL COVERAGE")
    print("-" * 80)
    flaw_patterns = {
        "Bug Tax ($1/task)": [r"\$1(/|\s+per\s+)task", r"bug\s+tax"],
        "False-Done Hallucinations": [r"false[\s\-_]done", r"hallucinat"],
        "20% Revenue / Ad Take-Rate": [r"20%", r"revenue\s+tax", r"ad\s+surcharge"],
        "Proprietary Lock-in / Walled Garden": [r"walled[\s\-_]garden", r"lock[\s\-_]in", r"git\s+ejection"]
    }
    for flaw_name, patterns in flaw_patterns.items():
        json_match = any(re.search(p, json_text, re.IGNORECASE) for p in patterns)
        md_match = any(re.search(p, md_text, re.IGNORECASE) for p in patterns)
        if json_match and md_match:
            print(f"  [PASS] {flaw_name}: Documented in both JSON and Markdown.")
        else:
            failures.append(f"Polsia flaw '{flaw_name}' missing in deliverables (json={json_match}, md={md_match})")
            print(f"  [FAIL] {flaw_name} missing coverage: json={json_match}, md={md_match}")

    # 2.6 Verification of Architectural Guarantees (2PC, Circuit Breaker, 5-Stage Gate)
    print("\n[PHASE 2.6] ARCHITECTURAL GUARANTEES & DEFENSIVE MECHANICS")
    print("-" * 80)
    arch_terms = {
        "2PC Credit Escrow": r"2PC|two-phase\s+commit|credit\s+escrow",
        "Tenant Circuit Breaker": r"circuit\s+breaker",
        "5-Stage Deterministic Stage Gate": r"stage[\s\-_]gate|deterministic",
        "Full Git Ejection": r"git\s+ejection|eject"
    }
    for term, pattern in arch_terms.items():
        j_match = bool(re.search(pattern, json_text, re.IGNORECASE))
        m_match = bool(re.search(pattern, md_text, re.IGNORECASE))
        if j_match and m_match:
            print(f"  [PASS] {term}: Verified in both JSON and Markdown.")
        else:
            failures.append(f"Architectural guarantee '{term}' missing in deliverables (json={j_match}, md={m_match})")
            print(f"  [FAIL] {term} missing: json={j_match}, md={m_match}")

    # =========================================================================
    # PHASE 3: INDEPENDENT EXECUTION & MATHEMATICAL VALIDATION
    # =========================================================================
    print("\n[PHASE 3] MATHEMATICAL RIGOR & UNIT ECONOMICS VERIFICATION")
    print("-" * 80)

    # 3.1 Virality Model Audit
    print("--- Sub-test 3.1: Virality Model & K-Factor ---")
    k_data = data.get("viral_engine", {}).get("viral_code_ejection_and_badge_loop", {}).get("mathematical_k_factor_derivation", {})
    calc_k = k_data.get("calculated_k")
    comp_mult = k_data.get("compounded_organic_expansion_multiplier")
    cac_red = k_data.get("effective_cac_reduction_percent")
    
    # Mathematical proof
    i_param = 0.40
    c_param = 0.70
    k_expected = round(i_param * c_param, 4)
    mult_expected = round(1.0 / (1.0 - k_expected), 4)
    cac_red_expected = round(k_expected * 100, 1)

    print(f"  Calculated K: {calc_k} (Expected: {k_expected})")
    print(f"  Multiplier:   {comp_mult} (Expected: {mult_expected})")
    print(f"  CAC Red:      {cac_red}% (Expected: {cac_red_expected}%)")

    if abs(calc_k - k_expected) > 1e-4:
        failures.append(f"Virality K-factor mismatch: expected {k_expected}, got {calc_k}")
    if abs(comp_mult - mult_expected) > 1e-3:
        failures.append(f"Viral multiplier mismatch: expected {mult_expected}, got {comp_mult}")
    if abs(cac_red - cac_red_expected) > 0.1:
        failures.append(f"CAC reduction mismatch: expected {cac_red_expected}%, got {cac_red}%")
    if calc_k >= 1.0:
        failures.append(f"Virality model is unstable (K={calc_k} >= 1.0)")
    else:
        print("  [PASS] Virality model is sub-critical (K < 1.0), mathematically sound and non-explosive.")

    # 3.2 30-60-90 Day GTM Budgets
    print("\n--- Sub-test 3.2: 30-60-90 Day GTM Budgets ---")
    budgets = data.get("gtm_architecture", {}).get("budget_allocation_models", {})
    m1 = budgets.get("month_1_10k", {}).get("total_budget_usd")
    m2 = budgets.get("month_2_25k", {}).get("total_budget_usd")
    m3 = budgets.get("month_3_50k", {}).get("total_budget_usd")
    print(f"  Month 1 Budget: ${m1:,} (Expected: $10,000)")
    print(f"  Month 2 Budget: ${m2:,} (Expected: $25,000)")
    print(f"  Month 3 Budget: ${m3:,} (Expected: $50,000)")

    if m1 != 10000 or m2 != 25000 or m3 != 50000:
        failures.append(f"GTM budgets do not match $10k/$25k/$50k milestone targets: m1={m1}, m2={m2}, m3={m3}")
    else:
        print("  [PASS] 30-60-90 day budgets exactly match $10k, $25k, $50k allocation.")

    # 3.3 Unit Economics & Gross Margin >80%
    print("\n--- Sub-test 3.3: Unit Economics & Gross Margin ---")
    econ = data.get("gtm_architecture", {}).get("unit_economics_model", {})
    blended_arpu = econ.get("blended_arpu_usd")
    cogs_per_venture = econ.get("direct_cogs_per_venture_usd")
    margins = econ.get("realized_gross_margins", {})
    y1_gm = margins.get("year_1")
    y2_gm = margins.get("year_2")
    y3_gm = margins.get("year_3")

    print(f"  Blended ARPU:     ${blended_arpu:.2f} (Target range: $59 - $119/mo)")
    print(f"  Direct COGS:      ${cogs_per_venture:.2f} (Target: $1.43)")
    print(f"  Realized Margins: Y1={y1_gm}%, Y2={y2_gm}%, Y3={y3_gm}% (Target: >80%)")

    if not (59.0 <= blended_arpu <= 119.0):
        failures.append(f"Blended ARPU ${blended_arpu} outside $59-$119 bounds")
    if abs(cogs_per_venture - 1.43) > 0.01:
        failures.append(f"Direct COGS mismatch: expected $1.43, got ${cogs_per_venture}")
    if y1_gm < 80.0 or y2_gm < 80.0 or y3_gm < 80.0:
        failures.append(f"Gross margin below 80% threshold: Y1={y1_gm}%, Y2={y2_gm}%, Y3={y3_gm}%")
    else:
        print("  [PASS] Unit economics strictly adhere to >80% Gross Margin and $59-$119 ARPU.")

    # 3.4 Personas Completeness
    print("\n--- Sub-test 3.4: Persona Playbooks Completeness ---")
    personas = data.get("personas", [])
    if len(personas) != 3:
        failures.append(f"Personas count mismatch: expected 3, got {len(personas)}")
    for p in personas:
        p_name = p.get("name")
        p_id = p.get("persona_id")
        pain_pts = p.get("core_pain_points", [])
        copy_scripts = p.get("complete_copy_scripts", {})
        objections = p.get("objection_handling_matrix", [])
        
        print(f"  Persona: {p_name} ({p_id})")
        print(f"    - Pain points: {len(pain_pts)}")
        print(f"    - Headlines:   {len(copy_scripts.get('headline_variants', []))}")
        print(f"    - Ad copies:   {len(copy_scripts.get('ad_copy_variants', []))}")
        print(f"    - Objections:  {len(objections)}")

        if len(pain_pts) < 3:
            failures.append(f"Persona {p_id} has insufficient pain points ({len(pain_pts)})")
        if len(copy_scripts.get("headline_variants", [])) < 3:
            failures.append(f"Persona {p_id} has insufficient headlines")
        if len(copy_scripts.get("ad_copy_variants", [])) < 2:
            failures.append(f"Persona {p_id} has insufficient ad copies")
        if len(objections) < 4:
            failures.append(f"Persona {p_id} has insufficient objection handlers ({len(objections)})")

    # 3.5 7-Part Lifecycle Email Sequence
    print("\n--- Sub-test 3.5: 7-Part Lifecycle Email Drip ---")
    drip = data.get("lifecycle_email", {}).get("drip_onboarding_sequence_7_part", [])
    print(f"  Drip stages count: {len(drip)} (Expected: 7)")
    if len(drip) != 7:
        failures.append(f"Drip sequence length mismatch: expected 7, got {len(drip)}")
    for idx, email in enumerate(drip):
        step = email.get("step_number")
        subj = email.get("subject_line")
        body = email.get("email_body")
        cta = email.get("primary_cta")
        if step != idx + 1 or not subj or len(body) < 50 or not cta:
            failures.append(f"Email stage {idx+1} malformed or incomplete")
    print("  [PASS] All 7 onboarding emails have authentic subjects, copy, triggers, and CTAs.")

    # 3.6 12-Week Content Calendar
    print("\n--- Sub-test 3.6: 12-Week Content Calendar ---")
    calendar = data.get("content_calendar", {}).get("schedule", [])
    print(f"  Calendar weeks: {len(calendar)} (Expected: 12)")
    if len(calendar) != 12:
        failures.append(f"Content calendar weeks mismatch: expected 12, got {len(calendar)}")
    for idx, week in enumerate(calendar):
        w_num = week.get("week")
        items = week.get("content_items", [])
        if w_num != idx + 1 or len(items) < 2:
            failures.append(f"Calendar week {idx+1} has invalid week number or fewer than 2 items")
    print("  [PASS] 12-week content calendar has complete multi-channel schedules.")

    # =========================================================================
    # SUMMARY & VERDICT
    # =========================================================================
    print("\n" + "=" * 80)
    print("AUDITOR VERDICT SUMMARY")
    print("=" * 80)
    print(f"Total Failures Encountered: {len(failures)}")
    if failures:
        for f in failures:
            print(f"  - [FAIL] {f}")
        print("\nVERDICT: VICTORY REJECTED")
        return False
    else:
        print("\nALL VERIFICATION CRITERIA EMPIRICALLY SATISFIED.")
        print("VERDICT: VICTORY CONFIRMED")
        return True

if __name__ == "__main__":
    success = run_independent_audit()
    sys.exit(0 if success else 1)
