---
name: Auth & Invite Flow
description: Invite-based user registration system — email invites, password setup, role assignment during and after invite
type: project
---

## Authentication
- Login via email + password
- No external auth providers (for now)

## Invite Flow
- Users are invited by providing a comma-separated list of emails
- New users are Editor by default (for internal invites)
- Role can be changed even while invite is still pending
- On accepting invite, user sets their name and password
- First user invited to a customer workspace automatically becomes Customer-owner

## Seed Owner
- Email: admin@kodus.io
- Password: Admin#00
- Created via seed/migration on first deploy
- Can change both email and password after login
