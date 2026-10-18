'use client';

import React, { useEffect, useState } from 'react';
import { AdminApi } from '@invoice/api';
import { AdminSystemAuditLog } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  History,
  Search,
  Download,
  Shield,
  ShieldAlert,
  Activity,
  Terminal,
  RefreshCw,
} from 'lucide-react';

export default function AdminAuditPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AdminSystemAuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actorFilter, setActorFilter] = useState<'all' | 'Super Admin' | 'System Worker'>('all');

  const loadLogs = () => {
    setLogs(AdminApi.getSystemAuditLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `invoxa_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast({
      title: 'Logs Exported',
      description: 'System audit logs downloaded as JSON file.',
    });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesActor = actorFilter === 'all' || log.actor === actorFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesActor && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <History className="h-6 w-6 text-primary" />
            System Audit & Security Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable tracking of super admin actions, user plan modifications, and system cron jobs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            className="text-xs bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button
            onClick={handleExportJson}
            size="sm"
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" /> Export JSON
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by action name, actor, or target resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-xs h-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          {(['all', 'Super Admin', 'System Worker'] as const).map((actor) => (
            <button
              key={actor}
              onClick={() => setActorFilter(actor)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                actorFilter === actor
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {actor === 'all' ? 'All Actors' : actor}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-white">No Audit Logs Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              System events, workspace creations, plan upgrades, and admin actions will be recorded here automatically.
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No audit logs matched &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Timestamp (UTC/IST)</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">Target Resource</th>
                  <th className="py-3.5 px-4 text-right">Log ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredLogs.map((log) => {
                  const isSuperAdmin = log.actor === 'Super Admin';
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-sans font-semibold">
                        <div className="flex items-center gap-1.5">
                          {isSuperAdmin ? (
                            <Shield className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Activity className="h-3.5 w-3.5 text-amber-400" />
                          )}
                          <span className={isSuperAdmin ? 'text-primary' : 'text-slate-300'}>
                            {log.actor}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="bg-slate-950 border-slate-800 text-slate-200 text-[10px]"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        {log.target}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 text-[10px]">
                        {log.id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
