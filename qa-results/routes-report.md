# Route sweep

- Routes tested: 13
- Baseline: unreachable — page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/ Call log: [2m - navigating to "http://localhost:5173/", waiting until "domcontentloaded"[22m
- Build: reachable
- Build route checks passed: 13/13

| Route | Baseline (5173) | Build (5174) | Result | Notes |
|---|---|---|---|---|
| /bills | BLOCKED: server unavailable | PASS → /login | BLOCKED | private route |
| /callreports | BLOCKED: server unavailable | PASS → /login | BLOCKED | private route |
| /dashboard | BLOCKED: server unavailable | PASS → /login | BLOCKED | private route |
| /forgot-password | BLOCKED: server unavailable | PASS → /forgot-password | BLOCKED | public route |
| /forgot-password-otp | BLOCKED: server unavailable | PASS → /forgot-password-otp | BLOCKED | public route |
| /item-repair/assign | BLOCKED: server unavailable | PASS → /login | BLOCKED | private route |
| /login | BLOCKED: server unavailable | PASS → /login | BLOCKED | public route |
| /masters/agent | BLOCKED: server unavailable | PASS → /login | BLOCKED | private route |
| /more/customer-details | BLOCKED: server unavailable | PASS → /login | BLOCKED | private route |
| /reports | BLOCKED: server unavailable | PASS → /login | BLOCKED | private route |
| /set-new-password | BLOCKED: server unavailable | PASS → /set-new-password | BLOCKED | public route |
| /settings/features | BLOCKED: server unavailable | PASS → /login | BLOCKED | private route |
| /tickets | BLOCKED: server unavailable | PASS → /login | BLOCKED | private route |

## Build failures

- No failures in the unauthenticated route sweep.
