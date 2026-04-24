import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  matchRole,
  matchAnyRole,
  mergePermissions,
  buildRolePermissions,
  buildPermissionString,
  normalizePermission,
  matchPermission,
} from '../utils'

describe('normalizePermission', () => {
  it('lowercases and trims', () => {
    expect(normalizePermission('  Read:Posts  ')).toBe('read:posts')
    expect(normalizePermission('ADMIN')).toBe('admin')
  })
})

describe('buildPermissionString', () => {
  it('joins action and resource with colon', () => {
    expect(buildPermissionString('read', 'posts')).toBe('read:posts')
  })
  it('returns action only when no resource', () => {
    expect(buildPermissionString('read')).toBe('read')
  })
  it('handles empty/invalid inputs', () => {
    expect(buildPermissionString('')).toBe('')
    expect(buildPermissionString('read', '')).toBe('read')
  })
})

describe('matchPermission', () => {
  it('matches exact action:resource', () => {
    expect(matchPermission('read:posts', 'read', 'posts')).toBe(true)
    expect(matchPermission('read:posts', 'edit', 'posts')).toBe(false)
  })

  it('matches full wildcard *', () => {
    expect(matchPermission('*', 'delete', 'users')).toBe(true)
    expect(matchPermission('*', 'anything')).toBe(true)
  })

  it('matches action wildcard read:*', () => {
    expect(matchPermission('read:*', 'read', 'posts')).toBe(true)
    expect(matchPermission('read:*', 'read', 'users')).toBe(true)
    expect(matchPermission('read:*', 'edit', 'posts')).toBe(false)
  })

  it('matches resource wildcard *:posts', () => {
    expect(matchPermission('*:posts', 'read', 'posts')).toBe(true)
    expect(matchPermission('*:posts', 'delete', 'posts')).toBe(true)
    expect(matchPermission('*:posts', 'read', 'users')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(matchPermission('READ:POSTS', 'read', 'posts')).toBe(true)
    expect(matchPermission('read:posts', 'READ', 'POSTS')).toBe(true)
  })

  it('matches bare action when no resource given', () => {
    expect(matchPermission('read', 'read')).toBe(true)
    expect(matchPermission('read', 'edit')).toBe(false)
  })
})

describe('hasPermission', () => {
  const perms = ['read:posts', 'edit:posts', 'delete:users', 'read:*', '*:courses']

  it('returns true for exact matches', () => {
    expect(hasPermission(perms, 'read', 'posts')).toBe(true)
    expect(hasPermission(perms, 'edit', 'posts')).toBe(true)
    expect(hasPermission(perms, 'delete', 'users')).toBe(true)
  })

  it('returns false when permission not in list', () => {
    expect(hasPermission(perms, 'delete', 'posts')).toBe(false)
    expect(hasPermission(perms, 'create', 'users')).toBe(false)
  })

  it('respects action wildcard', () => {
    expect(hasPermission(perms, 'read', 'anything')).toBe(true)
  })

  it('respects resource wildcard', () => {
    expect(hasPermission(perms, 'delete', 'courses')).toBe(true)
    expect(hasPermission(perms, 'create', 'courses')).toBe(true)
  })

  it('handles empty permissions array', () => {
    expect(hasPermission([], 'read', 'posts')).toBe(false)
  })

  it('handles full wildcard', () => {
    expect(hasPermission(['*'], 'anything', 'anywhere')).toBe(true)
  })

  it('handles invalid inputs gracefully', () => {
    expect(hasPermission(null as any, 'read')).toBe(false)
    expect(hasPermission(['read:posts'], '')).toBe(false)
    expect(hasPermission(['read:posts'], null as any)).toBe(false)
  })
})

describe('hasAllPermissions', () => {
  const perms = ['read:posts', 'edit:posts', 'delete:posts']

  it('returns true only when ALL match', () => {
    expect(hasAllPermissions(perms, ['read', 'edit', 'delete'], 'posts')).toBe(true)
  })

  it('returns false if any is missing', () => {
    expect(hasAllPermissions(perms, ['read', 'create'], 'posts')).toBe(false)
  })

  it('returns true for empty array', () => {
    expect(hasAllPermissions(perms, [])).toBe(true)
  })
})

describe('hasAnyPermission', () => {
  const perms = ['read:posts']

  it('returns true if at least one matches', () => {
    expect(hasAnyPermission(perms, ['read', 'delete'], 'posts')).toBe(true)
  })

  it('returns false if none match', () => {
    expect(hasAnyPermission(perms, ['edit', 'delete'], 'posts')).toBe(false)
  })

  it('returns false for empty array', () => {
    expect(hasAnyPermission(perms, [])).toBe(false)
  })
})

describe('matchRole', () => {
  it('matches exact role case-insensitively', () => {
    expect(matchRole('admin', 'admin')).toBe(true)
    expect(matchRole('ADMIN', 'admin')).toBe(true)
    expect(matchRole('admin', 'ADMIN')).toBe(true)
  })

  it('returns false for mismatched roles', () => {
    expect(matchRole('admin', 'reviewer')).toBe(false)
  })

  it('handles undefined/null gracefully', () => {
    expect(matchRole(undefined, 'admin')).toBe(false)
    expect(matchRole('admin', undefined as any)).toBe(false)
  })
})

describe('matchAnyRole', () => {
  it('returns true if role matches any in the list', () => {
    expect(matchAnyRole('reviewer', ['admin', 'reviewer', 'editor'])).toBe(true)
  })

  it('returns false if no match', () => {
    expect(matchAnyRole('student', ['admin', 'reviewer'])).toBe(false)
  })
})

describe('mergePermissions', () => {
  it('merges and deduplicates', () => {
    const result = mergePermissions(['read:posts'], ['read:posts', 'edit:posts'])
    expect(result).toEqual(['read:posts', 'edit:posts'])
  })

  it('collapses to * when wildcard present', () => {
    const result = mergePermissions(['read:posts'], ['*'])
    expect(result).toEqual(['*'])
  })

  it('handles empty arrays', () => {
    expect(mergePermissions([], [])).toEqual([])
  })
})

describe('buildRolePermissions', () => {
  it('lowercases role keys', () => {
    const result = buildRolePermissions({ ADMIN: ['*'], Reviewer: ['read:posts'] })
    expect(result).toHaveProperty('admin')
    expect(result).toHaveProperty('reviewer')
  })

  it('deduplicates permissions per role', () => {
    const result = buildRolePermissions({ editor: ['read:posts', 'read:posts', 'edit:posts'] })
    expect(result.editor).toEqual(['read:posts', 'edit:posts'])
  })
})
