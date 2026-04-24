// Provider & Context
export { PermissionsProvider } from './context'
export type { PermissionsProviderProps, PermissionsContextValue } from './context'

// Components
export { Can } from './Can'
export type { CanProps } from './Can'

// Hooks
export { usePermissions } from './usePermissions'

// HOC
export { withPermission } from './withPermission'
export type { WithPermissionOptions } from './withPermission'

// Utilities — exported so users can build their own helpers
export {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  matchRole,
  matchAnyRole,
  mergePermissions,
  buildRolePermissions,
  buildPermissionString,
  normalizePermission,
} from './utils'
export type { Permission, Role } from './utils'
