/**
 * In-Product Customer <-> Founder/Admin Messaging Routes
 * 
 * Enables:
 * - Customers to send messages or ask questions about their active project.
 * - Founder/Admin (Jason) to review all project threads and reply directly.
 * - Automatic real-time notification dispatch to Google Chat / jason@moyervllc.com.
 */

import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { notificationService } from '../services/notification_service.js';

export interface ProjectMessage {
  id: string;
  ventureId: string;
  sender: 'customer' | 'admin';
  senderName: string;
  senderEmail: string;
  text: string;
  timestamp: string;
  read: boolean;
}

// In-memory persistent messages store per venture
const messagesStore: ProjectMessage[] = [
  {
    id: 'msg_init_01',
    ventureId: 'ven_docuflow_02',
    sender: 'admin',
    senderName: 'Jason Moyer (Stage Gate OS Lead)',
    senderEmail: 'jason@moyervllc.com',
    text: 'Welcome to Stage Gate OS! Your DocuFlow AI venture is currently at Gate 4 (Stripe checkout verification). Let me know if you need any adjustments or custom domain setup.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true,
  },
];

export const messagingRoutes = Router();

function checkAdminAuth(req: Request): boolean {
  const adminKey = req.headers['x-admin-key'] as string;
  const authHeader = req.headers.authorization || '';
  const expectedAdminKey = process.env.ADMIN_API_KEY || 'stagegate_admin_key_2026';

  if (adminKey && adminKey === expectedAdminKey) return true;
  if (authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === expectedAdminKey) return true;
  return false;
}

// GET /api/messages/:ventureId - Fetch message history for a venture
messagingRoutes.get('/:ventureId', (req: Request, res: Response) => {
  const ventureId = String(req.params.ventureId);
  const thread = messagesStore.filter((m) => m.ventureId === ventureId);
  res.json({ ventureId, messages: thread });
});

// GET /api/messages - Admin view: list all threads across all ventures (Protected by Admin Auth)
messagingRoutes.get('/', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    res.status(401).json({
      error: 'Unauthorized: Admin authentication required via x-admin-key header to view customer message archives (CCPA § 1798.150 / GDPR Art. 32).'
    });
    return;
  }
  res.json({ total: messagesStore.length, messages: messagesStore });
});

// POST /api/messages/:ventureId - Send a new message (customer or admin)
messagingRoutes.post('/:ventureId', async (req: Request, res: Response): Promise<void> => {
  try {
    const ventureId = String(req.params.ventureId);
    const { text, sender = 'customer', senderName, senderEmail } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Message text cannot be empty' });
      return;
    }

    const newMessage: ProjectMessage = {
      id: `msg_${randomUUID().slice(0, 8)}`,
      ventureId,
      sender: sender === 'admin' ? 'admin' : 'customer',
      senderName: senderName || (sender === 'admin' ? 'Jason Moyer (Stage Gate OS)' : 'Founder'),
      senderEmail: senderEmail || (sender === 'admin' ? 'jason@moyervllc.com' : 'customer@venture.com'),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: sender === 'admin',
    };

    messagesStore.push(newMessage);

    // If message is from customer, alert Jason immediately
    if (sender === 'customer') {
      await notificationService.dispatchAlert({
        type: 'CUSTOMER_MESSAGE',
        ventureId,
        senderName: newMessage.senderName,
        senderEmail: newMessage.senderEmail,
        messageText: newMessage.text,
        timestamp: newMessage.timestamp,
      });
    }

    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
