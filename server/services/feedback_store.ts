/**
 * Durable Bug Report Store & Admin Triage Subsystem
 * 
 * Persists bug reports to disk (data/bug_reports.json) so reports survive
 * container reboots and deployments, and enables admin triage and bounty crediting.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { BETA_CONFIG } from '../../shared/pricing.js';

export interface BugReportRecord {
  id: string;
  title: string;
  description: string;
  category: 'stage_gate' | 'ui_ux' | 'checkout_billing' | 'deployment' | 'performance' | 'other' | string;
  severity: 'cosmetic' | 'functional' | 'blocking' | 'security' | string;
  reporterEmail?: string;
  ventureId?: string;
  url?: string;
  systemInfo?: Record<string, any>;
  bountyReward: string;
  status: 'open' | 'triaged' | 'rewarded' | 'resolved';
  createdAt: string;
  verifiedBountyCredit?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export class FeedbackStore {
  private storagePath: string;
  private memoryCache: BugReportRecord[] = [];
  private isInitialized = false;

  constructor() {
    this.storagePath = path.resolve(process.cwd(), 'data', 'bug_reports.json');
  }

  public setStoragePathForTesting(customPath: string) {
    this.storagePath = customPath;
    this.isInitialized = false;
    this.memoryCache = [];
  }

  public clearForTesting() {
    this.memoryCache = [];
    try {
      if (fs.existsSync(this.storagePath)) {
        fs.unlinkSync(this.storagePath);
      }
    } catch {}
    this.isInitialized = true;
  }

  private ensureDirectory() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadFromDisk(): BugReportRecord[] {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err: any) {
      console.warn('[FeedbackStore] Failed to read bug reports from disk:', err.message);
    }
    return [];
  }

  private saveToDisk(): void {
    try {
      this.ensureDirectory();
      fs.writeFileSync(this.storagePath, JSON.stringify(this.memoryCache, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('[FeedbackStore] Failed to write bug reports to disk:', err.message);
    }
  }

  private init() {
    if (!this.isInitialized) {
      this.memoryCache = this.loadFromDisk();
      this.isInitialized = true;
    }
  }

  public resolveBountyReward(severity?: string): string {
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

  public async createReport(data: {
    title: string;
    description: string;
    category?: string;
    severity?: string;
    reporterEmail?: string;
    ventureId?: string;
    url?: string;
    systemInfo?: Record<string, any>;
  }): Promise<BugReportRecord> {
    this.init();

    const bountyReward = this.resolveBountyReward(data.severity);
    const bugId = `bug_${randomUUID().slice(0, 8)}`;

    const report: BugReportRecord = {
      id: bugId,
      title: data.title.trim(),
      description: data.description.trim(),
      category: (data.category || 'other').trim(),
      severity: (data.severity || 'functional').trim().toLowerCase(),
      reporterEmail: data.reporterEmail ? data.reporterEmail.trim() : undefined,
      ventureId: data.ventureId ? data.ventureId.trim() : undefined,
      url: data.url ? data.url.trim() : undefined,
      systemInfo: data.systemInfo,
      bountyReward,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    this.memoryCache.unshift(report);
    this.saveToDisk();

    return report;
  }

  public async getAllReports(): Promise<BugReportRecord[]> {
    this.memoryCache = this.loadFromDisk();
    this.isInitialized = true;
    return [...this.memoryCache];
  }

  public async getReports(filter?: {
    category?: string;
    severity?: string;
    status?: string;
  }): Promise<BugReportRecord[]> {
    const all = await this.getAllReports();
    if (!filter) return all;

    return all.filter((r) => {
      if (filter.category && r.category !== filter.category) return false;
      if (filter.severity && r.severity !== filter.severity) return false;
      if (filter.status && r.status !== filter.status) return false;
      return true;
    });
  }

  public async updateReportStatus(
    id: string,
    update: {
      status: 'open' | 'triaged' | 'rewarded' | 'resolved';
      verifiedBountyCredit?: string;
      adminNotes?: string;
      reviewedBy?: string;
    }
  ): Promise<BugReportRecord | null> {
    this.init();
    const index = this.memoryCache.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const existing = this.memoryCache[index];
    const updated: BugReportRecord = {
      ...existing,
      status: update.status,
      verifiedBountyCredit: update.verifiedBountyCredit ?? existing.verifiedBountyCredit,
      adminNotes: update.adminNotes ?? existing.adminNotes,
      reviewedBy: update.reviewedBy ?? existing.reviewedBy,
      reviewedAt: new Date().toISOString(),
    };

    this.memoryCache[index] = updated;
    this.saveToDisk();

    return updated;
  }
}

export const feedbackStore = new FeedbackStore();
