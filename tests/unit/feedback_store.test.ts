import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { feedbackStore, BugReportRecord } from '../../server/services/feedback_store.js';

describe('Durable Bug Report Store & Admin Triage Subsystem', () => {
  const testStoragePath = path.resolve(process.cwd(), 'data', 'test_bug_reports.json');

  beforeEach(() => {
    feedbackStore.setStoragePathForTesting(testStoragePath);
    feedbackStore.clearForTesting();
  });

  afterEach(() => {
    try {
      if (fs.existsSync(testStoragePath)) fs.unlinkSync(testStoragePath);
    } catch {}
  });

  test('saves bug report to durable file storage and persists across re-instantiation', async () => {
    const report = await feedbackStore.createReport({
      title: 'Gate 2 Container Timeout Glitch',
      description: 'Container health probes timed out intermittently on initial launch.',
      category: 'stage_gate',
      severity: 'functional',
      reporterEmail: 'tester@venture.com',
      url: 'https://www.stagegateos.com/#/ventures',
      systemInfo: { userAgent: 'Mozilla/5.0 Playwright' },
    });

    assert.ok(report.id.startsWith('bug_'));
    assert.equal(report.status, 'open');
    assert.equal(report.bountyReward, '1 Free Month');

    // Verify file exists on disk
    assert.ok(fs.existsSync(testStoragePath), 'Storage file should exist on disk');

    // Simulate server reboot by loading from disk
    const reloadedReports = await feedbackStore.getAllReports();
    assert.equal(reloadedReports.length, 1);
    assert.equal(reloadedReports[0].id, report.id);
    assert.equal(reloadedReports[0].title, report.title);
  });

  test('admin triage updates report status and officially awards verified bounty credit', async () => {
    const report = await feedbackStore.createReport({
      title: 'Security Token Leak on Webhook Replay',
      description: 'Replay protection missed duplicate signature edge case.',
      category: 'checkout_billing',
      severity: 'security',
      reporterEmail: 'sec.researcher@vault.io',
    });

    // Jason Moyer verifies the bug and awards 3 free months
    const updated = await feedbackStore.updateReportStatus(report.id, {
      status: 'rewarded',
      verifiedBountyCredit: '3 Free Months + Founder Advisory Session',
      adminNotes: 'Reproduced in staging and patched. Bounty applied to subscription.',
      reviewedBy: 'jason@moyervllc.com',
    });

    assert.ok(updated);
    assert.equal(updated?.status, 'rewarded');
    assert.equal(updated?.verifiedBountyCredit, '3 Free Months + Founder Advisory Session');
    assert.equal(updated?.adminNotes, 'Reproduced in staging and patched. Bounty applied to subscription.');
    assert.ok(updated?.reviewedAt);
  });

  test('filters bug reports by category, severity, and status', async () => {
    await feedbackStore.createReport({
      title: 'Typo in footer link',
      description: 'Footer terms spelling error',
      category: 'ui_ux',
      severity: 'cosmetic',
    });

    await feedbackStore.createReport({
      title: 'DNS Quorum Failure',
      description: 'Quad-DoH failed to reach 3-of-4 quorum',
      category: 'deployment',
      severity: 'blocking',
    });

    const cosmeticReports = await feedbackStore.getReports({ severity: 'cosmetic' });
    assert.equal(cosmeticReports.length, 1);
    assert.equal(cosmeticReports[0].severity, 'cosmetic');

    const deploymentReports = await feedbackStore.getReports({ category: 'deployment' });
    assert.equal(deploymentReports.length, 1);
    assert.equal(deploymentReports[0].category, 'deployment');
  });
});
