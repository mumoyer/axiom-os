"""
Scenario 2: Adverse Churn Spike Stress Test
Models cohort customer dynamics, MRR, ARR, revenue, COGS, OpEx, and cash flow across 24 months.
Compares Baseline Churn (Starter 5.5%, Pro 2.2%, Ent 0.75%) vs
Adverse Churn Spike (Starter 10.0%, Pro 5.0%, Ent 0.75% or 1.5%).

Checks:
- Year 1 & Year 2 ending customers and ARR
- Monthly net cash burn
- Cumulative cash balance and trough (lowest cash point)
- Seed round ($1.75M) survival across Year 1 and Year 2
"""

import numpy as np

def run_churn_simulation():
    # Month 1 to 12 active customers from pro forma (Table 4.1)
    starter_baseline = [40, 90, 160, 230, 310, 400, 500, 615, 740, 880, 1035, 1200]
    pro_baseline =     [10, 30,  56,  85, 125, 168, 220, 285, 356, 445,  545,  650]
    ent_baseline =     [ 1,  2,   4,   6,   9,  12,  15,  19,  24,  30,   37,   45]

    # Baseline monthly churn rates
    base_churn_starter = 0.055
    base_churn_pro = 0.022
    base_churn_ent = 0.0075

    # Derive gross new additions per month for each tier under baseline:
    # Active[m] = Active[m-1] * (1 - churn) + GrossAdds[m]
    # GrossAdds[m] = Active[m] - Active[m-1] * (1 - churn)
    
    def derive_gross_adds(active_series, churn_rate):
        gross_adds = []
        for i in range(len(active_series)):
            if i == 0:
                gross_adds.append(active_series[0])
            else:
                prev = active_series[i-1]
                surviving = prev * (1.0 - churn_rate)
                adds = active_series[i] - surviving
                gross_adds.append(adds)
        return gross_adds

    starter_adds_y1 = derive_gross_adds(starter_baseline, base_churn_starter)
    pro_adds_y1 = derive_gross_adds(pro_baseline, base_churn_pro)
    ent_adds_y1 = derive_gross_adds(ent_baseline, base_churn_ent)

    # Year 2 quarterly active customers from Table 4.2:
    # Y2 Q1 (M15): Starter 1850, Pro 980, Ent 70
    # Y2 Q2 (M18): Starter 2650, Pro 1480, Ent 120 (Breakeven Month 17)
    # Y2 Q3 (M21): Starter 3700, Pro 2190, Ent 160
    # Y2 Q4 (M24): Starter 4800, Pro 3100, Ent 210

    # Interpolate M13 to M24 for baseline active
    months_y2_targets = [12, 15, 18, 21, 24]
    starter_y2_pts = [1200, 1850, 2650, 3700, 4800]
    pro_y2_pts = [650, 980, 1480, 2190, 3100]
    ent_y2_pts = [45, 70, 120, 160, 210]

    all_months = list(range(1, 25))
    starter_active_base = starter_baseline + list(np.interp(range(13, 25), months_y2_targets, starter_y2_pts))
    pro_active_base = pro_baseline + list(np.interp(range(13, 25), months_y2_targets, pro_y2_pts))
    ent_active_base = ent_baseline + list(np.interp(range(13, 25), months_y2_targets, ent_y2_pts))

    # Derive all 24 months gross adds based on baseline
    starter_adds = derive_gross_adds(starter_active_base, base_churn_starter)
    pro_adds = derive_gross_adds(pro_active_base, base_churn_pro)
    ent_adds = derive_gross_adds(ent_active_base, base_churn_ent)

    # OpEx from pro forma:
    # Months 1-12 OpEx: [85, 87, 88, 94, 97, 99, 104, 107, 109, 111, 114, 115] k$
    # Year 2 OpEx: Q1=680k ($226.7k/mo), Q2=810k ($270k/mo), Q3=890k ($296.7k/mo), Q4=950k ($316.7k/mo)
    opex_y1 = [85000, 87000, 88000, 94000, 97000, 99000, 104000, 107000, 109000, 111000, 114000, 115000]
    opex_y2 = (
        [680000/3]*3 +
        [810000/3]*3 +
        [890000/3]*3 +
        [950000/3]*3
    )
    opex_all = opex_y1 + opex_y2

    # Working capital & capex adjustment per month from pro forma:
    # Y1 WC + Capex net = FCF - EBITDA. Let's get net monthly non-operating cash:
    wc_capex_y1 = [
        2000-1000, 3500-1000, 5000-1200, 7000-1500, 8500-1500, 10000-1500,
        11500-1600, 13000-1600, 14000-1800, 13000-1800, 13500-2100, 14000-2200
    ]
    # Y2 quarterly WC & Capex:
    # Q1: +35k -8k = +27k ($9k/mo)
    # Q2: +45k -10k = +35k ($11.7k/mo)
    # Q3: +50k -11k = +39k ($13k/mo)
    # Q4: +55k -11.5k = +43.5k ($14.5k/mo)
    wc_capex_y2 = [9000]*3 + [11667]*3 + [13000]*3 + [14500]*3
    wc_capex_all = wc_capex_y1 + wc_capex_y2

    def simulate(starter_churn, pro_churn, ent_churn, name="Scenario"):
        cash = 1750000.0  # Seed round
        min_cash = cash
        min_month = 0
        breakeven_month = None
        
        starter_act = 0.0
        pro_act = 0.0
        ent_act = 0.0

        history = []

        for m in range(24):
            # Apply churn from previous month
            starter_act = starter_act * (1.0 - starter_churn) + starter_adds[m]
            pro_act = pro_act * (1.0 - pro_churn) + pro_adds[m]
            ent_act = ent_act * (1.0 - ent_churn) + ent_adds[m]

            # Monthly Recurring Revenue (MRR)
            mrr = starter_act * 39.0 + pro_act * 99.0 + ent_act * 750.0  # $750 in Y1, ramps to $850 in Y2
            if m >= 12:
                mrr = starter_act * 39.0 + pro_act * 99.0 + ent_act * 850.0

            # Direct COGS:
            # Starter: $3.924, Pro: $8.30, Ent: $110.50
            # Plus payment processing 2.9% + $0.30
            cogs = starter_act * 3.924 + pro_act * 8.30 + ent_act * 110.50 + mrr * 0.03
            gross_profit = mrr - cogs
            gross_margin = gross_profit / mrr if mrr > 0 else 0

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
                "starter": starter_act,
                "pro": pro_act,
                "ent": ent_act,
                "total_users": starter_act + pro_act + ent_act,
                "mrr": mrr,
                "arr": mrr * 12,
                "cogs": cogs,
                "gp": gross_profit,
                "gm": gross_margin,
                "opex": opex,
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
            "ending_users_y1": history[11]["total_users"],
            "ending_users_y2": history[23]["total_users"],
            "breakeven_month": breakeven_month,
            "history": history
        }

    # Run Baseline
    base_res = simulate(base_churn_starter, base_churn_pro, base_churn_ent, "Baseline Model")
    
    # Run Adversarial Churn Spike:
    # Newbie: 10.0% / month (nearly double 5.5%)
    # Indie Hacker: 5.0% / month (more than double 2.2%)
    # Enterprise: 0.75%
    shock_res = simulate(0.10, 0.05, 0.0075, "Adverse Churn Spike (10% Starter / 5% Pro)")

    # Run Extreme Churn Spike:
    # Newbie: 15.0%, Indie: 7.5%, Enterprise: 1.5%
    extreme_res = simulate(0.15, 0.075, 0.015, "Catastrophic Churn Shock (15% Starter / 7.5% Pro)")

    print("=" * 80)
    print("SCENARIO 2: CHURN SHOCK SIMULATION RESULTS (YEAR 1 & 2)")
    print("=" * 80)
    for res in [base_res, shock_res, extreme_res]:
        print(f"\n--- {res['name']} ---")
        print(f"  Y1 Ending Customers: {res['ending_users_y1']:.0f} (ARR: ${res['ending_arr_y1']:,.0f})")
        print(f"  Y2 Ending Customers: {res['ending_users_y2']:.0f} (ARR: ${res['ending_arr_y2']:,.0f})")
        print(f"  Cash Flow Breakeven: Month {res['breakeven_month']}")
        print(f"  Minimum Cash Balance: ${res['min_cash']:,.0f} (at Month {res['min_month']})")
        print(f"  Y1 Ending Cash: ${res['ending_cash_y1']:,.0f}")
        print(f"  Y2 Ending Cash: ${res['ending_cash_y2']:,.0f}")
        survives = "SURVIVES (Solvent)" if res['min_cash'] > 0 else "INSOLVENT (Depleted Runway)"
        print(f"  Solvency Status: {survives}")

    # Print month-by-month cash trajectory around trough for Adverse Churn Spike
    print("\n" + "-" * 80)
    print("ADVERSE CHURN SPIKE: MONTH-BY-MONTH CASH & FCF (Months 8 to 20):")
    print("-" * 80)
    print("Month | Active Cust | MRR ($)   | OpEx ($)  | EBITDA ($) | FCF ($)    | Cash Balance ($)")
    for row in shock_res["history"][7:20]:
        print(f"{row['month']:5d} | {row['total_users']:11.0f} | {row['mrr']:9,.0f} | {row['opex']:9,.0f} | {row['ebitda']:10,.0f} | {row['fcf']:10,.0f} | {row['cash']:16,.0f}")

if __name__ == "__main__":
    run_churn_simulation()
