/**
 * Deep Adversarial Schema & Ingestion Stress Test for marketing/poas_marketing_plan.json
 * Uses Zod to strictly validate data types, range bounds, array sequences, and ingestion accessors.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.resolve(__dirname, '../../marketing/poas_marketing_plan.json');

describe('Deep Adversarial Schema & Ingestion Stress Test', () => {
  const rawContent = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawContent);

  it('Adversarial 1: Strict Zod Validation of Metadata & Schema Version', () => {
    const MetadataSchema = z.object({
      schema_version: z.string().regex(/^\d+\.\d+\.\d+$/),
      metadata: z.object({
        project_name: z.string().min(3),
        engine_target: z.string().min(3),
        timestamp: z.string().datetime(),
        description: z.string().min(10),
        author: z.string().min(3),
        classification: z.string().min(3),
      }),
    });

    const parsed = MetadataSchema.safeParse({
      schema_version: data.schema_version,
      metadata: data.metadata,
    });

    assert.ok(parsed.success, `Metadata validation failed: ${JSON.stringify(parsed.error?.issues)}`);
  });

  it('Adversarial 2: Strict Zod Validation of Personas', () => {
    const PersonaSchema = z.object({
      persona_id: z.string().min(3),
      name: z.string().min(3),
      subtitle: z.string().min(3),
      icp_definition: z.object({
        demographics: z.string().min(5),
        skills: z.string().min(5),
        budget: z.string().min(5),
        channels: z.string().min(5),
      }),
      core_pain_points: z.array(z.string().min(5)).min(3),
      value_proposition: z.string().min(10),
      messaging_vectors: z.array(
        z.object({
          vector_id: z.string().min(3),
          channel: z.string().min(3),
          headline: z.string().min(5),
          ad_copy: z.string().min(10),
          cta_text: z.string().min(3),
          cta_url: z.string().url(),
        })
      ).min(2),
      primary_hooks: z.array(z.string().min(5)).min(2),
      complete_copy_scripts: z.object({
        ad_copy_variants: z.array(z.any()).min(2),
        headline_variants: z.array(z.string().min(5)).min(3),
        cta_text_variants: z.array(z.string().min(3)).min(3),
        landing_page_hero_copy: z.record(z.any()),
      }),
      pricing_tier_assignment: z.object({
        tier_name: z.string().min(2),
        monthly_price_usd: z.number().positive(),
        annual_price_usd: z.number().positive(),
        effective_monthly_usd: z.number().positive(),
        target_cac_usd: z.number().positive(),
        projected_ltv_usd: z.number().positive(),
        ltv_to_cac_ratio: z.number().positive(),
        payback_period_months: z.number().positive(),
        monthly_churn_rate_percent: z.number().positive(),
      }),
      objection_handling_matrix: z.array(
        z.object({
          objection: z.string().min(5),
          root_skepticism: z.string().min(5),
          exact_counter_argument: z.string().min(5),
          architectural_evidence: z.string().min(5),
        })
      ).min(4),
    });

    const PersonasSchema = z.array(PersonaSchema).length(3);
    const parsed = PersonasSchema.safeParse(data.personas);
    assert.ok(parsed.success, `Personas validation failed: ${JSON.stringify(parsed.error?.issues)}`);

    // Verify pricing tiers match canonical pro forma: $69 Starter, $149 Pro, $999 Enterprise
    const starter = data.personas.find((p: any) => p.persona_id.includes('aspiring_founder'));
    const pro = data.personas.find((p: any) => p.persona_id.includes('serial_indie_hacker'));
    const enterprise = data.personas.find((p: any) => p.persona_id.includes('corporate_innovation_studio'));

    assert.equal(starter.pricing_tier_assignment.monthly_price_usd, 69);
    assert.equal(pro.pricing_tier_assignment.monthly_price_usd, 149);
    assert.equal(enterprise.pricing_tier_assignment.monthly_price_usd, 999);
  });

  it('Adversarial 3: Strict Sequence & Ordering of 12-Week Calendar', () => {
    const calendar = data.content_calendar;
    assert.equal(calendar.schedule.length, 12);

    for (let i = 0; i < 12; i++) {
      const item = calendar.schedule[i];
      assert.equal(item.week, i + 1, `Calendar item index ${i} has week ${item.week}, expected ${i + 1}`);
      assert.ok(item.theme.length > 5, `Week ${i + 1} has insufficient theme`);
      assert.ok(item.content_items.length >= 2, `Week ${i + 1} has fewer than 2 content items`);

      for (const ci of item.content_items) {
        assert.ok(ci.channel, `Week ${i + 1} item missing channel`);
        assert.ok(ci.title, `Week ${i + 1} item missing title`);
        assert.ok(ci.format, `Week ${i + 1} item missing format`);
        assert.ok(ci.goal, `Week ${i + 1} item missing goal`);
      }
    }
  });

  it('Adversarial 4: Strict Sequence & Temporal Monotonicity of 7-Part Email Drip', () => {
    const drip = data.lifecycle_email.drip_onboarding_sequence_7_part;
    assert.equal(drip.length, 7);

    for (let i = 0; i < 7; i++) {
      const stage = drip[i];
      assert.equal(stage.step_number, i + 1, `Email stage index ${i} has step_number ${stage.step_number}`);
      assert.ok(stage.timing.length > 3, `Email stage ${i + 1} missing timing`);
      assert.ok(stage.trigger.length > 3, `Email stage ${i + 1} missing trigger`);
      assert.ok(stage.subject_line.length > 5, `Email stage ${i + 1} subject line too short`);
      assert.ok(stage.email_body.length > 50, `Email stage ${i + 1} body too short (<50 chars)`);
      assert.ok(stage.primary_cta.text && stage.primary_cta.url, `Email stage ${i + 1} malformed CTA`);
    }
  });

  it('Adversarial 5: Financial Unit Economics & Pro Forma Mathematical Coherence', () => {
    const gtm = data.gtm_architecture.unit_economics_model;
    const proForma = data.kpis_and_unit_economics.pro_forma_financial_reconciliation;

    // Check blended ARPU is in the $59 - $119 range specified in original request
    assert.ok(gtm.blended_arpu_usd >= 59 && gtm.blended_arpu_usd <= 119, `Blended ARPU $${gtm.blended_arpu_usd} outside $59-$119 bounds`);

    // Check Gross Margin is > 80% as required by institutional pro forma across all 3 years
    assert.ok(gtm.realized_gross_margins.year_1 >= 80, 'Year 1 margin < 80%');
    assert.ok(gtm.realized_gross_margins.year_2 >= 80, 'Year 2 margin < 80%');
    assert.ok(gtm.realized_gross_margins.year_3 >= 80, 'Year 3 margin < 80%');

    // Check direct COGS per venture <= $2.00 ($1.43 baseline)
    assert.ok(gtm.direct_cogs_per_venture_usd <= 2.00, `COGS per venture $${gtm.direct_cogs_per_venture_usd} exceeds $2.00`);

    // Check Pro Forma ARR progression: Y1 < Y2 < Y3
    const y1Arr = proForma.year_1.ending_arr_usd;
    const y2Arr = proForma.year_2.ending_arr_usd;
    const y3Arr = proForma.year_3.ending_arr_usd;
    assert.ok(y1Arr > 1000000, `Year 1 ARR (${y1Arr}) should exceed $1M`);
    assert.ok(y2Arr > y1Arr * 3, `Year 2 ARR (${y2Arr}) should exhibit strong 3x+ growth over Y1 (${y1Arr})`);
    assert.ok(y3Arr > y2Arr * 2, `Year 3 ARR (${y3Arr}) should exhibit continuous expansion over Y2 (${y2Arr})`);
  });

  it('Adversarial 6: UTM Taxonomy & Custom Event Invariants', () => {
    const tp = data.tracking_parameters;
    const utm = tp.universal_utm_taxonomy;

    assert.ok(Object.keys(utm.utm_source_map).length >= 4, 'UTM source map should have >= 4 sources');
    assert.ok(Object.keys(utm.utm_medium_map).length >= 4, 'UTM medium map should have >= 4 mediums');
    assert.ok(utm.example_urls.length >= 3, 'Should have >= 3 example URLs');

    // Validate example URLs parse as valid URLs
    for (const urlStr of utm.example_urls) {
      assert.doesNotThrow(() => {
        const u = new URL(urlStr);
        assert.ok(u.searchParams.has('utm_source'), `URL ${urlStr} missing utm_source`);
        assert.ok(u.searchParams.has('utm_medium'), `URL ${urlStr} missing utm_medium`);
        assert.ok(u.searchParams.has('utm_campaign'), `URL ${urlStr} missing utm_campaign`);
      }, `Invalid URL format in example_urls: ${urlStr}`);
    }

    // Validate custom events
    const events = tp.custom_event_tracking_architecture;
    assert.ok(events.length >= 9, 'Should have >= 9 custom events');
    const requiredEvents = [
      'vvg_grader_started',
      'vvg_grader_calculated',
      'vvg_lead_captured',
      'cli_install_copied',
      'stage_gate_initiated',
      'stage_gate_passed',
      'stage_gate_refunded',
      'venture_ejected_git',
      'subscription_checkout_completed',
    ];
    for (const req of requiredEvents) {
      const match = events.find((e: any) => e.event_name === req);
      assert.ok(match, `Missing required telemetry event: ${req}`);
      assert.ok(match.trigger, `Event ${req} missing trigger`);
      assert.ok(Array.isArray(match.parameters) && match.parameters.length > 0, `Event ${req} missing parameters`);
    }
  });

  it('Adversarial 7: Ingestion Key Accessibility (Convenience Accessors)', () => {
    // Test that an ingestion engine can safely access all elements via standard lookup patterns
    const personasById: Record<string, any> = {};
    for (const p of data.personas) {
      personasById[p.persona_id] = p;
    }
    assert.ok(personasById['persona_1_aspiring_founder'], 'Lookup by persona_1_aspiring_founder failed');
    assert.ok(personasById['persona_2_serial_indie_hacker'], 'Lookup by persona_2_serial_indie_hacker failed');
    assert.ok(personasById['persona_3_corporate_innovation_studio'], 'Lookup by persona_3_corporate_innovation_studio failed');

    // Test GTM milestone access
    assert.ok(data.gtm_architecture.milestones_30_60_90.days_1_30.focus, 'GTM days 1-30 focus unreadable');
    assert.ok(data.gtm_architecture.milestones_30_60_90.days_31_60.focus, 'GTM days 31-60 focus unreadable');
    assert.ok(data.gtm_architecture.milestones_30_60_90.days_61_90.focus, 'GTM days 61-90 focus unreadable');

    // Test viral engine access
    assert.ok(data.viral_engine.venture_validation_grader.lead_magnet_mechanics.format, 'VVG format unreadable');
    assert.ok(data.viral_engine.viral_code_ejection_and_badge_loop.mathematical_k_factor_derivation.formula, 'K-factor formula unreadable');

    // Test paid acquisition access
    const campaignsByChannel: Record<string, any> = {};
    for (const c of data.paid_acquisition.campaigns) {
      campaignsByChannel[c.channel] = c;
    }
    assert.ok(campaignsByChannel['GOOGLE_SEARCH_PMAX'], 'Campaign GOOGLE_SEARCH_PMAX unreadable');
    assert.ok(campaignsByChannel['META_ADS'], 'Campaign META_ADS unreadable');
    assert.ok(campaignsByChannel['X_TWITTER_ADS'], 'Campaign X_TWITTER_ADS unreadable');
  });
});
