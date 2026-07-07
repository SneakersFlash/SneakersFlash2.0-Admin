---
name: new-module
description: Scaffold a new admin dashboard module following the sneakersflash-admin conventions. Invoke with the module name as an argument (e.g. /new-module vouchers).
---

The user wants to scaffold a new dashboard module. The module name is: $ARGUMENTS

Follow these steps exactly, using the existing modules (e.g. `orders`, `products`, `brands`) as reference for naming and structure.

## Files to create

### 1. Types — `src/types/<module>.types.ts`
Define the primary entity type using `type` (not `interface`). Include at minimum an `id` field. Model it after `src/types/order.types.ts` or a similar existing file.

### 2. Service — `src/services/<module>.service.ts`
Create async functions for CRUD operations using the Axios instance from `src/lib/api.ts`.
Pattern to follow: `src/services/brands.service.ts`.
All functions return typed responses matching the types defined in step 1.

### 3. Zod validator (optional if the module has create/edit forms) — `src/lib/validators/<module>.validator.ts`
Define Zod schemas for create and update operations. Export the inferred types.
Pattern: `src/lib/validators/`.

### 4. Page route — `src/app/(dashboard)/dashboard/<module>/page.tsx`
A Next.js page that renders the list/index view. Use `"use client"` if it needs React Query or state.
Pattern to follow: `src/app/(dashboard)/dashboard/brands/page.tsx` or similar.

### 5. Components directory — `src/components/module/<module>/`
Create at minimum:
- `<Module>List.tsx` — table/list component using TanStack Table
- `<Module>Form.tsx` — create/edit form using React Hook Form + Zod resolver

## Checklist before finishing
- [ ] All types use `type`, not `interface`
- [ ] Named exports only (no default exports except the page.tsx)
- [ ] Service functions are typed end-to-end
- [ ] Path aliases use `@/` not relative `../../`
- [ ] No `tailwind.config.js` modifications (TailwindCSS v4, config in globals.css)

After scaffolding, tell the user which files were created and remind them to add the module link to the sidebar navigation component (check `src/components/layout/` for the sidebar).
