# Admin privacy boundary

This project keeps users' financial data private even from platform operators.

The admin interface and admin API may inspect account identity, subscription status, and support metadata, but they must not query or render financial records such as transactions, balances, budgets, goals, or recurring definitions. The boundary lives in the dedicated admin query layer under `src/server/admin/` so that admin routes cannot accidentally fall back to the regular user repositories that include full financial relations.

For the rationale behind this rule, see the implementation prompt in the repo root or the product note for the admin privacy restriction.