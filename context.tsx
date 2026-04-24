import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  matchRole,
  matchAnyRole,
  mergePermissions,
  type Permission,
  type Role,
} from './utils'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PermissionsContextValue {
  /** List of permissions the current user has */
  permissions: Permission[]
  /** The current user's role */
  role: Role | undefined
  /**
   * Check if the user has a specific permission.
   * @param action - the action (e.g. 'read') or full permission string (e.g. 'read:posts')
   * @param resource - optional resource (e.g. 'posts')
   */
  can: (action: string, resource?: string) => boolean
  /**
   * Check if the user has ALL of the given permissions.
   * @param actions - array of actions to check
   * @param resource - optional shared resource
   */
  canAll: (actions: string[], resource?: string) => boolean
  /**
   * Check if the user has ANY of the given permissions.
   * @param actions - array of actions to check
   * @param resource - optional shared resource
   */
  canAny: (actions: string[], resource?: string) => boolean
  /**
   * Check if the user's role matches the given role (case-insensitive)
   */
  is: (role: Role) => boolean
  /**
   * Check if the user's role matches ANY of the given roles
   */
  isAny: (roles: Role[]) => boolean
  /**
   * Check if user does NOT have a permission
   */
  cannot: (action: string, resource?: string) => boolean
}

export interface PermissionsProviderProps {
  /** Permissions the current user has */
  permissions: Permission[]
  /** The current user's role */
  role?: Role
  /** Extra permissions to merge on top of the base permissions */
  extraPermissions?: Permission[]
  children: ReactNode
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const PermissionsContext = createContext<PermissionsContextValue | null>(null)
PermissionsContext.displayName = 'PermissionsContext'

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function PermissionsProvider({
  permissions: basePerm,
  role,
  extraPermissions = [],
  children,
}: PermissionsProviderProps) {
  const permissions = useMemo(
    () => mergePermissions(basePerm ?? [], extraPermissions),
    [basePerm, extraPermissions]
  )

  const value = useMemo<PermissionsContextValue>(
    () => ({
      permissions,
      role,
      can: (action, resource) => hasPermission(permissions, action, resource),
      canAll: (actions, resource) => hasAllPermissions(permissions, actions, resource),
      canAny: (actions, resource) => hasAnyPermission(permissions, actions, resource),
      is: (r) => matchRole(role, r),
      isAny: (roles) => matchAnyRole(role, roles),
      cannot: (action, resource) => !hasPermission(permissions, action, resource),
    }),
    [permissions, role]
  )

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

// ─────────────────────────────────────────────
// Internal hook (used by all other hooks/components)
// ─────────────────────────────────────────────

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext)
  if (!ctx) {
    throw new Error(
      '[react-permissions] usePermissions / <Can> must be used inside <PermissionsProvider>.\n' +
        'Make sure you have wrapped your app (or the relevant subtree) with <PermissionsProvider>.'
    )
  }
  return ctx
}
