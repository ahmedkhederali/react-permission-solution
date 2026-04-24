import React, { type ReactNode } from 'react'
import { usePermissionsContext } from './context'
import type { Role } from './utils'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type MatchMode = 'all' | 'any'

export interface CanProps {
  /**
   * The action(s) to check.
   * - Single string: `do="read"` or `do="read:posts"`
   * - Array (default mode=all): `do={['read','edit']}`
   */
  do: string | string[]
  /**
   * Optional resource to check against.
   * e.g. `on="posts"` → checks 'read:posts'
   */
  on?: string
  /**
   * When `do` is an array, how to evaluate:
   * - `'all'` (default) — user must have ALL permissions
   * - `'any'` — user must have AT LEAST ONE permission
   */
  mode?: MatchMode
  /**
   * What to render when the check FAILS.
   * If not provided, renders nothing.
   */
  fallback?: ReactNode
  /**
   * If provided, ALSO checks that the user has this role.
   * Both the permission AND the role must match.
   */
  role?: Role
  /**
   * If provided, checks that the user has ANY of these roles.
   */
  roles?: Role[]
  /**
   * Invert the check — render children when user does NOT have the permission.
   * Useful for "show this to NON-admins" cases.
   */
  not?: boolean
  children: ReactNode
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function Can({
  do: action,
  on: resource,
  mode = 'all',
  fallback = null,
  role,
  roles,
  not = false,
  children,
}: CanProps) {
  const ctx = usePermissionsContext()

  // ── permission check ──
  let permissionGranted: boolean

  if (Array.isArray(action)) {
    permissionGranted =
      mode === 'any'
        ? ctx.canAny(action, resource)
        : ctx.canAll(action, resource)
  } else {
    permissionGranted = ctx.can(action, resource)
  }

  // ── role check (AND logic with permission) ──
  let roleGranted = true
  if (role) roleGranted = ctx.is(role)
  else if (roles && roles.length > 0) roleGranted = ctx.isAny(roles)

  // ── combine ──
  let allowed = permissionGranted && roleGranted

  // ── invert if `not` ──
  if (not) allowed = !allowed

  return <>{allowed ? children : fallback}</>
}
