# Ledger360 Architecture Principles

1. Validate once.
2. Authorize once.
3. Financial invariants cannot be bypassed.
4. Domain services never trust external input.
5. Repository methods always scope by userId.
6. Money is represented in minor units.
7. Serialization only happens at DTO boundaries.
8. Property tests protect accounting identities.
9. Only DTOs may cross the server/client boundary. DTOs must contain only serializable primitives (string, number, boolean, null, plain objects, arrays).
