---
name: Customer Workspaces
description: Workspace model for client organizations — creation, fields, assignment rules, and constraints
type: project
---

## Workspace Model
- Created by Owner or Admin
- Fields: name (required, company name), site (optional)
- Each workspace is a client organization's space for managing their tickets

## Constraints
- Customer users (customer-owner, customer-admin, customer-editor) belong to exactly one workspace (1:1)
- Editors (internal) can be assigned to multiple workspaces by Owner/Admin
- One customer-owner per workspace (enforced)
