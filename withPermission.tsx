import React, { type ComponentType, type ReactNode } from 'react'
import { usePermissionsContext } from './context'
import type { Role } from './utils'

export interface WithPermissionOptions {
  /**
   * Required permission(s). If array, all must match (use `mode:'any'` to change).
   */
  permission?: string | string[]
  /** Optional resource to check against */
  resource?: string
  /** 'all' (default) or 'any' when permission is an array */
  mode?: 'all' | 'any'
  /** Required role */
  role?: Role
  /** Required role — any of these */
  roles?: Role[]
  /**
   * What to render when access is denied.
   * Defaults to null (renders nothing).
   */
  fallback?: ReactNode
}

/**
 * Higher-Order Component for protecting entire pages or sections.
 *
 * @example
 * // protect by permission
 * const AdminPage = withPermission({ permission: 'admin:access' })(AdminDashboard)
 *
 * // protect by role
 * const ReviewerPage = withPermission({ role: 'reviewer' })(ReviewDashboard)
 *
 * // protect by permission + role
 * const SpecialPage = withPermission({
 *   permission: 'edit:posts',
 *   role: 'reviewer',
 *   fallback: <Redirect to="/unauthorized" />
 * })(EditPage)
 */
export function withPermission(options: WithPermissionOptions) {
  return function wrap<P extends object>(
    WrappedComponent: ComponentType<P>
  ): ComponentType<P> {
    const displayName =
      WrappedComponent.displayName || WrappedComponent.name || 'Component'

    function PermissionGate(props: P) {
      const ctx = usePermissionsContext()
      const { permission, resource, mode = 'all', role, roles, fallback = null } = options

      // ── permission check ──
      let permissionGranted = true
      if (permission) {
        if (Array.isArray(permission)) {
          permissionGranted =
            mode === 'any'
              ? ctx.canAny(permission, resource)
              : ctx.canAll(permission, resource)
        } else {
          permissionGranted = ctx.can(permission, resource)
        }
      }

      // ── role check ──
      let roleGranted = true
      if (role) roleGranted = ctx.is(role)
      else if (roles && roles.length > 0) roleGranted = ctx.isAny(roles)

      const allowed = permissionGranted && roleGranted

      if (!allowed) return <>{fallback}</>
      return <WrappedComponent {...props} />
    }

    PermissionGate.displayName = `withPermission(${displayName})`
    return PermissionGate
  }
}
