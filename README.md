# react-permissions-solution

> Lightweight, declarative role-based and permission-based UI rendering for React.  
> TypeScript-first. Zero dependencies. Full wildcard support. Flexible by design.

[![npm version](https://img.shields.io/npm/v/react-permissions-solution)](https://www.npmjs.com/package/react-permissions-solution)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-permissions-solution)](https://bundlephobia.com/package/react-permissions-solution)
[![license](https://img.shields.io/npm/l/react-permissions-solution)](./LICENSE)

---

## Why react-permissions-solution?

Every app with users has roles. Every app with roles ends up with code like this scattered everywhere:

```tsx
{user.role === 'admin' && <DeleteButton />}
{user.role === 'admin' || user.role === 'reviewer' ? <EditButton /> : null}
{permissions.includes('read:posts') && <PostList />}
```

This approach breaks down fast — logic is duplicated, hard to trace, and impossible to change safely.

`react-permissions-solution` gives you a **single source of truth** for access control, a **declarative API** to use it, and the **flexibility** to plug in any backend.

---

## Installation

```bash
npm install react-permissions-solution
# or
yarn add react-permissions-solution
# or
pnpm add react-permissions-solution
```

**Peer dependencies:** React 17+

---

## Quick Start

### 1. Define your permissions

```ts
// permissions.config.ts
export const ROLES = {
  admin:    ['*'],
  reviewer: ['read:posts', 'edit:posts', 'approve:posts', 'read:users'],
  student:  ['read:posts', 'read:courses', 'submit:assignments'],
  user:     ['read:posts', 'create:comments'],
}
```

### 2. Wrap your app

```tsx
// App.tsx
import { PermissionsProvider } from 'react-permissions-solution'
import { ROLES } from './permissions.config'

function App() {
  const { user } = useAuth()

  return (
    <PermissionsProvider
      role={user.role}
      permissions={ROLES[user.role] ?? []}
    >
      <Router />
    </PermissionsProvider>
  )
}
```

### 3. Use it anywhere

```tsx
import { Can, usePermissions } from 'react-permissions-solution'

// Component-based
<Can do="delete" on="posts">
  <DeleteButton />
</Can>

// Hook-based
const { can, is } = usePermissions()
if (can('delete', 'posts')) { ... }
if (is('admin')) { ... }
```

---

## Core Concepts

### Permission format

Permissions are plain strings. The recommended format is `action:resource`:

```
'read:posts'
'edit:users'
'approve:comments'
```

But you can use any format that fits your system:

```
'admin:access'
'feature_x_enabled'
'can_export_pdf'
```

### Wildcards

| Permission | Matches |
|---|---|
| `*` | Everything — full access |
| `read:*` | Any `read` action on any resource |
| `*:posts` | Any action on `posts` |
| `read:posts` | Exactly `read` on `posts` |

---

## API Reference

### `<PermissionsProvider>`

Wraps your app (or any subtree). Must be a parent of any `<Can>` or `usePermissions()` usage.

```tsx
<PermissionsProvider
  permissions={['read:posts', 'edit:posts']}
  role="reviewer"
  extraPermissions={['approve:posts']}   // merged on top of permissions
>
  {children}
</PermissionsProvider>
```

| Prop | Type | Required | Description |
|---|---|---|---|
| `permissions` | `string[]` | ✅ | The user's permissions |
| `role` | `string` | ❌ | The user's role |
| `extraPermissions` | `string[]` | ❌ | Additional permissions merged on top (e.g. user-level overrides) |

---

### `<Can>`

Declarative component for conditional rendering.

```tsx
<Can
  do="edit"
  on="posts"
  mode="all"
  role="reviewer"
  fallback={<p>Access denied</p>}
>
  <EditButton />
</Can>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `do` | `string \| string[]` | required | Action(s) to check |
| `on` | `string` | `undefined` | Resource to check against |
| `mode` | `'all' \| 'any'` | `'all'` | When `do` is array: must have ALL or ANY |
| `fallback` | `ReactNode` | `null` | What to render when check fails |
| `role` | `string` | `undefined` | Also requires this exact role |
| `roles` | `string[]` | `undefined` | Also requires ANY of these roles |
| `not` | `boolean` | `false` | Invert — show when permission is NOT granted |

#### Examples

```tsx
// Basic
<Can do="read" on="posts">
  <PostList />
</Can>

// With fallback
<Can do="edit" on="posts" fallback={<ReadOnlyView />}>
  <EditForm />
</Can>

// Multiple permissions — all required (default)
<Can do={['edit', 'publish']} on="posts">
  <PublishButton />
</Can>

// Multiple permissions — any is enough
<Can do={['edit', 'approve']} on="posts" mode="any">
  <ActionPanel />
</Can>

// Require a specific role too
<Can do="edit" on="posts" role="reviewer">
  <ReviewerEditPanel />
</Can>

// Invert — show to users WITHOUT this permission
<Can do="admin:access" not>
  <UpgradeBanner />
</Can>

// Role-only check (no permission needed)
<Can do="*" role="admin">
  <AdminBadge />
</Can>
```

---

### `usePermissions()`

Hook that gives you the full permissions API.

```tsx
const {
  can,         // (action, resource?) => boolean
  canAll,      // (actions[], resource?) => boolean
  canAny,      // (actions[], resource?) => boolean
  cannot,      // (action, resource?) => boolean  (negation of can)
  is,          // (role) => boolean
  isAny,       // (roles[]) => boolean
  permissions, // string[] — the full list
  role,        // string | undefined — the current role
} = usePermissions()
```

#### Examples

```tsx
function PostActions({ post }) {
  const { can, is } = usePermissions()

  // Use in conditionals
  if (!can('read', 'posts')) return <Navigate to="/unauthorized" />

  return (
    <div>
      <ViewButton />
      {can('edit', 'posts') && <EditButton />}
      {can('delete', 'posts') && <DeleteButton />}
      {is('admin') && <AdminControls />}
    </div>
  )
}
```

```tsx
// In event handlers
function handleDelete() {
  if (!can('delete', 'posts')) {
    toast.error('You do not have permission to delete posts')
    return
  }
  deletePost(post.id)
}
```

```tsx
// canAll — require multiple permissions
const canPublish = canAll(['edit', 'publish'], 'posts')

// canAny — require at least one
const canModerate = canAny(['edit', 'delete', 'approve'], 'posts')
```

---

### `withPermission(options)(Component)`

HOC for protecting entire pages or sections.

```tsx
import { withPermission } from 'react-permissions-solution'

// Protect by permission
const AdminPage = withPermission({
  permission: 'admin:access',
  fallback: <Navigate to="/unauthorized" />,
})(AdminDashboard)

// Protect by role
const ReviewerPage = withPermission({
  role: 'reviewer',
  fallback: <p>Reviewers only</p>,
})(ReviewDashboard)

// Protect by permission AND role
const SpecialPage = withPermission({
  permission: 'edit:posts',
  role: 'reviewer',
})(EditPage)

// Protect by any of multiple permissions (mode: 'any')
const ModPage = withPermission({
  permission: ['edit:posts', 'delete:posts'],
  mode: 'any',
})(ModerationPanel)
```

| Option | Type | Description |
|---|---|---|
| `permission` | `string \| string[]` | Required permission(s) |
| `resource` | `string` | Resource to check against |
| `mode` | `'all' \| 'any'` | Array match mode (default: `'all'`) |
| `role` | `string` | Required role |
| `roles` | `string[]` | Any of these roles |
| `fallback` | `ReactNode` | Rendered when denied (default: `null`) |

---

## Utility Functions

All core functions are exported — use them to build your own helpers.

```ts
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  matchRole,
  matchAnyRole,
  mergePermissions,
  buildRolePermissions,
  buildPermissionString,
} from 'react-permissions-solution'
```

### `mergePermissions(...permissionSets)`

Merges multiple permission arrays. Deduplicates. Collapses to `['*']` if wildcard is present.

```ts
mergePermissions(
  ROLES['reviewer'],
  user.extraPermissions,
)
```

### `buildRolePermissions(config)`

Normalizes a role config object (lowercases keys, deduplicates permissions).

```ts
const roles = buildRolePermissions({
  ADMIN:    ['*'],
  Reviewer: ['read:posts', 'edit:posts', 'read:posts'],  // deduped
})
// → { admin: ['*'], reviewer: ['read:posts', 'edit:posts'] }
```

---

## Real-World Patterns

### Pattern 1 — Hardcoded roles with groups

Best for: small-medium apps with fixed roles.

```ts
// permissions.config.ts
const PERMISSIONS = {
  posts: {
    all:      ['read:posts', 'create:posts', 'edit:posts', 'delete:posts'],
    readOnly: ['read:posts'],
    editor:   ['read:posts', 'create:posts', 'edit:posts'],
  },
  users: {
    all:      ['read:users', 'create:users', 'edit:users', 'delete:users'],
    readOnly: ['read:users'],
  },
}

export const ROLES = {
  admin:    ['*'],
  reviewer: [...PERMISSIONS.posts.editor, 'approve:posts', ...PERMISSIONS.users.readOnly],
  student:  ['read:posts', 'read:courses', 'submit:assignments'],
  user:     ['read:posts', 'create:comments'],
}
```

### Pattern 2 — Backend-driven permissions

Best for: apps where admins manage roles/permissions at runtime.

```tsx
function App() {
  const { user } = useAuth()

  return (
    <PermissionsProvider
      role={user.role}
      permissions={user.permissions}   // straight from your API response
    >
      <Router />
    </PermissionsProvider>
  )
}
```

Your API just needs to return the permissions array:
```json
{
  "role": "reviewer",
  "permissions": ["read:posts", "edit:posts", "approve:posts"]
}
```

### Pattern 3 — User-level overrides on top of roles

Best for: enterprise apps where individual users can have extra permissions.

```tsx
<PermissionsProvider
  role={user.role}
  permissions={ROLES[user.role]}
  extraPermissions={user.extraPermissions}   // merged automatically
>
```

### Pattern 4 — Protecting routes

```tsx
// ProtectedRoute.tsx
import { withPermission } from 'react-permissions'
import { Navigate } from 'react-router-dom'

export function requirePermission(permission: string) {
  return function protect<P extends object>(Component: ComponentType<P>) {
    return withPermission({
      permission,
      fallback: <Navigate to="/unauthorized" replace />,
    })(Component)
  }
}

// Usage
const AdminPage = requirePermission('admin:access')(AdminDashboard)
const ReviewPage = requirePermission('approve:posts')(ReviewDashboard)
```

### Pattern 5 — Outside React (e.g. API calls)

```ts
import { hasPermission } from 'react-permissions-solution'

// in your API service layer
async function deletePost(id: string, userPermissions: string[]) {
  if (!hasPermission(userPermissions, 'delete', 'posts')) {
    throw new Error('Forbidden')
  }
  return api.delete(`/posts/${id}`)
}
```

---

## Edge Cases Handled

| Case | Behavior |
|---|---|
| `permissions` is empty `[]` | All `can()` calls return `false` |
| `permissions` contains `'*'` | All `can()` calls return `true` |
| `do` is empty string | Returns `false` gracefully |
| `role` is `undefined` | `is()` always returns `false` |
| Used outside `<PermissionsProvider>` | Throws a clear, descriptive error |
| Permission strings with different casing | Normalized — case-insensitive matching |
| `extraPermissions` contains `'*'` | Full access granted, `mergePermissions` collapses to `['*']` |
| `do={[]}` (empty array) with mode `all` | Returns `true` (vacuously true — no requirements) |
| `do={[]}` with mode `any` | Returns `false` (nothing to match) |

---

## TypeScript

Everything is fully typed. Key types you can import:

```ts
import type {
  Permission,           // string
  Role,                 // string
  PermissionsContextValue,
  PermissionsProviderProps,
  CanProps,
  WithPermissionOptions,
} from 'react-permissions-solution'
```

---

## Bundle Size

- Zero runtime dependencies
- Tree-shakeable (pure ESM + CJS)
- ~2KB minzipped

---

## License

MIT
