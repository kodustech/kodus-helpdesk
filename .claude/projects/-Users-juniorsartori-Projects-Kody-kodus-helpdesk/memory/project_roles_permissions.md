---
name: Roles & Permissions Model
description: 6 user roles with detailed permission matrix — internal (owner, admin, editor) and external (customer-owner, customer-admin, customer-editor)
type: project
---

## Internal Roles (Kodus team)

**Owner**
- Full access to everything, all workspaces
- Only role that can create/edit other owners
- Only role that can edit admin roles
- Can create all role types
- Seed account: admin@kodus.io / Admin#00 (created via seed/migration, can change email and password after first login)
- Multiple owners can exist

**Admin**
- Full access to all clients/workspaces
- Can create: Editor, Customer-admin, Customer-editor
- Can promote Editor → Admin
- Cannot create/edit Owner or other Admin roles
- Can create customer workspaces

**Editor**
- Can only see workspaces they are assigned to (assigned by Owner/Admin)
- Can be assigned to multiple workspaces
- Can manage tickets in assigned workspaces
- Cannot create/invite users

## External Roles (Client side)

**Customer-owner**
- One per workspace (unique constraint)
- Created automatically: first user invited to a workspace becomes customer-owner
- Cannot be removed by anyone (only via direct DB if needed)
- Can transfer ownership to another user in workspace (transferee becomes customer-owner, transferor becomes customer-admin)
- Can create customer-admin and customer-editor in their workspace
- Can only see their own workspace tickets

**Customer-admin**
- Tied to one workspace (1:1)
- Can create and remove customer-admin and customer-editor in their workspace
- Can only see their own workspace tickets

**Customer-editor**
- Tied to one workspace (1:1)
- Can open tickets, add comments
- Can only see their own workspace tickets
- Cannot manage users
