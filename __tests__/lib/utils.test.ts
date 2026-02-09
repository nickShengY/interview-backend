/**
 * Tests for utility functions
 */

import { cn } from '@/lib/utils'

describe('cn() utility', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
  })

  it('should merge tailwind conflicts correctly', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('should handle empty string', () => {
    expect(cn('')).toBe('')
  })

  it('should handle no arguments', () => {
    expect(cn()).toBe('')
  })

  it('should handle array of classes', () => {
    const result = cn(['foo', 'bar'])
    expect(result).toContain('foo')
    expect(result).toContain('bar')
  })

  it('should handle object syntax', () => {
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500')
  })

  it('should deduplicate identical classes', () => {
    const result = cn('p-4 p-4')
    expect(result).toBe('p-4')
  })

  it('should handle complex tailwind merge', () => {
    expect(cn('border-t border-b', 'border-t-0')).toContain('border-t-0')
    expect(cn('rounded-lg', 'rounded-xl')).toBe('rounded-xl')
  })
})
