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
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2.5">
            <History className="h-6 w-6 text-primary" />
            System Audit & Security Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable tracking of super admin actions, user plan modifications, and system cron jobs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            className="text-xs bg-card border-border text-foreground hover:text-foreground"
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
      <div className="flex flex-col md:flex-row items-center gap-4 bg-card border border-border p-4 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action name, actor, or target resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground text-xs h-9 w-full"
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
                  : 'bg-background text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {actor === 'all' ? 'All Actors' : actor}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto text-muted-foreground border border-border">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No Audit Logs Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              System events, workspace creations, plan upgrades, and admin actions will be recorded here automatically.
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No audit logs matched &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-foreground">
              <thead className="bg-background text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Timestamp (UTC/IST)</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">Target Resource</th>
                  <th className="py-3.5 px-4 text-right">Log ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums text-xs">
                {filteredLogs.map((log) => {
                  const isSuperAdmin = log.actor === 'Super Admin';
                  return (
                    <tr key={log.id} className="hover:bg-accent transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
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
                            <Activity className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                          )}
                          <span className={isSuperAdmin ? 'text-primary' : 'text-foreground'}>
                            {log.actor}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="bg-background border-border text-foreground text-xs"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-foreground">
                        {log.target}
                      </td>
                      <td className="py-3.5 px-4 text-right text-muted-foreground text-xs">
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
