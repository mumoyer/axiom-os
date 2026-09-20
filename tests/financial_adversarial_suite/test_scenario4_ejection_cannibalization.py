"""
Scenario 4: Ejection Cannibalization Stress Test
Analyzes what happens if 40% of Indie Hackers who eject their code cancel their platform subscriptions.
Evaluates:
- Effective monthly churn rate for Pro Builder tier
- Impact on Pro Builder LTV, LTV/CAC ratio, and payback period
- Impact on Year 1 and Year 2 active Pro customers, ARR, and cash runway
- Sensitivity analysis across different cancellation rates among ejectors (0%, 10%, 20%, 40%, 60%)
- Analysis of the subscription retention moat
"""

import numpy as np

def run_ejection_cannibalization_analysis():
    # Baseline Pro Builder metrics from pro forma:
    arpu = 108.00  # $99 base + $9 overages
    cogs_pct = 0.19  # 19% variable COGS
    gross_margin = 0.81  # 81%
    cac = 140.00
    base_monthly_churn = 0.022  # 2.2%
    base_lifetime = 1.0 / base_monthly_churn  # 45.45 months
    base_ltv = base_lifetime * arpu * gross_margin  # $3,975.97

    ejection_rate = 0.85  # 85% of users eject code to GitHub

    # If fraction 'c' of ejectors cancel their subscription after average duration 't_eject' months
    # (e.g. they use it to build, eject in Month 1 or 2, and cancel):
    # Let's model effective churn rate:
    # A cohort of 100 users:
    # 85 eject. If fraction c cancel shortly after (say month 1 or 2),
    # then (0.85 * c) churn quickly, while the remaining churn at normal baseline rate.
    # We can model this as an blended hazard / monthly churn rate:
    # Over the first 12 months, what is the annualized churn and effective monthly churn?

    def calculate_cohort_ltv(cancel_prob_among_ejectors, avg_tenure_of_canceler=1.5):
        pct_canceling = ejection_rate * cancel_prob_among_ejectors
        pct_retaining = 1.0 - pct_canceling

        # For retainers: lifetime = 1 / base_monthly_churn (45.45 months)
        # For cancelers: lifetime = avg_tenure_of_canceler (e.g. 1.5 months)
        blended_lifetime = pct_retaining * base_lifetime + pct_canceling * avg_tenure_of_canceler
        blended_ltv = blended_lifetime * arpu * gross_margin
        ltv_cac = blended_ltv / cac
        effective_monthly_churn = 1.0 / blended_lifetime

        return {
            "cancel_prob": cancel_prob_among_ejectors * 100,
            "pct_total_users_canceling": pct_canceling * 100,
            "blended_lifetime": blended_lifetime,
            "effective_monthly_churn": effective_monthly_churn * 100,
            "blended_ltv": blended_ltv,
            "ltv_cac": ltv_cac,
            "payback_months": cac / (arpu * gross_margin)
        }

    cancellation_scenarios = [0.0, 0.10, 0.20, 0.40, 0.60]
    results = [calculate_cohort_ltv(c) for c in cancellation_scenarios]

    print("=" * 80)
    print("SCENARIO 4: EJECTION CANNIBALIZATION COHORT & UNIT ECONOMICS")
    print("=" * 80)
    print(f"{'Eject Cancel %':15s} | {'% Cohort Churn':15s} | {'Avg Life (mo)':14s} | {'Eff Monthly Churn':18s} | {'LTV ($)':10s} | {'LTV/CAC':8s}")
    print("-" * 80)
    for r in results:
        print(f"{r['cancel_prob']:14.1f}% | {r['pct_total_users_canceling']:14.1f}% | {r['blended_lifetime']:14.2f} | {r['effective_monthly_churn']:17.2f}% | ${r['blended_ltv']:8.2f} | {r['ltv_cac']:7.2f}x")

    # Now simulate the macro financial impact on Axiom OS over 24 months if 40% of Indie Hackers cancel
    # This corresponds to effective monthly churn of ~3.3% to 4.2% on the entire Pro tier
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

    # Pro base ramp
    pro_baseline = [10, 30, 56, 85, 125, 168, 220, 285, 356, 445, 545, 650]
    months_y2_targets = [12, 15, 18, 21, 24]
    pro_y2_pts = [650, 980, 1480, 2190, 3100]
    pro_base_all = pro_baseline + list(np.interp(range(13, 25), months_y2_targets, pro_y2_pts))
    starter_baseline = [40, 90, 160, 230, 310, 400, 500, 615, 740, 880, 1035, 1200]
    starter_y2_pts = [1200, 1850, 2650, 3700, 4800]
    starter_base_all = starter_baseline + list(np.interp(range(13, 25), months_y2_targets, starter_y2_pts))
    ent_baseline = [1, 2, 4, 6, 9, 12, 15, 19, 24, 30, 37, 45]
    ent_y2_pts = [45, 70, 120, 160, 210]
    ent_base_all = ent_baseline + list(np.interp(range(13, 25), months_y2_targets, ent_y2_pts))

    pro_adds = derive_gross_adds(pro_base_all, 0.022)

    # Simulate Pro tier active users under 40% ejection cancellation (effective churn = 3.28%)
    eff_churn = results[3]["effective_monthly_churn"] / 100.0  # 40% scenario

    pro_act_base = 0.0
    pro_act_cannibal = 0.0
    arr_loss_y1 = 0
    arr_loss_y2 = 0

    pro_cannibal_series = []
    for m in range(24):
        pro_act_cannibal = pro_act_cannibal * (1.0 - eff_churn) + pro_adds[m]
        pro_cannibal_series.append(pro_act_cannibal)

    print("\n" + "-" * 80)
    print("PRO BUILDER TIER TRAJECTORY: Baseline vs 40% Ejection Cannibalization")
    print("-" * 80)
    print(f"Year 1 Pro Customers: Baseline {pro_base_all[11]:.0f} vs Cannibalized {pro_cannibal_series[11]:.0f} (-{(1 - pro_cannibal_series[11]/pro_base_all[11])*100:.1f}%)")
    print(f"Year 1 Pro ARR:       Baseline ${pro_base_all[11]*108*12:,.0f} vs Cannibalized ${pro_cannibal_series[11]*108*12:,.0f}")
    print(f"Year 2 Pro Customers: Baseline {pro_base_all[23]:.0f} vs Cannibalized {pro_cannibal_series[23]:.0f} (-{(1 - pro_cannibal_series[23]/pro_base_all[23])*100:.1f}%)")
    print(f"Year 2 Pro ARR:       Baseline ${pro_base_all[23]*108*12:,.0f} vs Cannibalized ${pro_cannibal_series[23]*108*12:,.0f}")

    # Verify LTV/CAC viability:
    print(f"\nEven under 40% Ejection Cannibalization:")
    print(f"  - Pro Builder LTV remains ${results[3]['blended_ltv']:,.2f}")
    print(f"  - LTV/CAC ratio is {results[3]['ltv_cac']:.2f}x (vs SaaS industry benchmark of 3.0x)")
    print(f"  - CAC Payback period remains {results[3]['payback_months']:.2f} months (~49 days)")

if __name__ == "__main__":
    run_ejection_cannibalization_analysis()
