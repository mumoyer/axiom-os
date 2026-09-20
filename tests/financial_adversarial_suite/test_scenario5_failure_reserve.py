"""
Scenario 5: Zero-Charge Failure Reserve Adequacy Simulation
Analyzes whether the $0.10/deployment reserve buffer is sufficient to absorb
self-healing failure retries across varying first-time failure rates and resolution probabilities.

Evaluates:
- Expected self-healing cost per deployment: E[Cost]
- Reserve adequacy margin: ($0.10 - E[Cost])
- Breakeven failure rate where E[Cost] = $0.10
- Monte Carlo simulation over 100,000 deployments to test tail risk
"""

import numpy as np

def run_failure_reserve_simulation():
    # Costs per attempt:
    # Attempt 1: DeepSeek R1 diagnostic + patch (~$0.035)
    # Attempt 2: Template component swap + re-test (~$0.040 + $0.05 runner = $0.090)
    # Attempt 3: Final diagnostic + rollback (~$0.045 + $0.05 runner = $0.095)
    # Total catastrophic worst-case cost across all 3 attempts = $0.32 (as cited in doc line 234)

    c1 = 0.035
    c2 = 0.090
    c3 = 0.095
    c_worst_case = 0.3200
    reserve_buffer = 0.1000

    # Probability of resolution at each attempt:
    # Attempt 1 resolves 65% of syntax/lint issues
    # Attempt 2 resolves 20% of remaining issues (template swap)
    # Attempt 3 resolves 10% or triggers graceful rollback
    r1 = 0.65
    r2 = 0.50
    r3 = 0.30

    def expected_cost_per_failure():
        # Tree:
        # Cost of attempt 1: c1 (always incurred if failure occurs)
        # Prob of attempt 2: (1 - r1)
        # Cost of attempt 2: c2
        # Prob of attempt 3: (1 - r1) * (1 - r2)
        # Cost of attempt 3: c3
        cost = c1 + (1 - r1) * c2 + (1 - r1) * (1 - r2) * c3
        return cost

    avg_cost_per_failure = expected_cost_per_failure()

    print("=" * 80)
    print("SCENARIO 5: ZERO-CHARGE FAILURE RESERVE ADEQUACY SIMULATION")
    print("=" * 80)
    print(f"Reserve Buffer Allocated per Deployment: ${reserve_buffer:.4f}")
    print(f"Average Computed Cost per Failure Event: ${avg_cost_per_failure:.4f}")
    print(f"Maximum Catastrophic Worst-Case Cost per Failure: ${c_worst_case:.4f}")
    print("-" * 80)

    # Test across failure rates: 7.6% (baseline), 15%, 25%, 35%, 50%
    failure_rates = [0.076, 0.150, 0.250, 0.3125, 0.400, 0.500]

    print(f"{'Failure Rate':14s} | {'1st-Time Pass':14s} | {'E[Cost] (Avg)':15s} | {'E[Cost] (Worst)':16s} | {'Reserve Status':16s}")
    print("-" * 80)

    for fr in failure_rates:
        e_avg = fr * avg_cost_per_failure
        e_worst = fr * c_worst_case
        pass_rate = (1.0 - fr) * 100
        
        status = "SUFFICIENT (Surplus)" if e_worst <= reserve_buffer else ("DEFICIT (Overrun)" if e_avg > reserve_buffer else "ADEQUATE on Avg")
        print(f"{fr*100:13.1f}% | {pass_rate:13.1f}% | ${e_avg:14.4f} | ${e_worst:15.4f} | {status:16s}")

    # Breakeven calculation:
    breakeven_worst = (reserve_buffer / c_worst_case) * 100
    breakeven_avg = (reserve_buffer / avg_cost_per_failure) * 100

    print("-" * 80)
    print(f"Breakeven First-Time Failure Rate (under worst-case $0.32 cost): {breakeven_worst:.2f}%")
    print(f"  -> Axiom OS reserve remains fully solvent as long as pass rate exceeds {100 - breakeven_worst:.2f}%!")
    print(f"Breakeven First-Time Failure Rate (under expected average failure cost): {breakeven_avg:.2f}%")
    print(f"  -> Average failure cost allows failure rate up to {breakeven_avg:.2f}% without exhausting the $0.10 reserve!")

    # Monte Carlo simulation of 100,000 deployments under baseline failure rate (7.6%):
    np.random.seed(42)
    n_sims = 100000
    is_failure = np.random.rand(n_sims) < 0.076
    costs = np.zeros(n_sims)
    
    # For failures, simulate attempts
    for i in range(n_sims):
        if is_failure[i]:
            # Attempt 1
            cost = c1
            if np.random.rand() > r1:
                # Attempt 2
                cost += c2
                if np.random.rand() > r2:
                    # Attempt 3
                    cost += c3
            costs[i] = cost

    sim_mean = np.mean(costs)
    sim_p95 = np.percentile(costs, 95)
    sim_p99 = np.percentile(costs, 99)
    total_absorbed = np.sum(costs)
    total_reserve = n_sims * reserve_buffer
    reserve_surplus = total_reserve - total_absorbed

    print("\n" + "-" * 80)
    print("MONTE CARLO RESULTS (100,000 DEPLOYMENTS AT 7.6% FAILURE RATE):")
    print("-" * 80)
    print(f"Mean Absorbed Cost per Deployment: ${sim_mean:.4f}")
    print(f"95th Percentile Cost per Deployment: ${sim_p95:.4f}")
    print(f"99th Percentile Cost per Deployment: ${sim_p99:.4f}")
    print(f"Total Reserve Collected ($0.10/dep): ${total_reserve:,.2f}")
    print(f"Total Self-Healing Absorbed:         ${total_absorbed:,.2f}")
    print(f"Net Reserve Pool Surplus:            ${reserve_surplus:,.2f} ({reserve_surplus/total_reserve*100:.1f}% buffer surplus)")

if __name__ == "__main__":
    run_failure_reserve_simulation()
