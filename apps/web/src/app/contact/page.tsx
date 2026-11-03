'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Mail, MessageSquare, CheckCircle2, Phone, MapPin, ArrowRight, FilePlus } from 'lucide-react';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          res.status === 503 || res.status === 502
            ? `We couldn't send your message right now. Please email us at ${APP_CONFIG.supportEmail}.`
            : body.error || 'Please try again.'
        );
        return;
      }
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      setError(`We couldn't send your message right now. Please email us at ${APP_CONFIG.supportEmail}.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="w-full min-w-0 max-w-5xl mx-auto px-4 sm:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <Badge variant="outline" className="text-sm">Contact</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Contact us
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions about your account, plans or invoices? We’re happy to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Details Card */}
          <div className="space-y-4">
            <Card className="border-border bg-card p-6 rounded-xl space-y-4">
              <h3 className="font-bold text-sm text-foreground">Email</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span>{APP_CONFIG.supportEmail}</span>
                </div>
              </div>
            </Card>


          </div>

          {/* Contact Form */}
          <Card className="md:col-span-2 border-border bg-card p-6 sm:p-8 rounded-xl shadow-sm">
            {submitted ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-foreground">Thanks, we've got your message</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  We'll reply to the email address you gave us.
                </p>
                <Button size="sm" variant="outline" onClick={() => setSubmitted(false)}>
                  Write another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                {/* Hidden from people. Bots that fill it in are rejected. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Your Name *</label>
                    <Input
                      required
                      placeholder="e.g. Sam Lee"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Work Email *</label>
                    <Input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Subject</label>
                  <Input
                    placeholder="e.g. Enterprise plan question"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Message *</label>
                  <Textarea
                    required
                    rows={4}
                    placeholder="Tell us about your requirements or what you need assistance with..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto font-bold text-sm px-6">
                  {submitting ? 'Submitting...' : 'Send Inquiry'}
                </Button>
              </form>
            )}
          </Card>
        </div>
        <div className="p-8 rounded-xl bg-muted/40 border border-border text-center space-y-3">
          <p className="text-sm text-muted-foreground">Looking to explore features or start creating invoices right away?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/create">
              <Button size="sm" className="font-bold text-sm bg-primary text-primary-foreground">
                <FilePlus className="w-3.5 h-3.5 mr-1.5" /> Create Invoice Free
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="sm" className="font-bold text-sm">
                Explore Features
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="font-bold text-sm">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
