"""
Scenario 3: Enterprise Sales Cycle Elongation Stress Test
Simulates an elongation of Enterprise Studio sales cycles from 3 months to 6 months.
Evaluates:
- Delay in Enterprise active customers and ARR
- Month-by-month cash burn impact
- Shift in the Month 17 Cash Flow Breakeven milestone
- Trough cash balance and runway solvency
"""

import numpy as np

def run_enterprise_elongation_simulation():
    # Baseline active customer ramps from pro forma:
    starter_baseline = [40, 90, 160, 230, 310, 400, 500, 615, 740, 880, 1035, 1200]
    pro_baseline =     [10, 30,  56,  85, 125, 168, 220, 285, 356, 445,  545,  650]
    ent_baseline =     [ 1,  2,   4,   6,   9,  12,  15,  19,  24,  30,   37,   45]

    months_y2_targets = [12, 15, 18, 21, 24]
    ent_y2_pts = [45, 70, 120, 160, 210]
    starter_y2_pts = [1200, 1850, 2650, 3700, 4800]
    pro_y2_pts = [650, 980, 1480, 2190, 3100]

    all_months = list(range(1, 25))
    ent_base_all = ent_baseline + list(np.interp(range(13, 25), months_y2_targets, ent_y2_pts))
    starter_base_all = starter_baseline + list(np.interp(range(13, 25), months_y2_targets, starter_y2_pts))
    pro_base_all = pro_baseline + list(np.interp(range(13, 25), months_y2_targets, pro_y2_pts))

    # Elongated Enterprise Cycle:
    # 3-month sales cycle expands to 6 months (a 3-month lag in enterprise customer closures).
    # Customer additions from month m do not close until month m+3.
    # For months 1, 2, 3: 0 enterprise closures (or 0, 0, 1).
    # For month m >= 4: ent_elongated[m] corresponds to ent_base[m-3].
    ent_elongated_all = [0, 0, 1] + ent_base_all[:-3]

    # OpEx and Working Capital schedules
    opex_y1 = [85000, 87000, 88000, 94000, 97000, 99000, 104000, 107000, 109000, 111000, 114000, 115000]
    opex_y2 = [680000/3]*3 + [810000/3]*3 + [890000/3]*3 + [950000/3]*3
    opex_all = opex_y1 + opex_y2

    wc_capex_y1 = [
        2000-1000, 3500-1000, 5000-1200, 7000-1500, 8500-1500, 10000-1500,
        11500-1600, 13000-1600, 14000-1800, 13000-1800, 13500-2100, 14000-2200
    ]
    wc_capex_y2 = [9000]*3 + [11667]*3 + [13000]*3 + [14500]*3
    wc_capex_all = wc_capex_y1 + wc_capex_y2

    def run_sim(ent_series, name="Baseline"):
        cash = 1750000.0
        min_cash = cash
        min_month = 0
        breakeven_month = None
        history = []

        for m in range(24):
            starter_act = starter_base_all[m]
            pro_act = pro_base_all[m]
            ent_act = ent_series[m]

            ent_arpu = 750.0 if m < 12 else 850.0
            mrr = starter_act * 39.0 + pro_act * 99.0 + ent_act * ent_arpu

            # Direct COGS
            cogs = starter_act * 3.924 + pro_act * 8.30 + ent_act * 110.50 + mrr * 0.03
            gross_profit = mrr - cogs
            opex = opex_all[m]
            ebitda = gross_profit - opex
            fcf = ebitda + wc_capex_all[m]

            cash += fcf
            if cash < min_cash:
                min_cash = cash
                min_month = m + 1

            if fcf > 0 and breakeven_month is None and m > 0:
                breakeven_month = m + 1

            history.append({
                "month": m + 1,
                "ent_act": ent_act,
                "mrr": mrr,
                "arr": mrr * 12,
                "ebitda": ebitda,
                "fcf": fcf,
                "cash": cash
            })

        return {
            "name": name,
            "min_cash": min_cash,
            "min_month": min_month,
            "ending_cash_y1": history[11]["cash"],
            "ending_cash_y2": history[23]["cash"],
            "ending_arr_y1": history[11]["arr"],
            "ending_arr_y2": history[23]["arr"],
            "ending_ent_y1": history[11]["ent_act"],
            "ending_ent_y2": history[23]["ent_act"],
            "breakeven_month": breakeven_month,
            "history": history
        }

    base = run_sim(ent_base_all, "Baseline Enterprise (3-Month Sales Cycle)")
    elong = run_sim(ent_elongated_all, "Elongated Enterprise (6-Month Sales Cycle)")

    # Also test an extreme case: Enterprise completely stalls in Y1 (0 enterprise in Y1, starts slowly in Y2)
    ent_zero_y1 = [0]*12 + ent_base_all[:12]
    stall = run_sim(ent_zero_y1, "Severe Enterprise Stall (0 Enterprise in Year 1)")

    print("=" * 80)
    print("SCENARIO 3: ENTERPRISE SALES CYCLE ELONGATION STRESS TEST")
    print("=" * 80)
    for res in [base, elong, stall]:
        print(f"\n--- {res['name']} ---")
        print(f"  Y1 Ending Enterprise Customers: {res['ending_ent_y1']:.0f} | Total ARR: ${res['ending_arr_y1']:,.0f}")
        print(f"  Y2 Ending Enterprise Customers: {res['ending_ent_y2']:.0f} | Total ARR: ${res['ending_arr_y2']:,.0f}")
        print(f"  Cash Flow Breakeven Milestone: Month {res['breakeven_month']}")
        print(f"  Trough Cash Balance: ${res['min_cash']:,.0f} (at Month {res['min_month']})")
        print(f"  Year 1 Ending Cash: ${res['ending_cash_y1']:,.0f}")
        print(f"  Year 2 Ending Cash: ${res['ending_cash_y2']:,.0f}")
        print(f"  Solvency Status: {'SURVIVES (Solvent)' if res['min_cash'] > 0 else 'INSOLVENT'}")

    print("\n" + "-" * 80)
    print("MONTH-BY-MONTH COMPARISON (Months 10 to 20): Baseline vs Elongated 6-Month Cycle")
    print("-" * 80)
    print("Month | Base Ent | Elong Ent | Base MRR ($) | Elong MRR ($) | Base FCF ($) | Elong FCF ($)| Elong Cash ($)")
    for i in range(9, 20):
        b = base["history"][i]
        e = elong["history"][i]
        print(f"{b['month']:5d} | {b['ent_act']:8.0f} | {e['ent_act']:9.0f} | {b['mrr']:12,.0f} | {e['mrr']:13,.0f} | {b['fcf']:12,.0f} | {e['fcf']:12,.0f} | {e['cash']:14,.0f}")

if __name__ == "__main__":
    run_enterprise_elongation_simulation()
