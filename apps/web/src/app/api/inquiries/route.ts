import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { AdminInquiry } from '@invoice/core';
import { PlatformStore } from '@/lib/server/platform-store';
import { handleErrors, isRateLimited, json } from '@/lib/server/api-helpers';

const InquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
  // A field people can't see. Only bots fill it in.
  website: z.string().max(0).optional(),
});

export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'inquiry', 5, 10 * 60 * 1000)) {
    return json({ error: 'Too many messages. Please try again in a few minutes.' }, 429);
  }
  const parsed = InquirySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Please check your name, email and message.' }, 400);

  return handleErrors(async () => {
    const { name, email, subject, message } = parsed.data;
    const id = `inq_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const inquiry: AdminInquiry = {
      id,
      name,
      email: email.toLowerCase(),
      subject: subject || 'General inquiry',
      message,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    await PlatformStore.put(id, 'inquiry', inquiry);
    return json({ ok: true }, 201);
  });
}
