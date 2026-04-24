import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PermissionsProvider } from '../context'
import { Can } from '../Can'
import { usePermissions } from '../usePermissions'
import { withPermission } from '../withPermission'

// ─── helpers ────────────────────────────────────────────────────────────────

function wrapper(permissions: string[], role?: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <PermissionsProvider permissions={permissions} role={role}>
        {children}
      </PermissionsProvider>
    )
  }
}

// ─── <Can> component ────────────────────────────────────────────────────────

describe('<Can>', () => {
  it('renders children when permission is granted', () => {
    render(
      <PermissionsProvider permissions={['read:posts']}>
        <Can do="read" on="posts"><span>allowed</span></Can>
      </PermissionsProvider>
    )
    expect(screen.getByText('allowed')).toBeTruthy()
  })

  it('renders nothing when permission is denied', () => {
    render(
      <PermissionsProvider permissions={['read:posts']}>
        <Can do="delete" on="posts"><span>not allowed</span></Can>
      </PermissionsProvider>
    )
    expect(screen.queryByText('not allowed')).toBeNull()
  })

  it('renders fallback when denied', () => {
    render(
      <PermissionsProvider permissions={['read:posts']}>
        <Can do="delete" on="posts" fallback={<span>fallback</span>}>
          <span>hidden</span>
        </Can>
      </PermissionsProvider>
    )
    expect(screen.getByText('fallback')).toBeTruthy()
    expect(screen.queryByText('hidden')).toBeNull()
  })

  it('renders children when user has wildcard *', () => {
    render(
      <PermissionsProvider permissions={['*']}>
        <Can do="anything" on="anywhere"><span>yes</span></Can>
      </PermissionsProvider>
    )
    expect(screen.getByText('yes')).toBeTruthy()
  })

  it('handles array of actions with mode=all (default)', () => {
    render(
      <PermissionsProvider permissions={['read:posts', 'edit:posts']}>
        <Can do={['read', 'edit']} on="posts"><span>both</span></Can>
      </PermissionsProvider>
    )
    expect(screen.getByText('both')).toBeTruthy()
  })

  it('hides when one action in array is missing (mode=all)', () => {
    render(
      <PermissionsProvider permissions={['read:posts']}>
        <Can do={['read', 'edit']} on="posts"><span>hidden</span></Can>
      </PermissionsProvider>
    )
    expect(screen.queryByText('hidden')).toBeNull()
  })

  it('shows when any action matches (mode=any)', () => {
    render(
      <PermissionsProvider permissions={['read:posts']}>
        <Can do={['read', 'edit']} on="posts" mode="any"><span>any</span></Can>
      </PermissionsProvider>
    )
    expect(screen.getByText('any')).toBeTruthy()
  })

  it('filters by role prop', () => {
    render(
      <PermissionsProvider permissions={['edit:posts']} role="reviewer">
        <Can do="edit" on="posts" role="admin"><span>admin only</span></Can>
        <Can do="edit" on="posts" role="reviewer"><span>reviewer</span></Can>
      </PermissionsProvider>
    )
    expect(screen.queryByText('admin only')).toBeNull()
    expect(screen.getByText('reviewer')).toBeTruthy()
  })

  it('filters by roles array', () => {
    render(
      <PermissionsProvider permissions={['read:posts']} role="student">
        <Can do="read" on="posts" roles={['student', 'reviewer']}>
          <span>student ok</span>
        </Can>
      </PermissionsProvider>
    )
    expect(screen.getByText('student ok')).toBeTruthy()
  })

  it('inverts with not prop', () => {
    render(
      <PermissionsProvider permissions={['read:posts']}>
        <Can do="delete" on="posts" not><span>non-admin</span></Can>
      </PermissionsProvider>
    )
    expect(screen.getByText('non-admin')).toBeTruthy()
  })

  it('throws if used outside PermissionsProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(<Can do="read"><span>x</span></Can>)
    ).toThrow()
    consoleError.mockRestore()
  })
})

// ─── usePermissions hook ─────────────────────────────────────────────────────

describe('usePermissions', () => {
  function TestComponent({ action, resource }: { action: string; resource?: string }) {
    const { can, cannot, is, isAny, canAll, canAny } = usePermissions()
    return (
      <div>
        <span data-testid="can">{String(can(action, resource))}</span>
        <span data-testid="cannot">{String(cannot(action, resource))}</span>
        <span data-testid="is-admin">{String(is('admin'))}</span>
        <span data-testid="isAny">{String(isAny(['admin', 'reviewer']))}</span>
        <span data-testid="canAll">{String(canAll(['read', 'edit'], resource))}</span>
        <span data-testid="canAny">{String(canAny(['read', 'delete'], resource))}</span>
      </div>
    )
  }

  it('can returns true for granted permission', () => {
    render(
      <PermissionsProvider permissions={['read:posts']} role="reviewer">
        <TestComponent action="read" resource="posts" />
      </PermissionsProvider>
    )
    expect(screen.getByTestId('can').textContent).toBe('true')
    expect(screen.getByTestId('cannot').textContent).toBe('false')
  })

  it('is returns true for matching role', () => {
    render(
      <PermissionsProvider permissions={[]} role="admin">
        <TestComponent action="read" />
      </PermissionsProvider>
    )
    expect(screen.getByTestId('is-admin').textContent).toBe('true')
  })

  it('isAny returns true when role is in list', () => {
    render(
      <PermissionsProvider permissions={[]} role="reviewer">
        <TestComponent action="read" />
      </PermissionsProvider>
    )
    expect(screen.getByTestId('isAny').textContent).toBe('true')
  })

  it('throws if used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(<TestComponent action="read" />)
    ).toThrow()
    consoleError.mockRestore()
  })
})

// ─── withPermission HOC ───────────────────────────────────────────────────────

describe('withPermission', () => {
  function Secret() {
    return <span>secret</span>
  }

  it('renders component when permission granted', () => {
    const Protected = withPermission({ permission: 'admin:access' })(Secret)
    render(
      <PermissionsProvider permissions={['admin:access']}>
        <Protected />
      </PermissionsProvider>
    )
    expect(screen.getByText('secret')).toBeTruthy()
  })

  it('renders fallback when denied', () => {
    const Protected = withPermission({
      permission: 'admin:access',
      fallback: <span>denied</span>,
    })(Secret)
    render(
      <PermissionsProvider permissions={['read:posts']}>
        <Protected />
      </PermissionsProvider>
    )
    expect(screen.getByText('denied')).toBeTruthy()
    expect(screen.queryByText('secret')).toBeNull()
  })

  it('protects by role', () => {
    const Protected = withPermission({ role: 'admin' })(Secret)
    render(
      <PermissionsProvider permissions={[]} role="reviewer">
        <Protected />
      </PermissionsProvider>
    )
    expect(screen.queryByText('secret')).toBeNull()
  })

  it('sets a readable displayName', () => {
    const Protected = withPermission({ permission: 'read:posts' })(Secret)
    expect(Protected.displayName).toBe('withPermission(Secret)')
  })
})

// ─── extraPermissions ────────────────────────────────────────────────────────

describe('extraPermissions', () => {
  it('merges base + extra permissions', () => {
    function Check() {
      const { can } = usePermissions()
      return <span>{String(can('super', 'access'))}</span>
    }

    render(
      <PermissionsProvider
        permissions={['read:posts']}
        extraPermissions={['super:access']}
      >
        <Check />
      </PermissionsProvider>
    )
    expect(screen.getByText('true')).toBeTruthy()
  })
})
