# Security Specification — Andes Fresh ERP (Firestore)

## 1. Data Invariants & Master Source of Truth
- **Identity & RBAC**: Users are authenticated via Firebase Authentication with verified emails (`request.auth.token.email_verified == true`). The bootstrapped administrator (`jarisevermvargas@gmail.com`) is verified via email + `email_verified == true`; other staff roles (`ADMIN` / `VENDEDOR`) are resolved solely from `/users/{uid}` (`rol` + `activo == true`), never from custom claims or client payloads.
- **PII Isolation**: User contact emails live exclusively in `/users/{userId}/private/{docId}` readable only by the document owner or an active `ADMIN`. Non-admins cannot self-assign `rol: 'ADMIN'`.
- **Master Catalog (`categories`, `products`)**: Only active `ADMIN` users can create, update, or delete categories, products, employees, or company settings.
- **Inventory Traceability (`inventory_movements`)**: Stock movements cannot be created with non-positive quantities, negative `stockNuevo`, or tampered `usuarioUid != request.auth.uid`, and historical movement logs are immutable (`allow update, delete: if false`).
- **Orders, Items, Sales & Dispatches**:
  - Order subtotals must satisfy `>= 150` and `total <= subtotal` (`RN-03`, `RN-04`).
  - Line items (`/orders/{orderId}/items/{itemId}`) must reference an existing parent order (`exists(...)` / `existsAfter(...)`) whose `vendedorUid` matches `request.auth.uid` or caller is `ADMIN`.
  - Sales (`/sales/{saleId}`) cannot be altered once `Anulada` unless overridden by `ADMIN`.
  - Dispatches (`/dispatches/{dispatchId}`) and their events (`/dispatches/{dispatchId}/events/{eventId}`) enforce valid transitions, terminal state locking (`Entregado` / `Cancelado`), and parent existence.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Privilege Escalation (`users/{uid}`)**: `{ "uid": "u2", "username": "eve", "nombreCompleto": "Eve", "rol": "ADMIN", "activo": true }` submitted by non-admin -> **REJECTED** (`rol` must equal `'VENDEDOR'`).
2. **Identity Spoofing (`orders/{id}`)**: `{ "vendedorUid": "other_uid", ... }` -> **REJECTED** (`vendedorUid == request.auth.uid` unless `isAdmin()`).
3. **Unverified Email Admin Spoof**: Token with `email: "jarisevermvargas@gmail.com"` and `email_verified: false` -> **REJECTED** (`email_verified == true` required everywhere).
4. **Shadow Field Injection (`products/{id}`)**: Valid product fields + `"isVerified": true` -> **REJECTED** (`keys().hasOnly(...)` blocks ghost fields).
5. **Resource Poisoning / Oversized Document ID**: `products/${"A".repeat(300)}` -> **REJECTED** (`isValidId()` restricts length `<= 128` and regex `^[a-zA-Z0-9_-]+$`).
6. **Negative / Zero Pricing & Stock (`products/{id}`)**: `{ "precioKg": -5, "stockKg": -10 }` -> **REJECTED** (`precioKg > 0 && stockKg >= 0`).
7. **Order Below Minimum (`orders/{id}`)**: `{ "subtotal": 95, "descuento": 0, "total": 95 }` -> **REJECTED** (`subtotal >= 150`).
8. **Orphaned Order Line Item (`orders/missing_id/items/item1`)**: Creating an item whose parent `/orders/missing_id` does not exist -> **REJECTED** (`exists(...) || existsAfter(...)`).
9. **Terminal State Bypass (`dispatches/{id}`)**: Vendedor attempting to change `estadoLogistico` from `'Entregado'` back to `'Pendiente'` -> **REJECTED** (terminal state locked unless `isAdmin()`).
10. **Client Timestamp Tampering (`orders/{id}`)**: `{ "createdAt": "2020-01-01T00:00:00Z" }` -> **REJECTED** (`incoming().createdAt == request.time`).
11. **Cross-User PII Read (`users/uidA/private/info`)**: Non-admin user `uidB` attempting `get` -> **REJECTED** (`isOwner(userId) || isAdmin()`).
12. **Immutable Ledger Tampering (`inventory_movements/{id}`)**: Attempting `update` or `delete` on movement history -> **REJECTED** (`allow update, delete: if false`).
