export type Permission = string
export type Role = string

/**
 * Normalizes a permission string to lowercase for case-insensitive matching
 */
export function normalizePermission(permission: string): string {
  return permission.trim().toLowerCase()
}

/**
 * Builds a permission string from action + optional resource
 * e.g. ('read', 'posts') => 'read:posts'
 * e.g. ('admin:access') => 'admin:access'
 */
export function buildPermissionString(action: string, resource?: string): string {
  if (!action || typeof action !== 'string') return ''
  const cleanAction = action.trim().toLowerCase()
  if (!resource) return cleanAction
  const cleanResource = resource.trim().toLowerCase()
  return `${cleanAction}:${cleanResource}`
}

/**
 * Core matching logic — checks if a single permission from the list
 * satisfies the requested action + optional resource.
 *
 * Matching priority:
 * 1. '*'              — full wildcard, matches everything
 * 2. 'action:*'       — action wildcard, matches any resource for this action
 * 3. '*:resource'     — resource wildcard, any action on this resource
 * 4. 'action:resource'— exact match
 * 5. 'action'         — exact match (no resource)
 */
export function matchPermission(
  grantedPermission: string,
  action: string,
  resource?: string
): boolean {
  const granted = normalizePermission(grantedPermission)
  const reqAction = action.trim().toLowerCase()
  const reqResource = resource?.trim().toLowerCase()

  // full wildcard
  if (granted === '*') return true

  if (reqResource) {
    const target = `${reqAction}:${reqResource}`
    return (
      granted === target ||              // exact: 'read:posts'
      granted === `${reqAction}:*` ||    // action wildcard: 'read:*'
      granted === `*:${reqResource}` ||  // resource wildcard: '*:posts'
      granted === reqAction              // bare action: 'read'
    )
  }

  // no resource — check if permission is action-only or covers the action with wildcard resource
  return (
    granted === reqAction ||             // exact: 'read'
    granted === `${reqAction}:*` ||      // 'read:*' still satisfies bare 'read'
    granted === '*'                       // already handled above but safe
  )
}

/**
 * Checks if the permissions list satisfies a single action+resource
 */
export function hasPermission(
  permissions: Permission[],
  action: string,
  resource?: string
): boolean {
  if (!Array.isArray(permissions) || permissions.length === 0) return false
  if (!action || typeof action !== 'string') return false
  return permissions.some((p) => matchPermission(p, action, resource))
}

/**
 * Checks if the permissions list satisfies ALL actions in an array
 */
export function hasAllPermissions(
  permissions: Permission[],
  actions: string[],
  resource?: string
): boolean {
  return actions.every((action) => hasPermission(permissions, action, resource))
}

/**
 * Checks if the permissions list satisfies ANY action in an array
 */
export function hasAnyPermission(
  permissions: Permission[],
  actions: string[],
  resource?: string
): boolean {
  return actions.some((action) => hasPermission(permissions, action, resource))
}

/**
 * Checks if the user has a specific role (case-insensitive)
 */
export function matchRole(userRole: Role | undefined, targetRole: Role): boolean {
  if (!userRole || !targetRole) return false
  return userRole.trim().toLowerCase() === targetRole.trim().toLowerCase()
}

/**
 * Checks if the user has ANY of the specified roles
 */
export function matchAnyRole(userRole: Role | undefined, targetRoles: Role[]): boolean {
  return targetRoles.some((r) => matchRole(userRole, r))
}

/**
 * Merges multiple permission arrays, deduplicates, and flattens wildcards smartly.
 * If '*' is present, returns ['*'] since it covers everything.
 */
export function mergePermissions(...permissionSets: Permission[][]): Permission[] {
  const merged = permissionSets.flat()
  if (merged.includes('*')) return ['*']
  return [...new Set(merged.map(normalizePermission))]
}

/**
 * Builds a role permissions map from a config object.
 * Supports spreading multiple groups and inheriting from other roles.
 *
 * Example input:
 * {
 *   admin: ['*'],
 *   editor: ['read:posts', 'edit:posts'],
 *   viewer: ['read:posts'],
 * }
 */
export function buildRolePermissions(
  config: Record<string, Permission[]>
): Record<string, Permission[]> {
  const result: Record<string, Permission[]> = {}
  for (const [role, perms] of Object.entries(config)) {
    result[role.toLowerCase()] = mergePermissions(perms)
  }
  return result
}
