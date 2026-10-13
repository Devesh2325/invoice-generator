'use client';

import React from 'react';
import { useTranslation, SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/i18n/i18n-context';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  className = '',
}) => {
  const { language, setLanguage } = useTranslation();

  const currentMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus:outline-hidden ${className}`}
          title="Change Language / भाषा बदलें"
          aria-label="Change Language"
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono text-[11px] uppercase">{currentMeta.code}</span>
          {!compact && <span className="hidden sm:inline font-sans text-xs">{currentMeta.flag}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 p-1 border-border bg-card shadow-lg z-50">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md cursor-pointer ${
                isSelected ? 'font-bold bg-primary/10 text-primary' : 'text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
