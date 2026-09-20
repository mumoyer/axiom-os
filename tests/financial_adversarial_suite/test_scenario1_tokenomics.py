"""
Scenario 1: Smart Model Routing Tokenomics, Inflation & Prompt Caching Miss Rate Stress Test
Evaluates whether gross margin drops below 80% under:
- Token price inflation (+20%, +50%, +100%)
- Prompt caching miss rate degradation (from baseline ~76-85% hit rate down to 50% hit rate, and 0% hit rate)
- Maximum contract quota utilization vs Realized blended usage
"""

import sys

def calculate_inference_cogs(sonnet_fresh_price=3.00, sonnet_cached_price=0.30, sonnet_out_price=15.00,
                             deepseek_in_price=0.55, deepseek_out_price=2.19,
                             mini_in_price=0.15, mini_out_price=0.60,
                             sonnet_cache_hit_ratio=None,
                             inflation_multiplier=1.0):
    # Scale prices by inflation multiplier if applied to external API prices
    sonnet_fresh = sonnet_fresh_price * inflation_multiplier
    sonnet_cached = sonnet_cached_price * inflation_multiplier
    sonnet_out = sonnet_out_price * inflation_multiplier
    deepseek_in = deepseek_in_price * inflation_multiplier
    deepseek_out = deepseek_out_price * inflation_multiplier
    mini_in = mini_in_price * inflation_multiplier
    mini_out = mini_out_price * inflation_multiplier

    # Baseline token counts per stage:
    # Stage 1: Validation Grader (DeepSeek R1 / Mini)
    p1_cost = (25.0 * deepseek_in + 3.5 * deepseek_out) / 1000.0

    # Total Sonnet input across Stage 2, 3, 4:
    # Phase 2: Fresh 10k, Cached 30k, Out 8k (Total in: 40k)
    # Phase 3: Fresh 40k, Cached 140k, Out 35k (Total in: 180k)
    # Phase 4: Fresh 15k, Cached 35k, Out 12k (Total in: 50k)
    # Total Sonnet: Fresh 65k, Cached 205k (Total input: 270k), Out 55k.
    
    if sonnet_cache_hit_ratio is not None:
        total_sonnet_in = 270.0
        cached_sonnet_in = total_sonnet_in * sonnet_cache_hit_ratio
        fresh_sonnet_in = total_sonnet_in * (1.0 - sonnet_cache_hit_ratio)
    else:
        # Baseline
        fresh_sonnet_in = 65.0
        cached_sonnet_in = 205.0

    sonnet_in_cost = (fresh_sonnet_in * sonnet_fresh + cached_sonnet_in * sonnet_cached) / 1000.0
    sonnet_out_cost = (55.0 * sonnet_out) / 1000.0
    sonnet_total_cost = sonnet_in_cost + sonnet_out_cost

    # Stage 5: Self-Healing Buffer (DeepSeek R1 + Sonnet: 25k fresh, 25k cached, 5k out)
    # Baseline cost in doc = $0.1070
    p5_cost = 0.1070 * inflation_multiplier

    # Stage 6: GTM Kit (Mini: 20k in, 8k out)
    p6_cost = (20.0 * mini_in + 8.0 * mini_out) / 1000.0

    # Stage 7: AST local
    p7_cost = 0.0050

    # Contingency
    contingency = 0.0200 * inflation_multiplier

    inference_cogs = p1_cost + sonnet_total_cost + p5_cost + p6_cost + p7_cost + contingency
    return inference_cogs

def calculate_venture_cogs(inference_cogs, container_cost=0.0540, runner_cost=0.1333):
    return inference_cogs + container_cost + runner_cost

def calculate_tier_margins(venture_cogs, iter_cogs=0.15):
    # Tier 1: Starter ($39/mo)
    # Max: 3 ventures, 10 iterations, $0.45 fixed
    starter_max_cogs = 3 * venture_cogs + 10 * iter_cogs + 0.45
    starter_max_margin = (39.0 - starter_max_cogs) / 39.0

    # Blended: 1.8 ventures, 6 iterations, $0.45 fixed
    starter_blended_cogs = 1.8 * venture_cogs + 6 * iter_cogs + 0.45
    starter_blended_margin = (39.0 - starter_blended_cogs) / 39.0

    # Tier 2: Pro Builder ($99/mo)
    # Max (no BYOK): 10 ventures, 40 iterations, $0.75 fixed
    pro_max_cogs = 10 * venture_cogs + 40 * iter_cogs + 0.75
    pro_max_margin = (99.0 - pro_max_cogs) / 99.0

    # Blended (35% BYOK):
    # 5.2 ventures, 22 iterations.
    # 65% of runs incur inference token cost; 100% incur container + runner ($0.1873) + fixed ($0.75)
    container_runner_per_venture = 0.0540 + 0.1333
    iter_infra = 0.03
    iter_token = 0.12
    pro_blended_cogs = (
        0.65 * (5.2 * (venture_cogs - container_runner_per_venture) + 22 * iter_token) +
        (5.2 * container_runner_per_venture + 22 * iter_infra + 0.75)
    )
    pro_blended_margin = (99.0 - pro_blended_cogs) / 99.0

    # Tier 3: Enterprise Studio ($850 blended)
    # 30 ventures, 110 iterations, $25 fixed
    # Assuming 10% BYOK
    ent_cogs = 0.90 * (30 * (venture_cogs - container_runner_per_venture) + 110 * 0.12) + (30 * container_runner_per_venture + 110 * 0.03 + 25.0)
    ent_margin = (850.0 - ent_cogs) / 850.0

    return {
        "starter_max_margin": starter_max_margin * 100,
        "starter_blended_margin": starter_blended_margin * 100,
        "pro_max_margin": pro_max_margin * 100,
        "pro_blended_margin": pro_blended_margin * 100,
        "ent_margin": ent_margin * 100,
        "venture_cogs": venture_cogs
    }

def run_all_stress_scenarios():
    print("=" * 80)
    print("SCENARIO 1: TOKENOMICS, INFLATION & PROMPT CACHING SENSITIVITY TEST")
    print("=" * 80)

    # 1. Baseline
    base_inf = calculate_inference_cogs()
    base_venture = calculate_venture_cogs(base_inf)
    base_margins = calculate_tier_margins(base_venture)
    print(f"BASELINE: Inference COGS: ${base_inf:.4f}, Total Venture COGS: ${base_venture:.4f}")
    print(f"  Starter (Blended): {base_margins['starter_blended_margin']:.2f}% (Max: {base_margins['starter_max_margin']:.2f}%)")
    print(f"  Pro Builder (Blended): {base_margins['pro_blended_margin']:.2f}% (Max: {base_margins['pro_max_margin']:.2f}%)")
    print(f"  Enterprise (Blended): {base_margins['ent_margin']:.2f}%")

    # 2. Token Price Inflation (+20%, +50%, +100%)
    for inf_pct in [20, 50, 100]:
        multiplier = 1.0 + inf_pct / 100.0
        inf_cogs = calculate_inference_cogs(inflation_multiplier=multiplier)
        vent_cogs = calculate_venture_cogs(inf_cogs)
        margins = calculate_tier_margins(vent_cogs, iter_cogs=0.15 * multiplier)
        print(f"\nINFLATION +{inf_pct}%: Inference COGS: ${inf_cogs:.4f}, Total Venture COGS: ${vent_cogs:.4f}")
        print(f"  Starter (Blended): {margins['starter_blended_margin']:.2f}% (Max: {margins['starter_max_margin']:.2f}%)")
        print(f"  Pro Builder (Blended): {margins['pro_blended_margin']:.2f}% (Max: {margins['pro_max_margin']:.2f}%)")
        print(f"  Enterprise (Blended): {margins['ent_margin']:.2f}%")

    # 3. Prompt Caching Miss Rate Degradation
    # Baseline cache hit ratio: 205k / 270k = 75.926%
    # Test: 50% cache hit ratio (50% miss), 25% cache hit ratio (75% miss), 0% cache hit ratio (100% miss)
    for hit_rate in [0.7593, 0.50, 0.25, 0.00]:
        miss_rate = (1.0 - hit_rate) * 100
        inf_cogs = calculate_inference_cogs(sonnet_cache_hit_ratio=hit_rate)
        vent_cogs = calculate_venture_cogs(inf_cogs)
        margins = calculate_tier_margins(vent_cogs)
        print(f"\nCACHE MISS RATE {miss_rate:.1f}% (Hit Rate {hit_rate*100:.1f}%):")
        print(f"  Inference COGS: ${inf_cogs:.4f}, Total Venture COGS: ${vent_cogs:.4f}")
        print(f"  Starter (Blended): {margins['starter_blended_margin']:.2f}% (Max: {margins['starter_max_margin']:.2f}%)")
        print(f"  Pro Builder (Blended): {margins['pro_blended_margin']:.2f}% (Max: {margins['pro_max_margin']:.2f}%)")
        print(f"  Enterprise (Blended): {margins['ent_margin']:.2f}%")

    # 4. Worst-case Compound: +50% Token Price Inflation AND 50% Prompt Caching Miss Rate
    comp_inf = calculate_inference_cogs(sonnet_cache_hit_ratio=0.50, inflation_multiplier=1.50)
    comp_vent = calculate_venture_cogs(comp_inf)
    comp_margins = calculate_tier_margins(comp_vent, iter_cogs=0.15 * 1.50)
    print("\n" + "#" * 80)
    print("COMPOUND STRESS: +50% TOKEN INFLATION & 50% PROMPT CACHE MISS RATE:")
    print(f"  Inference COGS: ${comp_inf:.4f}, Total Venture COGS: ${comp_vent:.4f}")
    print(f"  Starter (Blended): {comp_margins['starter_blended_margin']:.2f}% (Max: {comp_margins['starter_max_margin']:.2f}%)")
    print(f"  Pro Builder (Blended): {comp_margins['pro_blended_margin']:.2f}% (Max: {comp_margins['pro_max_margin']:.2f}%)")
    print(f"  Enterprise (Blended): {comp_margins['ent_margin']:.2f}%")
    print("#" * 80)

if __name__ == "__main__":
    run_all_stress_scenarios()
