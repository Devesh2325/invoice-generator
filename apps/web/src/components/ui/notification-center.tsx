'use client';

import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from './dropdown-menu';

interface NotificationItem {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_1',
      type: 'warning',
      title: 'Overdue Invoice Reminder',
      message: 'Invoice #INV-2026-00101 for Globex Corporation is past due.',
      timestamp: '10m ago',
      read: false,
    },
    {
      id: 'notif_2',
      type: 'info',
      title: 'UPI Payment QR Ready',
      message: 'Verified NPCI UPI QR code generation active for current workspace.',
      timestamp: '1h ago',
      read: false,
    },
    {
      id: 'notif_3',
      type: 'success',
      title: 'Backup Synced',
      message: 'Local IndexedDB offline documents safely synchronized.',
      timestamp: 'Yesterday',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors focus:outline-hidden"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0 border-border bg-card shadow-xl rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/40">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-500/10 px-1.5 py-0.2 text-[10px] font-bold text-rose-600">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 text-xs transition-colors relative flex items-start gap-2.5 ${
                  notif.read ? 'bg-card' : 'bg-primary/5 font-medium'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {notif.type === 'warning' && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  {notif.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                  {notif.type === 'success' && (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 pr-4">
                  <div className="text-foreground font-semibold text-[11px]">
                    {notif.title}
                  </div>
                  <div className="text-muted-foreground text-[10px] mt-0.5 leading-normal">
                    {notif.message}
                  </div>
                  <div className="text-muted-foreground/60 text-[9px] mt-1 font-mono">
                    {notif.timestamp}
                  </div>
                </div>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="text-muted-foreground/50 hover:text-foreground text-[10px] p-0.5 absolute top-2 right-2"
                  title="Dismiss"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
