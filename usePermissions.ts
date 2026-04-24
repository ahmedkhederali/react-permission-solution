import { usePermissionsContext, type PermissionsContextValue } from './context'

/**
 * Hook to access the full permissions context.
 *
 * @example
 * const { can, canAll, canAny, is, isAny, cannot, permissions, role } = usePermissions()
 *
 * can('read', 'posts')           // → boolean
 * canAll(['read','edit'], 'posts') // → boolean (must have both)
 * canAny(['edit','delete'], 'posts') // → boolean (at least one)
 * is('admin')                    // → boolean
 * isAny(['admin','reviewer'])    // → boolean
 * cannot('delete', 'users')      // → boolean (negation)
 */
export function usePermissions(): PermissionsContextValue {
  return usePermissionsContext()
}
