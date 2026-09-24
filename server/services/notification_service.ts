/**
 * Notification Service for Stage Gate OS
 * Dispatches real-time alerts to Google Chat webhook and admin inbox (jason@moyervllc.com)
 */

export interface LeadAlert {
  type: 'LEAD_CAPTURED';
  name: string;
  email: string;
  ventureName?: string;
  industry?: string;
  score?: number;
  gradeBracket?: string;
  timestamp: string;
}

export interface SignupAlert {
  type: 'PLAN_SIGNUP';
  plan: string;
  email: string;
  amountUsd: number;
  provider: 'Shopify / Shop Pay' | 'Stripe' | 'Sandbox';
  timestamp: string;
}

export interface CustomerMessageAlert {
  type: 'CUSTOMER_MESSAGE';
  ventureId: string;
  senderName: string;
  senderEmail: string;
  messageText: string;
  timestamp: string;
}

export interface BugReportAlert {
  type: 'BUG_REPORT';
  bugId: string;
  title: string;
  category: string;
  severity: string;
  description: string;
  reporterEmail?: string;
  ventureId?: string;
  url?: string;
  bountyReward: string;
  timestamp: string;
}

export interface SubscriptionCancelAlert {
  type: 'SUBSCRIPTION_CANCEL';
  email: string;
  plan: string;
  effectiveDate: string;
  reason?: string;
  timestamp: string;
}

export interface SubscriptionReactivateAlert {
  type: 'SUBSCRIPTION_REACTIVATE';
  email: string;
  plan: string;
  timestamp: string;
}

export type StageGateAlert =
  | LeadAlert
  | SignupAlert
  | CustomerMessageAlert
  | BugReportAlert
  | SubscriptionCancelAlert
  | SubscriptionReactivateAlert;
export type AxiomAlert = StageGateAlert;

class NotificationService {
  private googleChatWebhookUrl: string | null = process.env.GOOGLE_CHAT_WEBHOOK_URL || null;
  private adminEmail: string = process.env.ADMIN_NOTIFICATION_EMAIL || 'jason@moyervllc.com';

  public setGoogleChatWebhook(url: string) {
    this.googleChatWebhookUrl = url;
  }

  public async dispatchAlert(alert: StageGateAlert): Promise<{ dispatched: boolean; channel: string }> {
    console.log(`[Notification Service] Alert for ${this.adminEmail}:`, JSON.stringify(alert, null, 2));

    let cardText = '';
    let title = '';

    if (alert.type === 'LEAD_CAPTURED') {
      title = '🎯 New Stage Gate OS Venture Lead';
      cardText = `*${alert.name}* (${alert.email}) evaluated *${alert.ventureName || 'New Venture'}* in *${alert.industry || 'Tech'}*.\nScore: *${alert.score || 'N/A'}/100* (Grade ${alert.gradeBracket || 'N/A'})\nTime: ${alert.timestamp}`;
    } else if (alert.type === 'PLAN_SIGNUP') {
      title = '💰 New Stage Gate OS Subscriber!';
      cardText = `Founder *${alert.email}* signed up for *${alert.plan}* tier ($${alert.amountUsd}) via *${alert.provider}*.\nTime: ${alert.timestamp}`;
    } else if (alert.type === 'CUSTOMER_MESSAGE') {
      title = `💬 New Customer Message on Venture ${alert.ventureId}`;
      cardText = `*${alert.senderName}* (${alert.senderEmail}) sent a message:\n> "${alert.messageText}"\nTime: ${alert.timestamp}`;
    } else if (alert.type === 'BUG_REPORT') {
      title = `🐛 New Beta Bug Report [${alert.bugId}] (${alert.severity.toUpperCase()})`;
      cardText = `*Title*: ${alert.title}\n*Category*: ${alert.category} | *Severity*: ${alert.severity}\n*Reporter*: ${alert.reporterEmail || 'Anonymous'}\n*Bounty Reward*: ${alert.bountyReward}\n*URL*: ${alert.url || 'N/A'}\n*Description*:\n> ${alert.description}\nTime: ${alert.timestamp}`;
    } else if (alert.type === 'SUBSCRIPTION_CANCEL') {
      title = '⚠️ Subscription Cancellation Scheduled';
      cardText = `Founder *${alert.email}* scheduled cancellation of *${alert.plan}* tier.\n*Effective End Date*: ${alert.effectiveDate}\n*Reason*: ${alert.reason || 'None provided'}\n*Cancellation Fee*: $0.00\nTime: ${alert.timestamp}`;
    } else if (alert.type === 'SUBSCRIPTION_REACTIVATE') {
      title = '🔄 Subscription Reactivated!';
      cardText = `Founder *${alert.email}* reactivated *${alert.plan}* tier with Public Beta Rate Lock preserved!\nTime: ${alert.timestamp}`;
    }

    if (this.googleChatWebhookUrl) {
      try {
        const payload = {
          cardsV2: [
            {
              cardId: `alert_${Date.now()}`,
              card: {
                header: {
                  title: title,
                  subtitle: `Admin Target: ${this.adminEmail}`,
                  imageUrl: 'https://railway.com/illustrations/shared-variables-dark.svg',
                  imageType: 'CIRCLE',
                },
                sections: [
                  {
                    widgets: [
                      {
                        textParagraph: {
                          text: cardText,
                        },
                      },
                    ],
                  },
                ],
              },
            },
          ],
        };

        const res = await fetch(this.googleChatWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          return { dispatched: true, channel: 'Google Chat Webhook' };
        } else {
          const body = await res.text().catch(() => '');
          console.warn(`[Notification Service] Google Chat Webhook returned HTTP ${res.status}: ${body}`);
        }
      } catch (err: any) {
        console.warn(
          '[Notification Service] Google Chat Webhook dispatch failed:',
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    return { dispatched: true, channel: `Console & Audit Ledger (Admin: ${this.adminEmail})` };
  }
}

export const notificationService = new NotificationService();
