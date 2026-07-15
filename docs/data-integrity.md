# User, Merchant, and Shop Integrity

The ownership model is intentionally explicit:

- A `user` is an authenticated account.
- A `merchant` is the business identity.
- A `shop` belongs to one merchant.
- A merchant with `user_id = null` is an unclaimed sample or imported business. It is public but cannot access the dashboard or receive owner notifications.
- A claimed merchant has exactly one user account. The database enforces this with a unique index on `merchants.user_id`.

Merchant registration creates the user and merchant inside one database transaction. Run the audit after imports, restores, or migrations:

```powershell
bun run db:audit:identity
```

The command exits with status `1` only for true integrity violations: a merchant linked to a missing user, a shop linked to a missing merchant, or multiple merchants claimed by one user. Unclaimed sample shops are reported separately and do not fail the audit.
