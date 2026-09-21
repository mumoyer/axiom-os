/**
 * Empirical Test Suite for marketing/poas_marketing_plan.json
 * Verification of programmatic integrity, schema compliance, and ingestion readiness.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.resolve(__dirname, '../../marketing/poas_marketing_plan.json');

describe('Marketing Plan JSON Empirical Schema & Ingestion Suite', () => {
  let rawContent: string;
  let data: any;

  it('1. Syntax & Parse Test: file exists and parses cleanly as valid JSON', () => {
    assert.ok(fs.existsSync(jsonPath), `File not found at ${jsonPath}`);
    rawContent = fs.readFileSync(jsonPath, 'utf8');
    assert.ok(rawContent.length > 50000, `JSON file too small (${rawContent.length} bytes)`);
    assert.doesNotThrow(() => {
      data = JSON.parse(rawContent);
    }, 'JSON.parse threw an exception');
    assert.equal(typeof data, 'object');
    assert.notEqual(data, null);
  });

  describe('2. Structural Completeness Test: 12 Core Keys', () => {
    const coreKeys = [
      'schema_version',
      'metadata',
      'competitive_teardown',
      'brand_positioning',
      'personas',
      'gtm_architecture',
      'viral_engine',
      'paid_acquisition',
      'lifecycle_email',
      'content_calendar',
      'tracking_parameters',
      'kpis_and_unit_economics',
    ];

    it('asserts all 12 core keys exist, are non-empty, and correctly typed', () => {
      for (const key of coreKeys) {
        assert.ok(key in data, `Missing required core key: "${key}"`);
        const val = data[key];
        assert.notEqual(val, null, `Core key "${key}" is null`);
        if (typeof val === 'string') {
          assert.ok(val.trim().length > 0, `Core key "${key}" is empty string`);
        } else if (Array.isArray(val)) {
          assert.ok(val.length > 0, `Core key "${key}" is an empty array`);
        } else if (typeof val === 'object') {
          assert.ok(Object.keys(val).length > 0, `Core key "${key}" is an empty object`);
        }
      }
    });

    it('2.1 personas contains all 3 required personas with complete profiles', () => {
      assert.ok(Array.isArray(data.personas), 'personas should be an array');
      assert.equal(data.personas.length, 3, 'personas array must have 3 items');

      const expectedPersonas = [
        'aspiring_founder',
        'serial_indie_hacker',
        'corporate_innovation_studio',
      ];

      for (const exp of expectedPersonas) {
        const match = data.personas.find((p: any) =>
          p.persona_id?.toLowerCase().includes(exp)
        );
        assert.ok(match, `Missing persona: ${exp}`);
        assert.ok(match.name, `Persona ${exp} missing name`);
        assert.ok(match.icp_definition, `Persona ${exp} missing icp_definition`);
        assert.ok(match.core_pain_points?.length > 0, `Persona ${exp} missing pain points`);
        assert.ok(match.value_proposition, `Persona ${exp} missing value_proposition`);
        assert.ok(match.complete_copy_scripts, `Persona ${exp} missing copy scripts`);
        assert.ok(match.objection_handling_matrix?.length >= 4, `Persona ${exp} needs >= 4 objection handlers`);
      }
    });

    it('2.2 gtm_architecture contains 30, 60, 90 day milestones and budget allocation', () => {
      const gtm = data.gtm_architecture;
      assert.ok(gtm, 'gtm_architecture must exist');
      
      const milestones = gtm.milestones_30_60_90;
      assert.ok(milestones, 'milestones_30_60_90 must exist');
      assert.ok(milestones.days_1_30, 'days_1_30 (30_day milestone) must exist');
      assert.ok(milestones.days_31_60, 'days_31_60 (60_day milestone) must exist');
      assert.ok(milestones.days_61_90, 'days_61_90 (90_day milestone) must exist');

      const budget = gtm.budget_allocation_models;
      assert.ok(budget, 'budget_allocation_models must exist');
      assert.ok(budget.month_1_10k, 'Month 1 budget model must exist');
      assert.ok(budget.month_2_25k, 'Month 2 budget model must exist');
      assert.ok(budget.month_3_50k, 'Month 3 budget model must exist');
    });

    it('2.3 viral_engine contains vvg_lead_magnet, open_source_cli, badge_loop, programmatic_teardowns', () => {
      const ve = data.viral_engine;
      assert.ok(ve, 'viral_engine must exist');

      // VVG lead magnet
      assert.ok(ve.venture_validation_grader, 'venture_validation_grader must exist');
      assert.ok(ve.venture_validation_grader.scoring_model_4_factors, 'VVG scoring model 4 factors must exist');
      assert.ok(ve.venture_validation_grader.lead_magnet_mechanics, 'VVG lead magnet mechanics must exist');

      // Open source CLI
      assert.ok(ve.open_source_cli_distribution, 'open_source_cli_distribution must exist');
      assert.ok(Array.isArray(ve.open_source_cli_distribution.terminal_workflow_commands), 'terminal_workflow_commands must be an array');
      assert.ok(ve.open_source_cli_distribution.terminal_workflow_commands.length >= 3, 'Must have >= 3 terminal commands');

      // Badge loop
      assert.ok(ve.viral_code_ejection_and_badge_loop, 'viral_code_ejection_and_badge_loop must exist');
      assert.ok(ve.viral_code_ejection_and_badge_loop.mathematical_k_factor_derivation, 'mathematical_k_factor_derivation must exist');
      assert.ok(ve.viral_code_ejection_and_badge_loop.readme_badge_specification, 'readme_badge_specification must exist');

      // Programmatic teardowns
      assert.ok(Array.isArray(ve.programmatic_teardown_case_studies), 'programmatic_teardown_case_studies must be an array');
      assert.ok(ve.programmatic_teardown_case_studies.length >= 3, 'Teardowns array must have >= 3 cases');
      for (const caseStudy of ve.programmatic_teardown_case_studies) {
        assert.ok(caseStudy.title, 'Case study missing title');
        assert.ok(caseStudy.slug, 'Case study missing slug');
        assert.ok(caseStudy.target_keywords, 'Case study missing target_keywords');
      }
    });

    it('2.4 paid_acquisition contains google_search, meta_ads, x_ads, negative_keywords', () => {
      const pa = data.paid_acquisition;
      assert.ok(pa, 'paid_acquisition must exist');

      const campaigns = pa.campaigns;
      assert.ok(Array.isArray(campaigns), 'campaigns must be an array');
      assert.equal(campaigns.length, 3, 'campaigns array must have 3 platforms');

      const googleCampaign = campaigns.find((c: any) => c.channel === 'GOOGLE_SEARCH_PMAX');
      assert.ok(googleCampaign, 'Google Search campaign must exist');
      assert.ok(googleCampaign.keywords, 'Google keywords must exist');
      assert.ok(googleCampaign.ad_copy_variants?.length > 0, 'Google ad copy variants must exist');

      const metaCampaign = campaigns.find((c: any) => c.channel === 'META_ADS');
      assert.ok(metaCampaign, 'Meta Ads campaign must exist');
      assert.ok(metaCampaign.ad_copy_variants?.length > 0, 'Meta ad copy variants must exist');

      const xCampaign = campaigns.find((c: any) => c.channel === 'X_TWITTER_ADS');
      assert.ok(xCampaign, 'X / Twitter Ads campaign must exist');
      assert.ok(xCampaign.ad_copy_variants?.length > 0, 'X ad copy variants must exist');

      // Negative keywords
      assert.ok(pa.negative_keyword_registry, 'negative_keyword_registry must exist');
      const totalNegatives = Object.values(pa.negative_keyword_registry)
        .filter(Array.isArray)
        .reduce((sum: number, arr: any) => sum + arr.length, 0);
      assert.ok(totalNegatives >= 15, `Expected >= 15 negative keywords across clusters, found ${totalNegatives}`);
    });

    it('2.5 lifecycle_email contains onboarding_drip with 7 stages, churn_mitigation, regression_upsell', () => {
      const le = data.lifecycle_email;
      assert.ok(le, 'lifecycle_email must exist');

      const drip = le.drip_onboarding_sequence_7_part;
      assert.ok(Array.isArray(drip), 'drip_onboarding_sequence_7_part must be an array');
      assert.equal(drip.length, 7, 'Onboarding drip must contain exactly 7 email stages');
      for (let i = 0; i < 7; i++) {
        assert.equal(drip[i].step_number, i + 1, `Email stage ${i + 1} has incorrect step_number`);
        assert.ok(drip[i].subject_line, `Email stage ${i + 1} missing subject_line`);
        assert.ok(drip[i].email_body, `Email stage ${i + 1} missing email_body`);
        assert.ok(drip[i].primary_cta, `Email stage ${i + 1} missing primary_cta`);
      }

      assert.ok(Array.isArray(le.churn_mitigation_triggers), 'churn_mitigation_triggers must be an array');
      assert.ok(le.churn_mitigation_triggers.length >= 3, 'Must have >= 3 churn mitigation triggers');

      assert.ok(le.post_ejection_regression_monitoring_upsell, 'post_ejection_regression_monitoring_upsell must exist');
      assert.equal(le.post_ejection_regression_monitoring_upsell.monthly_fee_usd, 19);
    });

    it('2.6 content_calendar contains 12-week calendar items with complete entries', () => {
      const cc = data.content_calendar;
      assert.ok(cc, 'content_calendar must exist');
      assert.equal(cc.duration_weeks, 12, 'duration_weeks must be 12');

      const schedule = cc.schedule;
      assert.ok(Array.isArray(schedule), 'schedule must be an array');
      assert.equal(schedule.length, 12, 'schedule must contain 12 weekly entries');

      for (let w = 1; w <= 12; w++) {
        const entry = schedule.find((s: any) => s.week === w);
        assert.ok(entry, `Schedule missing week ${w}`);
        assert.ok(entry.theme, `Week ${w} missing theme`);
        assert.ok(Array.isArray(entry.content_items), `Week ${w} content_items must be an array`);
        assert.ok(entry.content_items.length > 0, `Week ${w} content_items must not be empty`);
      }
    });

    it('2.7 tracking_parameters contains utm_taxonomy and event_tracking', () => {
      const tp = data.tracking_parameters;
      assert.ok(tp, 'tracking_parameters must exist');

      assert.ok(tp.universal_utm_taxonomy, 'universal_utm_taxonomy must exist');
      assert.ok(tp.universal_utm_taxonomy.utm_source_map, 'utm_source_map must exist');
      assert.ok(tp.universal_utm_taxonomy.utm_medium_map, 'utm_medium_map must exist');

      const events = tp.custom_event_tracking_architecture;
      assert.ok(Array.isArray(events), 'custom_event_tracking_architecture must be an array');
      assert.ok(events.length >= 9, 'Must have >= 9 custom tracked events');
    });

    it('2.8 kpis_and_unit_economics contains unit_economics and targets', () => {
      const kpi = data.kpis_and_unit_economics;
      assert.ok(kpi, 'kpis_and_unit_economics must exist');

      assert.ok(kpi.scorecard, 'scorecard (KPI targets) must exist');
      assert.ok(kpi.scorecard.acquisition_kpis, 'acquisition_kpis must exist');
      assert.ok(kpi.scorecard.financial_unit_economics, 'financial_unit_economics must exist');

      assert.ok(kpi.pro_forma_financial_reconciliation, 'pro_forma_financial_reconciliation must exist');
      assert.ok(kpi.pro_forma_financial_reconciliation.year_1, 'year_1 pro forma must exist');
      assert.ok(kpi.pro_forma_financial_reconciliation.year_2, 'year_2 pro forma must exist');
      assert.ok(kpi.pro_forma_financial_reconciliation.year_3, 'year_3 pro forma must exist');
    });
  });

  describe('3. Stub & Placeholder Check', () => {
    it('recursively asserts zero TODO, FIXME, [TBD], Lorem ipsum, empty strings, empty arrays, or nulls', () => {
      const issues: Array<{ path: string; kind: string; detail: any }> = [];

      function walk(node: any, currentPath: string) {
        if (node === null || node === undefined) {
          issues.push({ path: currentPath, kind: 'NULL_OR_UNDEFINED', detail: node });
          return;
        }

        if (typeof node === 'string') {
          if (node.trim() === '') {
            issues.push({ path: currentPath, kind: 'EMPTY_STRING', detail: node });
          }
          if (node.includes('TODO')) {
            issues.push({ path: currentPath, kind: 'TOKEN_TODO', detail: node });
          }
          if (node.includes('FIXME')) {
            issues.push({ path: currentPath, kind: 'TOKEN_FIXME', detail: node });
          }
          if (node.includes('[TBD]')) {
            issues.push({ path: currentPath, kind: 'TOKEN_[TBD]', detail: node });
          }
          if (/lorem\s+ipsum/i.test(node)) {
            issues.push({ path: currentPath, kind: 'TOKEN_LOREM_IPSUM', detail: node });
          }
          // Note on 'placeholder': Ensure no dummy values (e.g. 'placeholder_text')
          // Legitimate reference: 'whsec_placeholder' as forensic citation of competitor failure mode
          if (/placeholder/i.test(node) && !node.includes('whsec_placeholder')) {
            issues.push({ path: currentPath, kind: 'TOKEN_PLACEHOLDER', detail: node });
          }
        } else if (Array.isArray(node)) {
          if (node.length === 0) {
            issues.push({ path: currentPath, kind: 'EMPTY_ARRAY', detail: node });
          }
          node.forEach((child, index) => {
            walk(child, `${currentPath}[${index}]`);
          });
        } else if (typeof node === 'object') {
          const keys = Object.keys(node);
          if (keys.length === 0) {
            issues.push({ path: currentPath, kind: 'EMPTY_OBJECT', detail: node });
          }
          for (const key of keys) {
            if (key.includes('TODO') || key.includes('FIXME') || key.includes('[TBD]')) {
              issues.push({ path: `${currentPath}.${key}`, kind: 'SUSPICIOUS_KEY', detail: key });
            }
            walk(node[key], `${currentPath}.${key}`);
          }
        }
      }

      walk(data, 'root');
      assert.deepEqual(issues, [], `Found stub/placeholder/empty elements: ${JSON.stringify(issues, null, 2)}`);
    });
  });
});
