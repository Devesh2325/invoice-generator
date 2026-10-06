import { describe, it, expect } from 'vitest';
import { cn } from '../src/index';

describe('UI Utilities', () => {
  it('combines classes and resolves tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles falsy and conditional values correctly', () => {
    expect(cn('font-bold', false && 'text-red-500', undefined, null, 'text-sm')).toBe('font-bold text-sm');
  });
});
