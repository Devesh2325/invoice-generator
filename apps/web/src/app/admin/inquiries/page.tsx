'use client';

import React, { useEffect, useState } from 'react';
import { AdminApi } from '@invoice/api';
import { AdminInquiry } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Mail,
  Send,
  Eye,
} from 'lucide-react';

export default function AdminInquiriesPage() {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(null);
  const [replyNotes, setReplyNotes] = useState('');
  const [newStatus, setNewStatus] = useState<'new' | 'in_progress' | 'resolved'>('new');

  const loadInquiries = () => {
    setInquiries(AdminApi.getInquiries());
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleOpenDetail = (inq: AdminInquiry) => {
    setSelectedInquiry(inq);
    setReplyNotes(inq.notes || '');
    setNewStatus(inq.status);
  };

  const handleSaveNotes = () => {
    if (!selectedInquiry) return;
    AdminApi.updateInquiry(selectedInquiry.id, newStatus, replyNotes);
    loadInquiries();
    setSelectedInquiry(null);
    toast({
      title: 'Inquiry Updated',
      description: `Inquiry status updated to ${newStatus}.`,
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this customer inquiry?')) {
      AdminApi.deleteInquiry(id);
      loadInquiries();
      toast({
        title: 'Inquiry Deleted',
        description: 'Customer inquiry has been permanently removed.',
      });
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesStatus = filterStatus === 'all' || inq.status === filterStatus;
    const matchesSearch =
      inq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="h-6 w-6 text-primary" />
            Contact & Support Inquiries Inbox
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and resolve pre-sales queries, enterprise custom domain requests, and client support tickets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-slate-900 border-slate-800 text-slate-300">
            Total: {inquiries.length}
          </Badge>
          <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-300">
            Pending: {inquiries.filter((i) => i.status !== 'resolved').length}
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by customer name, email, or message topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-xs h-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 overflow-x-auto">
          {(['all', 'new', 'in_progress', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 ${
                filterStatus === status
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredInquiries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No inquiries found</p>
            <p className="text-xs text-slate-500 mt-1">Try relaxing your search terms or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Subject & Excerpt</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInquiries.map((inq) => {
                  const isNew = inq.status === 'new';
                  const isInProg = inq.status === 'in_progress';

                  return (
                    <tr
                      key={inq.id}
                      onClick={() => handleOpenDetail(inq)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{inq.name}</div>
                        <div className="text-[11px] text-slate-400">{inq.email}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-slate-200 truncate">{inq.subject}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{inq.message}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            isNew
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              : isInProg
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          }`}
                        >
                          {inq.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(inq);
                            }}
                            className="h-7 px-2 text-xs text-primary hover:text-primary-hover"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(inq.id, e)}
                            className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inquiry Detail & Reply Modal */}
      {selectedInquiry && (
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="max-w-xl bg-slate-900 border border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center justify-between">
                <span>Inquiry Details</span>
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${
                    selectedInquiry.status === 'new'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      : selectedInquiry.status === 'in_progress'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {selectedInquiry.status.replace('_', ' ')}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Submitted on {new Date(selectedInquiry.createdAt).toLocaleString('en-IN')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>{selectedInquiry.name}</span>
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                    className="text-primary hover:underline flex items-center gap-1 font-normal text-xs"
                  >
                    <Mail className="h-3.5 w-3.5" /> {selectedInquiry.email}
                  </a>
                </div>
                <div className="text-xs font-semibold text-slate-300 pt-1">{selectedInquiry.subject}</div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Message Content
                </label>
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedInquiry.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Update Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="new">New (Unresolved)</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Direct Email
                  </label>
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white">
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Compose Email Reply
                    </Button>
                  </a>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Internal Resolution Notes & Actions
                </label>
                <textarea
                  value={replyNotes}
                  onChange={(e) => setReplyNotes(e.target.value)}
                  placeholder="Record resolution notes, internal steps taken, or reply summaries..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedInquiry(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  className="text-xs font-semibold bg-primary hover:bg-primary-hover text-white"
                >
                  Save Status & Notes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
