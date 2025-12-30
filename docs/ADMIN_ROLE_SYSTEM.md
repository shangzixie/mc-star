# Admin Role System Documentation

This document describes the role-based access control (RBAC) system implemented with two roles: `user` (default) and `admin`.

## Overview

The system now supports two user roles:
- **user**: Regular users with standard access
- **admin**: Administrators with elevated privileges to manage users and system settings

## Database Changes

### Schema Updates

1. **User Table**: Updated the `role` field in the `user` table:
   - Type: `text`
   - Default: `'user'`
   - Required: `true`
   - Possible values: `'user'`, `'admin'`

2. **Invitation Table**: New table for managing user invitations:
   - `id`: Primary key
   - `email`: Unique email address for invitation
   - `invitedBy`: Foreign key to the admin user who sent the invitation
   - `token`: Unique token for invitation verification
   - `expiresAt`: Expiration timestamp (7 days from creation)
   - `usedAt`: Timestamp when invitation was accepted
   - `createdAt`, `updatedAt`: Standard timestamps

### Migration

A migration file has been generated at `src/db/migrations/0001_left_jackpot.sql`. To apply it:

```bash
pnpm db:push
```

Or for production:

```bash
pnpm db:migrate
```

## Admin Features

### 1. User Invitation System

**Location**: Admin Users page (`/admin/users`)

Admins can invite new users by email:
- Click the "Invite User" button in the admin users page
- Enter the email address of the person to invite
- An invitation email with a unique token is sent
- The invitation expires after 7 days
- Prevents duplicate invitations to the same email

**Implementation**:
- Server action: `src/actions/admin-invite-user.ts`
- UI component: `src/components/admin/invite-user-dialog.tsx`
- Email template: `src/mail/templates/invite-user.tsx`

### 2. User Management

**Location**: Admin Users page (`/admin/users`)

Admins can:
- View all registered users in a data table
- Search and filter users by role and status
- Delete regular users (cannot delete other admins or themselves)

**Implementation**:
- Server action: `src/actions/admin-delete-user.ts`
- UI component: `src/components/admin/delete-user-button.tsx`
- Page: `src/app/[locale]/(protected)/admin/users/page.tsx`

### 3. Dashboard Admin Section

**Location**: Dashboard page (`/dashboard`)

Admins see an additional "Admin" section on the dashboard with quick links to:
- User Management
- (Future: More admin functions)

**Implementation**:
- Component: `src/components/dashboard/admin-section.tsx`
- Automatically hidden for regular users using role check

## Security & Access Control

### Middleware Protection

The middleware now checks user roles for admin-only routes:

1. **Route Configuration** (`src/routes.ts`):
   ```typescript
   export const adminOnlyRoutes = [Routes.AdminUsers];
   ```

2. **Middleware Check** (`src/middleware.ts`):
   - Verifies user is logged in for protected routes
   - Checks if user has `admin` role for admin-only routes
   - Redirects non-admin users to dashboard if they try to access admin routes

### Server Actions

All admin actions use `adminActionClient` from `src/lib/safe-action.ts`:
- Automatically checks if user is authenticated
- Verifies user has `admin` role
- Returns error if user lacks permissions

Example:
```typescript
export const adminInviteUserAction = adminActionClient
  .schema(inviteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user is guaranteed to be an admin
    // ...
  });
```

## Setting Up the First Admin

To set the first user as admin, use the provided script:

```bash
tsx scripts/set-admin-role.ts user@example.com
```

This script:
1. Finds the user by email
2. Updates their role to `admin`
3. Confirms the change

**Alternative**: Manually update in the database:
```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your@email.com';
```

## Email Templates

### Invite User Email

Template: `src/mail/templates/invite-user.tsx`

Translations:
- English: `messages/en.json` → `Mail.inviteUser`
- Chinese: `messages/zh.json` → `Mail.inviteUser`

The email includes:
- Invitation message with admin's name
- "Accept Invitation" button linking to registration page with token
- Expiry notice (7 days)

## Translations

All admin features are fully internationalized in English and Chinese:

### English (`messages/en.json`)
```json
{
  "Dashboard": {
    "admin": {
      "users": {
        "invite": { ... },
        "delete": { ... }
      }
    }
  },
  "Mail": {
    "inviteUser": { ... }
  }
}
```

### Chinese (`messages/zh.json`)
Similar structure with Chinese translations.

## UI Components

### Admin Section Card
- Shows only for admin users
- Displays on the main dashboard
- Provides quick access to admin functions

### Invite User Dialog
- Modal dialog with email input
- Form validation
- Success/error toast notifications
- Prevents inviting existing users

### Delete User Button
- Appears in user table actions column
- Confirmation dialog before deletion
- Hidden for admin users (cannot delete admins)
- Shows icon button with trash icon

### Users Table
- Displays all users with sortable columns
- Filters by role (admin/user) and status (active/banned)
- Search by name, email, or customer ID
- Actions column with delete button

## API Endpoints

The system uses Better Auth's built-in admin plugin, which provides:
- User management endpoints
- Session verification
- Role checking

Custom server actions:
- `adminInviteUserAction`: Invite users by email
- `adminDeleteUserAction`: Delete regular users
- Protected by `adminActionClient`

## Testing

To test the admin system:

1. **Set yourself as admin**:
   ```bash
   tsx scripts/set-admin-role.ts your@email.com
   ```

2. **Login and verify**:
   - Navigate to http://localhost:3000/zh/dashboard
   - You should see the "Admin" section
   - Click on "User Management" or navigate to `/admin/users`

3. **Test invite user**:
   - Click "Invite User" button
   - Enter an email address
   - Check the email inbox for invitation

4. **Test delete user**:
   - Find a regular user in the table
   - Click the delete button (trash icon)
   - Confirm deletion
   - User should be removed from the list

5. **Test access control**:
   - Logout
   - Login with a regular user account
   - Try to access `/admin/users` - should redirect to dashboard
   - Dashboard should not show admin section

## Future Enhancements

Potential additions to the admin system:

1. **Bulk Operations**: Select and manage multiple users at once
2. **User Analytics**: View user statistics and activity
3. **Role Management**: Add more granular roles (e.g., moderator)
4. **Audit Log**: Track admin actions for security
5. **System Settings**: Admin interface for application configuration
6. **Email Verification**: Require invited users to verify their email
7. **Invitation Management**: View and revoke pending invitations

## Troubleshooting

### Users can't access admin features
- Verify user role in database: `SELECT role FROM "user" WHERE email = '...'`
- Check middleware logs for role verification
- Ensure user is logged in with correct session

### Invitation emails not sending
- Check email provider configuration in `.env`
- Verify `RESEND_API_KEY` is set
- Check server logs for email sending errors

### Admin section not showing
- Verify user role is exactly `'admin'` (lowercase)
- Check browser console for any errors
- Clear browser cache and reload

### Role not updating
- Run database migration: `pnpm db:push`
- Verify schema changes applied: Check `role` column in `user` table
- Restart development server

## Security Notes

- Admin privileges are permanent once granted
- Only admins can invite new users (registration is disabled)
- Admins cannot delete other admins or themselves
- All admin actions are protected by middleware and server action guards
- Invitation tokens expire after 7 days
- Each invitation token is unique and can only be used once

## File Structure

```
src/
├── actions/
│   ├── admin-invite-user.ts       # Invite user server action
│   └── admin-delete-user.ts       # Delete user server action
├── components/
│   ├── admin/
│   │   ├── invite-user-dialog.tsx # Invite user UI
│   │   ├── delete-user-button.tsx # Delete user UI
│   │   ├── users-table.tsx        # User management table
│   │   └── users-page-client.tsx  # User page wrapper
│   └── dashboard/
│       └── admin-section.tsx      # Dashboard admin section
├── db/
│   ├── schema.ts                  # Updated with role & invitation
│   └── migrations/
│       └── 0001_left_jackpot.sql  # Role & invitation migration
├── mail/
│   └── templates/
│       └── invite-user.tsx        # Invitation email template
├── middleware.ts                  # Admin route protection
└── routes.ts                      # Route configuration

scripts/
└── set-admin-role.ts              # Helper script to set admin

messages/
├── en.json                        # English translations
└── zh.json                        # Chinese translations
```

## Package.json Scripts

Add to `package.json` for convenience:

```json
{
  "scripts": {
    "admin:set": "tsx scripts/set-admin-role.ts"
  }
}
```

Usage:
```bash
pnpm admin:set user@example.com
```

