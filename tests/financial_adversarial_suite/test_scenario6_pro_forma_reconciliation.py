"""
Scenario 6: Mathematical Integrity & Pro Forma Financial Reconciliation Audit
Audits arithmetic correctness and cross-table reconciliation across:
- Table 1.3: Master 3-Year Pro Forma Summary
- Table 4.1: Year 1 Month-by-Month Pro Forma
- Table 4.2: Year 2 Quarterly Pro Forma
- Table 4.3: Year 3 Quarterly Pro Forma
- Table 4.4: Headcount & OpEx Schedule
- Table 5.4: Cross-Persona Unit Economics Matrix
"""

def audit_pro_forma_math():
    print("=" * 80)
    print("SCENARIO 6: MATHEMATICAL INTEGRITY & RECONCILIATION AUDIT")
    print("=" * 80)

    # 1. Audit Table 4.1 (Year 1 Month-by-Month)
    months = list(range(1, 13))
    starter = [40, 90, 160, 230, 310, 400, 500, 615, 740, 880, 1035, 1200]
    pro =     [10, 30,  56,  85, 125, 168, 220, 285, 356, 445,  545,  650]
    ent =     [ 1,  2,   4,   6,   9,  12,  15,  19,  24,  30,   37,   45]
    total_cust = [51, 122, 220, 321, 444, 580, 735, 919, 1120, 1355, 1617, 1895]

    # Verify active customer sums
    cust_errors = []
    for m in range(12):
        calc = starter[m] + pro[m] + ent[m]
        if calc != total_cust[m]:
            cust_errors.append(f"M{m+1}: expected {calc}, found {total_cust[m]}")
    print(f"1. Y1 Customer Count Sums: {'PASSED (0 errors)' if not cust_errors else 'FAILED: ' + str(cust_errors)}")

    # Verify MRR formula: starter*39 + pro*99 + ent*750
    mrr_reported = [3300, 7980, 14784, 21885, 31215, 41232, 52530, 66450, 82104, 100875, 122070, 144900]
    mrr_errors = []
    for m in range(12):
        calc = starter[m] * 39 + pro[m] * 99 + ent[m] * 750
        if calc != mrr_reported[m]:
            mrr_errors.append(f"M{m+1}: calc {calc} != reported {mrr_reported[m]}")
    print(f"2. Y1 MRR Formula Check (39/99/750): {'PASSED (0 errors)' if not mrr_errors else 'FAILED: ' + str(mrr_errors)}")

    # Verify ARR = MRR * 12
    arr_reported = [39600, 95760, 177408, 262620, 374580, 494784, 630360, 797400, 985248, 1210500, 1464840, 1738800]
    arr_errors = []
    for m in range(12):
        calc = mrr_reported[m] * 12
        if calc != arr_reported[m]:
            arr_errors.append(f"M{m+1}: calc {calc} != reported {arr_reported[m]}")
    print(f"3. Y1 ARR Formula Check (MRR * 12): {'PASSED (0 errors)' if not arr_errors else 'FAILED: ' + str(arr_errors)}")

    # Verify Revenue sums
    sub_rev = [5200, 9000, 12300, 20800, 30200, 38700, 58500, 83100, 103900, 146300, 186900, 230100]
    ovg_rev = [300, 500, 700, 1200, 1800, 2300, 3500, 4900, 6100, 8700, 11100, 13900]
    tot_rev = [5500, 9500, 13000, 22000, 32000, 41000, 62000, 88000, 110000, 155000, 198000, 244000]
    rev_errors = []
    for m in range(12):
        if sub_rev[m] + ovg_rev[m] != tot_rev[m]:
            rev_errors.append(f"M{m+1}: {sub_rev[m]} + {ovg_rev[m]} != {tot_rev[m]}")
    print(f"4. Y1 Total Revenue Sums (SaaS + Overage): {'PASSED (0 errors)' if not rev_errors else 'FAILED: ' + str(rev_errors)}")
    print(f"   Sum of Y1 Monthly Revenue: ${sum(tot_rev):,} (Reported FY Total: $980,000)")

    # Verify COGS sums
    llm =   [700, 1220, 1680, 2610, 3830, 4870, 7080, 10090, 12410, 16530, 21170, 25810]
    cont =  [250,  430,  590,  920, 1350, 1720, 2500,  3570,  4390,  5840,  7480,  9160]
    verif = [160,  280,  390,  610,  890, 1130, 1640,  2330,  2870,  3820,  4890,  5990]
    proc =  [ 90,  170,  240,  360,  530,  680,  980,  1410,  1730,  2310,  2960,  3540]
    cogs_rep = [1200, 2100, 2900, 4500, 6600, 8400, 12200, 17400, 21400, 28500, 36500, 44500]
    cogs_errors = []
    for m in range(12):
        calc = llm[m] + cont[m] + verif[m] + proc[m]
        if calc != cogs_rep[m]:
            cogs_errors.append(f"M{m+1}: calc {calc} != reported {cogs_rep[m]}")
    print(f"5. Y1 Total COGS Sums (LLM+Cont+Verif+Proc): {'PASSED (0 errors)' if not cogs_errors else 'FAILED: ' + str(cogs_errors)}")
    print(f"   Sum of Y1 Monthly COGS: ${sum(cogs_rep):,} (Reported FY Total: $186,200)")

    # Verify Gross Profit = Rev - COGS
    gp_rep = [4300, 7400, 10100, 17500, 25400, 32600, 49800, 70600, 88600, 126500, 161500, 199500]
    gp_errors = []
    for m in range(12):
        calc = tot_rev[m] - cogs_rep[m]
        if calc != gp_rep[m]:
            gp_errors.append(f"M{m+1}: calc {calc} != reported {gp_rep[m]}")
    print(f"6. Y1 Gross Profit Formula (Rev - COGS): {'PASSED (0 errors)' if not gp_errors else 'FAILED: ' + str(gp_errors)}")
    print(f"   Sum of Y1 Monthly GP: ${sum(gp_rep):,} (Reported FY Total: $793,800)")

    # Verify OpEx sums
    rd = [48000, 49000, 49500, 53000, 54500, 55500, 58000, 60000, 61000, 62500, 64000, 65000]
    sm = [24000, 24500, 25000, 26500, 27500, 28000, 29000, 30000, 31000, 31500, 32000, 31000]
    ga = [13000, 13500, 13500, 14500, 15000, 15500, 17000, 17000, 17000, 17000, 18000, 19000]
    opex_rep = [85000, 87000, 88000, 94000, 97000, 99000, 104000, 107000, 109000, 111000, 114000, 115000]
    opex_errors = []
    for m in range(12):
        calc = rd[m] + sm[m] + ga[m]
        if calc != opex_rep[m]:
            opex_errors.append(f"M{m+1}: calc {calc} != reported {opex_rep[m]}")
    print(f"7. Y1 Total OpEx Sums (R&D+S&M+G&A): {'PASSED (0 errors)' if not opex_errors else 'FAILED: ' + str(opex_errors)}")
    print(f"   Sum of Y1 Monthly OpEx: ${sum(opex_rep):,} (Reported FY Total: $1,210,000)")

    # Verify EBITDA = GP - OpEx
    ebitda_rep = [-80700, -79600, -77900, -76500, -71600, -66400, -54200, -36400, -20400, 15500, 47500, 84500]
    ebitda_errors = []
    for m in range(12):
        calc = gp_rep[m] - opex_rep[m]
        if calc != ebitda_rep[m]:
            ebitda_errors.append(f"M{m+1}: calc {calc} != reported {ebitda_rep[m]}")
    print(f"8. Y1 EBITDA Formula (GP - OpEx): {'PASSED (0 errors)' if not ebitda_errors else 'FAILED: ' + str(ebitda_errors)}")
    print(f"   Sum of Y1 Monthly EBITDA: ${sum(ebitda_rep):,} (Reported FY Total: -$416,200)")

    # Verify Free Cash Flow = EBITDA + WC + CapEx
    wc = [2000, 3500, 5000, 7000, 8500, 10000, 11500, 13000, 14000, 13000, 13500, 14000]
    capex = [-1000, -1000, -1200, -1500, -1500, -1500, -1600, -1600, -1800, -1800, -2100, -2200]
    fcf_rep = [-79700, -77100, -74100, -71000, -64600, -57900, -44300, -25000, -8200, 26700, 58900, 96300]
    fcf_errors = []
    for m in range(12):
        calc = ebitda_rep[m] + wc[m] + capex[m]
        if calc != fcf_rep[m]:
            fcf_errors.append(f"M{m+1}: calc {calc} != reported {fcf_rep[m]}")
    print(f"9. Y1 Free Cash Flow Formula (EBITDA + WC + CapEx): {'PASSED (0 errors)' if not fcf_errors else 'FAILED: ' + str(fcf_errors)}")
    print(f"   Sum of Y1 Monthly FCF: ${sum(fcf_rep):,} (Reported FY Total: -$320,000)")

    # Verify Cumulative Net Burn and Ending Cash Balance
    cum_burn_rep = [-79700, -156800, -230900, -301900, -366500, -424400, -468700, -493700, -501900, -475200, -416300, -320000]
    burn_calc = 0
    burn_errors = []
    for m in range(12):
        burn_calc += fcf_rep[m]
        if burn_calc != cum_burn_rep[m]:
            burn_errors.append(f"M{m+1}: calc {burn_calc} != reported {cum_burn_rep[m]}")
    print(f"10. Y1 Cumulative Net Burn Tracking: {'PASSED (0 errors)' if not burn_errors else 'FAILED: ' + str(burn_errors)}")
    print(f"    Starting Seed Cash: $1,750,000")
    print(f"    Ending Y1 Cash: ${1750000 + sum(fcf_rep):,} (Reported: $1,430,000)")

    # 2. Audit Year 2 and Year 3 Totals against Table 1.3
    # Y2 Table 4.2
    y2_rev = [810000, 1080000, 1360000, 1600000]
    y2_cogs = [145000, 185000, 228000, 266500]
    y2_gp = [665000, 895000, 1132000, 1333500]
    y2_opex = [680000, 810000, 890000, 950000]
    y2_ebitda = [-15000, 85000, 242000, 383500]
    y2_fcf = [12000, 120000, 281000, 427000]

    print("\n--- Year 2 Table 4.2 Reconciliation ---")
    print(f"  Y2 Total Revenue: ${sum(y2_rev):,} (Reported FY2: $4,850,000)")
    print(f"  Y2 Total COGS:    ${sum(y2_cogs):,} (Reported FY2: $824,500)")
    print(f"  Y2 Total GP:      ${sum(y2_gp):,} (Reported FY2: $4,025,500)")
    print(f"  Y2 Total OpEx:    ${sum(y2_opex):,} (Reported FY2: $3,330,000)")
    print(f"  Y2 Total EBITDA:  ${sum(y2_ebitda):,} (Reported FY2: $695,500)")
    print(f"  Y2 Total FCF:     ${sum(y2_fcf):,} (Reported FY2: $840,000)")

    # Y3 Table 4.3
    y3_rev = [2750000, 3850000, 5100000, 6100000]
    y3_cogs = [430000, 590000, 770000, 880000]
    y3_gp = [2320000, 3260000, 4330000, 5220000]
    y3_opex = [1850000, 2150000, 2450000, 2600000]
    y3_ebitda = [470000, 1110000, 1880000, 2620000]
    y3_fcf = [575000, 1250000, 2068000, 2857000]

    print("\n--- Year 3 Table 4.3 Reconciliation ---")
    print(f"  Y3 Total Revenue: ${sum(y3_rev):,} (Reported FY3: $17,800,000)")
    print(f"  Y3 Total COGS:    ${sum(y3_cogs):,} (Reported FY3: $2,670,000)")
    print(f"  Y3 Total GP:      ${sum(y3_gp):,} (Reported FY3: $15,130,000)")
    print(f"  Y3 Total OpEx:    ${sum(y3_opex):,} (Reported FY3: $9,050,000)")
    print(f"  Y3 Total EBITDA:  ${sum(y3_ebitda):,} (Reported FY3: $6,080,000)")
    print(f"  Y3 Total FCF:     ${sum(y3_fcf):,} (Reported FY3: $6,750,000)")

    # 3. Headcount Cost Reconciliation
    # Table 4.4 states:
    # Y1 FTE: 11 (R&D: 6, S&M: 3, G&A: 2). R&D: $680k, S&M: $340k, G&A: $190k. Total OpEx: $1,210k.
    # Footnote line 611: "1.25x burden multiplier. Non-headcount OpEx represents 28% of total OpEx in Y1, 32% in Y2, 36% in Y3."
    y1_headcount_budget = 1210000 * (1 - 0.28)  # 72% = $871,200
    y1_avg_burdened_salary = y1_headcount_budget / 11  # $79,200
    y1_avg_base_salary = y1_avg_burdened_salary / 1.25  # $63,360
    print("\n--- Headcount Cost Audit ---")
    print(f"  Y1 Headcount Budget (72% of $1.21M): ${y1_headcount_budget:,.0f}")
    print(f"  Y1 Average Fully Burdened Cost / FTE: ${y1_avg_burdened_salary:,.0f}")
    print(f"  Y1 Implied Average Base Salary:        ${y1_avg_base_salary:,.0f}")
    print("  *Observation: If 11 FTEs were full-time for all 12 months at stated salary bands ($150k-$240k), headcount cost would be >$2.0M.")
    print("   However, the hiring schedule ramps FTEs throughout the year (starting with 4-5 founders/core devs and ending at 11 FTEs in M12).")

if __name__ == "__main__":
    audit_pro_forma_math()
