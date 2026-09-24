/**
 * Bug Feedback & Tester Incentive Routes
 * 
 * Endpoints:
 * - GET  /api/feedback/config - Public bug bounty rewards, terms, and encouragement
 * - POST /api/feedback/bug    - Submit bug report, calculate reward tier, dispatch real-time alert
 * - GET  /api/feedback/bugs   - Admin-only list of all submitted bug reports
 */

import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { notificationService } from '../services/notification_service.js';
import { BETA_CONFIG } from '../../shared/pricing.js';

export interface BugReport {
  id: string;
  title: string;
  description: string;
  category: 'stage_gate' | 'ui_ux' | 'checkout_billing' | 'deployment' | 'performance' | 'other' | string;
  severity: 'cosmetic' | 'functional' | 'blocking' | 'security' | string;
  reporterEmail?: string;
  ventureId?: string;
  url?: string;
  systemInfo?: {
    userAgent?: string;
    screenResolution?: string;
    [key: string]: any;
  };
  bountyReward: string;
  status: 'open' | 'triaged' | 'resolved';
  createdAt: string;
}

// In-memory store for submitted bug reports
export const bugReportsStore: BugReport[] = [];

export const feedbackRoutes = Router();

function checkAdminAuth(req: Request): boolean {
  const adminKey = req.headers['x-admin-key'] as string;
  const authHeader = req.headers.authorization || '';
  const expectedAdminKey = process.env.ADMIN_API_KEY || 'stagegate_admin_key_2026';

  if (adminKey && adminKey === expectedAdminKey) return true;
  if (authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === expectedAdminKey) return true;
  return false;
}

function resolveBountyReward(severity: string): string {
  const norm = (severity || '').toLowerCase();
  if (norm.includes('security') || norm.includes('data')) {
    return BETA_CONFIG.bugBounty.rewards.security;
  }
  if (norm.includes('block') || norm.includes('critical')) {
    return BETA_CONFIG.bugBounty.rewards.blocking;
  }
  if (norm.includes('function') || norm.includes('major')) {
    return BETA_CONFIG.bugBounty.rewards.functional;
  }
  return BETA_CONFIG.bugBounty.rewards.cosmetic;
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

    const bountyReward = resolveBountyReward(severity);
    const bugId = `bug_${randomUUID().slice(0, 8)}`;

    const report: BugReport = {
      id: bugId,
      title: title.trim(),
      description: description.trim(),
      category: String(category).trim(),
      severity: String(severity).trim().toLowerCase(),
      reporterEmail: reporterEmail ? String(reporterEmail).trim() : undefined,
      ventureId: ventureId ? String(ventureId).trim() : undefined,
      url: url ? String(url).trim() : undefined,
      systemInfo: typeof systemInfo === 'object' ? systemInfo : undefined,
      bountyReward,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    bugReportsStore.push(report);

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
feedbackRoutes.get('/bugs', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({
      error: 'Unauthorized: valid x-admin-key header is required to access bug reports',
    });
  }

  res.json({
    count: bugReportsStore.length,
    bugs: bugReportsStore,
  });
});
