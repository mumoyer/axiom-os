"""
Comprehensive empirical test script for marketing/poas_marketing_plan.json
Tests:
1. Syntax & Parse Test
2. Structural Completeness Test (12 core keys and sub-elements)
3. Stub & Placeholder Check (recursive scan for TODO, FIXME, [TBD], placeholder, Lorem ipsum, empty strings/arrays/nulls)
"""

import json
import os
import sys
import re

def main():
    json_path = os.path.join(os.path.dirname(__file__), "..", "marketing", "poas_marketing_plan.json")
    json_path = os.path.abspath(json_path)
    print(f"Testing JSON target: {json_path}")
    
    if not os.path.exists(json_path):
        print(f"FAIL: File not found at {json_path}")
        sys.exit(1)
        
    # --- TEST 1: SYNTAX & PARSE TEST ---
    print("\n==========================================")
    print("TEST 1: Syntax & Parse Test")
    print("==========================================")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            raw_content = f.read()
        data = json.loads(raw_content)
        print(f"PASS: Valid JSON syntax. Parsed {len(raw_content)} bytes successfully.")
    except Exception as e:
        print(f"FAIL: JSON parse error: {e}")
        sys.exit(1)

    # --- TEST 2: STRUCTURAL COMPLETENESS TEST ---
    print("\n==========================================")
    print("TEST 2: Structural Completeness Test")
    print("==========================================")
    
    required_keys = [
        "schema_version",
        "metadata",
        "competitive_teardown",
        "brand_positioning",
        "personas",
        "gtm_architecture",
        "viral_engine",
        "paid_acquisition",
        "lifecycle_email",
        "content_calendar",
        "tracking_parameters",
        "kpis_and_unit_economics"
    ]
    
    missing_keys = []
    empty_keys = []
    for k in required_keys:
        if k not in data:
            missing_keys.append(k)
        else:
            val = data[k]
            if val is None or (isinstance(val, (list, dict, str)) and len(val) == 0):
                empty_keys.append(k)
                
    if missing_keys:
        print(f"FAIL: Missing top-level keys: {missing_keys}")
    else:
        print(f"PASS: All 12 required top-level keys exist.")
        
    if empty_keys:
        print(f"FAIL: Empty top-level keys: {empty_keys}")
    else:
        print(f"PASS: No required top-level keys are empty.")

    # 2.1 Personas Check
    print("\n--- Sub-check 2.1: Personas ---")
    personas = data.get("personas")
    if isinstance(personas, list):
        print(f"Personas is list of length {len(personas)}")
        required_personas = ["aspiring_founder", "serial_indie_hacker", "corporate_innovation_studio"]
        found_personas = {}
        for p in personas:
            p_id = str(p.get("persona_id", ""))
            for req in required_personas:
                if req in p_id:
                    found_personas[req] = p
        for req in required_personas:
            if req in found_personas:
                print(f"  PASS: Persona '{req}' found (id: {found_personas[req].get('persona_id')})")
            else:
                print(f"  FAIL: Persona '{req}' NOT found in personas list!")
    elif isinstance(personas, dict):
        print(f"Personas is dict with keys: {list(personas.keys())}")
        for req in ["aspiring_founder", "serial_indie_hacker", "corporate_innovation_studio"]:
            if any(req in k for k in personas.keys()):
                print(f"  PASS: Persona '{req}' found in keys")
            else:
                print(f"  FAIL: Persona '{req}' NOT found in keys")
    else:
        print(f"FAIL: Personas has unexpected type: {type(personas)}")

    # 2.2 GTM Architecture Check
    print("\n--- Sub-check 2.2: GTM Architecture ---")
    gtm = data.get("gtm_architecture", {})
    print(f"GTM keys: {list(gtm.keys()) if isinstance(gtm, dict) else type(gtm)}")
    # Check 30_day, 60_day, 90_day milestones
    milestones = gtm.get("milestones_30_60_90", {})
    m_keys = list(milestones.keys()) if isinstance(milestones, dict) else []
    print(f"  Milestones keys: {m_keys}")
    has_30 = any("30" in k for k in m_keys) or "30_day" in gtm
    has_60 = any("60" in k for k in m_keys) or "60_day" in gtm
    has_90 = any("90" in k for k in m_keys) or "90_day" in gtm
    print(f"  30_day milestone present: {has_30}")
    print(f"  60_day milestone present: {has_60}")
    print(f"  90_day milestone present: {has_90}")
    # Check budget allocation
    has_budget = "budget_allocation_models" in gtm or "budget_allocation" in gtm
    print(f"  budget_allocation present: {has_budget}")

    # 2.3 Viral Engine Check
    print("\n--- Sub-check 2.3: Viral Engine ---")
    ve = data.get("viral_engine", {})
    ve_keys = list(ve.keys()) if isinstance(ve, dict) else []
    print(f"Viral Engine keys: {ve_keys}")
    has_vvg = "venture_validation_grader" in ve or "vvg_lead_magnet" in ve
    has_cli = "open_source_cli_distribution" in ve or "open_source_cli" in ve
    has_badge = "viral_code_ejection_and_badge_loop" in ve or "badge_loop" in ve
    has_teardowns = "programmatic_teardown_case_studies" in ve or "programmatic_teardowns" in ve
    print(f"  vvg_lead_magnet present: {has_vvg}")
    print(f"  open_source_cli present: {has_cli}")
    print(f"  badge_loop present: {has_badge}")
    print(f"  programmatic_teardowns present: {has_teardowns}")

    # 2.4 Paid Acquisition Check
    print("\n--- Sub-check 2.4: Paid Acquisition ---")
    pa = data.get("paid_acquisition", {})
    pa_keys = list(pa.keys()) if isinstance(pa, dict) else []
    print(f"Paid Acquisition keys: {pa_keys}")
    campaigns = pa.get("campaigns", [])
    channels = []
    if isinstance(campaigns, list):
        channels = [c.get("channel") for c in campaigns if isinstance(c, dict)]
    elif isinstance(campaigns, dict):
        channels = list(campaigns.keys())
    print(f"  Campaign channels: {channels}")
    has_google = any("GOOGLE" in str(c).upper() for c in channels) or "google_search" in pa
    has_meta = any("META" in str(c).upper() for c in channels) or "meta_ads" in pa
    has_x = any("X_" in str(c).upper() or "TWITTER" in str(c).upper() for c in channels) or "x_ads" in pa
    has_neg = "negative_keyword_registry" in pa or "negative_keywords" in pa
    print(f"  google_search present: {has_google}")
    print(f"  meta_ads present: {has_meta}")
    print(f"  x_ads present: {has_x}")
    print(f"  negative_keywords present: {has_neg}")

    # 2.5 Lifecycle Email Check
    print("\n--- Sub-check 2.5: Lifecycle Email ---")
    le = data.get("lifecycle_email", {})
    le_keys = list(le.keys()) if isinstance(le, dict) else []
    print(f"Lifecycle Email keys: {le_keys}")
    drip = le.get("drip_onboarding_sequence_7_part") or le.get("onboarding_drip") or []
    print(f"  onboarding drip item count: {len(drip)} (Expected: 7)")
    has_churn = "churn_mitigation_triggers" in le or "churn_mitigation" in le
    has_upsell = "post_ejection_regression_monitoring_upsell" in le or "regression_upsell" in le
    print(f"  churn_mitigation present: {has_churn}")
    print(f"  regression_upsell present: {has_upsell}")

    # 2.6 Content Calendar Check
    print("\n--- Sub-check 2.6: Content Calendar ---")
    cc = data.get("content_calendar", {})
    schedule = cc.get("schedule", []) if isinstance(cc, dict) else (cc if isinstance(cc, list) else [])
    print(f"Content Calendar weeks count: {len(schedule)} (Expected: 12)")

    # 2.7 Tracking Parameters Check
    print("\n--- Sub-check 2.7: Tracking Parameters ---")
    tp = data.get("tracking_parameters", {})
    tp_keys = list(tp.keys()) if isinstance(tp, dict) else []
    print(f"Tracking Parameters keys: {tp_keys}")
    has_utm = "universal_utm_taxonomy" in tp or "utm_taxonomy" in tp
    has_events = "custom_event_tracking_architecture" in tp or "event_tracking" in tp
    print(f"  utm_taxonomy present: {has_utm}")
    print(f"  event_tracking present: {has_events}")

    # 2.8 KPIs and Unit Economics Check
    print("\n--- Sub-check 2.8: KPIs & Unit Economics ---")
    kpi = data.get("kpis_and_unit_economics", {})
    kpi_keys = list(kpi.keys()) if isinstance(kpi, dict) else []
    print(f"KPIs & Unit Economics keys: {kpi_keys}")
    has_unit_econ = "scorecard" in kpi or "unit_economics" in kpi or "unit_economics_model" in gtm
    has_targets = "pro_forma_financial_reconciliation" in kpi or "targets" in kpi
    print(f"  unit_economics present: {has_unit_econ}")
    print(f"  targets present: {has_targets}")

    # --- TEST 3: STUB & PLACEHOLDER CHECK ---
    print("\n==========================================")
    print("TEST 3: Stub & Placeholder Recursive Check")
    print("==========================================")
    
    findings = []
    
    def scan_recursively(node, path="root"):
        if node is None:
            findings.append((path, "NULL_VALUE", "Value is None/null"))
            return
            
        if isinstance(node, str):
            # Check empty string
            if node.strip() == "":
                findings.append((path, "EMPTY_STRING", "Empty string found"))
            # Check suspicious tokens
            for token in ["TODO", "FIXME", "[TBD]", "placeholder", "Lorem ipsum"]:
                # Special check for 'placeholder' to see if it is descriptive or a literal placeholder
                if token.lower() in node.lower():
                    findings.append((path, f"TOKEN_{token.upper()}", node))
        elif isinstance(node, list):
            if len(node) == 0:
                findings.append((path, "EMPTY_ARRAY", "Empty array found"))
            for i, item in enumerate(node):
                scan_recursively(item, f"{path}[{i}]")
        elif isinstance(node, dict):
            if len(node) == 0:
                findings.append((path, "EMPTY_OBJECT", "Empty object found"))
            for k, v in node.items():
                # Check key names as well
                for token in ["TODO", "FIXME", "[TBD]"]:
                    if token.lower() in k.lower():
                        findings.append((f"{path}.{k}", f"KEY_TOKEN_{token.upper()}", k))
                scan_recursively(v, f"{path}.{k}")

    scan_recursively(data)
    
    print(f"Total scan findings: {len(findings)}")
    for path, kind, details in findings:
        print(f"  [{kind}] at {path}: {str(details)[:120]}")

if __name__ == "__main__":
    main()
