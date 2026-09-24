/**
 * Bug Feedback & Tester Incentive Routes
 * 
 * Endpoints:
 * - GET   /api/feedback/config    - Public bug bounty rewards, terms, and encouragement
 * - POST  /api/feedback/bug       - Submit bug report, calculate reward tier, dispatch real-time alert
 * - GET   /api/feedback/bugs      - Admin-only list of all submitted bug reports (from durable feedbackStore)
 * - PATCH /api/feedback/bugs/:id  - Admin-only update status, verify bug, and officially credit bounty reward
 */

import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification_service.js';
import { BETA_CONFIG } from '../../shared/pricing.js';
import { feedbackStore, BugReportRecord } from '../services/feedback_store.js';

export type BugReport = BugReportRecord;

export const feedbackRoutes = Router();

function checkAdminAuth(req: Request): boolean {
  const adminKey = req.headers['x-admin-key'] as string;
  const authHeader = req.headers.authorization || '';
  const expectedAdminKey =
    process.env.ADMIN_API_KEY || (process.env.NODE_ENV === 'production' ? '' : 'stagegate_admin_key_2026');

  if (!expectedAdminKey) return false; // Fail closed if ADMIN_API_KEY is not configured in production
  if (adminKey && adminKey === expectedAdminKey) return true;
  if (authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === expectedAdminKey) return true;
  return false;
}

// GET /api/feedback/config
feedbackRoutes.get('/config', (_req: Request, res: Response) => {
  res.json({
    beta: BETA_CONFIG,
    bugBounty: BETA_CONFIG.bugBounty,
    encouragement: BETA_CONFIG.bugBounty.encouragement,
    promise: BETA_CONFIG.bugBounty.promise,
  });
});

// POST /api/feedback/bug
feedbackRoutes.post('/bug', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category = 'other',
      severity = 'functional',
      reporterEmail,
      ventureId,
      url,
      systemInfo,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'Title is required (minimum 3 characters)' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      return res.status(400).json({ error: 'Description is required (minimum 5 characters)' });
    }

    const report = await feedbackStore.createReport({
      title,
      description,
      category,
      severity,
      reporterEmail,
      ventureId,
      url,
      systemInfo: typeof systemInfo === 'object' ? systemInfo : undefined,
    });

    // Dispatch real-time notification to Google Chat / admin email
    notificationService
      .dispatchAlert({
        type: 'BUG_REPORT',
        bugId: report.id,
        title: report.title,
        category: report.category,
        severity: report.severity,
        description: report.description,
        reporterEmail: report.reporterEmail,
        ventureId: report.ventureId,
        url: report.url,
        bountyReward: report.bountyReward,
        timestamp: report.createdAt,
      })
      .catch((err) => console.warn('[Feedback] Notification dispatch warning:', err.message));

    res.status(201).json({
      success: true,
      bugId: report.id,
      bountyReward: report.bountyReward,
      message:
        'Thank you for reporting this issue! Your feedback helps make Stage Gate OS unbreakable. Our engineering team reviews all reports within 24 hours.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback/bugs (Admin Only)
feedbackRoutes.get('/bugs', async (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({
      error: 'Unauthorized: valid x-admin-key header is required to access bug reports',
    });
  }

  const { category, severity, status } = req.query;
  const bugs = await feedbackStore.getReports({
    category: category ? String(category) : undefined,
    severity: severity ? String(severity) : undefined,
    status: status ? String(status) : undefined,
  });

  res.json({
    count: bugs.length,
    bugs,
  });
});

// PATCH /api/feedback/bugs/:id (Admin Only)
feedbackRoutes.patch('/bugs/:id', async (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({
      error: 'Unauthorized: valid x-admin-key header is required to triage bug reports',
    });
  }

  const id = String(req.params.id);
  const { status, verifiedBountyCredit, adminNotes, reviewedBy } = req.body;

  if (!status || !['open', 'triaged', 'rewarded', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required: open, triaged, rewarded, resolved' });
  }

  const updated = await feedbackStore.updateReportStatus(id, {
    status,
    verifiedBountyCredit,
    adminNotes,
    reviewedBy: reviewedBy || 'jason@moyervllc.com',
  });

  if (!updated) {
    return res.status(404).json({ error: `Bug report ${id} not found` });
  }

  res.json({
    success: true,
    bug: updated,
  });
});
