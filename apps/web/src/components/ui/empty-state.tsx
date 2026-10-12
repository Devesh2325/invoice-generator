import React from 'react';
import { LucideIcon, FileText } from 'lucide-react';
import { cn } from '@invoice/ui';
import { Button } from './button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileText,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-border rounded-2xl bg-card/50',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        actionHref ? (
          <Link href={actionHref}>
            <Button size="sm" className="font-semibold text-xs shadow-xs">
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button size="sm" onClick={onAction} className="font-semibold text-xs shadow-xs">
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
};
