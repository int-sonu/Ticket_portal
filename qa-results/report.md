# Local QA comparison

- Baseline: http://localhost:5173/
- Build: http://localhost:5174/
- Result: **DIFFERENCES FOUND**

| Test | Baseline (5173) | Build (5174) | Pass/Fail | Notes |
|---|---|---|---|---|
| Server/navigation | ERROR: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/ Call log: [2m - navigating to "http://localhost:5173/", waiting until "domcontentloaded"[22m | HTTP 200 | FAIL | Both root URLs must load successfully. |
| Visible page content | Blank/broken | 115 text chars | FAIL | Checks rendered body text and visible elements. |
| Page title | (empty) | ticket_portal | FAIL | Titles should match. |
| Final route | blank | /login | FAIL | Includes redirects such as unauthenticated /login. |
| Console/page errors | 0 console, 0 page | 0 console, 0 page | PASS | Build should not introduce runtime errors. |
| Failed requests | 1 failed | 0 failed | FAIL | Transport-level failures. |
| HTTP 4xx/5xx responses | 0 errors | 0 errors | PASS | All observed resources and API responses. |
| Visible key UI elements | 0 key elements | 10 key elements | FAIL | 0 missing, 10 extra. |
| DOM structure | e3b0c44298fc1c14 | 6db14e1cbbba8488 | FAIL | Tag-tree lengths: 0 vs 298. |
| Layout/computed styles | Reference geometry | 0 differences | PASS | Flags >4px geometry changes or computed style changes. |
| Visible links | 0 broken | 0 broken | PASS | Same-origin visible links are opened in isolated pages. |
| Login form validation | Unavailable/failed | Working | FAIL | Submits the login form empty and expects three required-field messages. |
| Register button action | Unavailable/failed | No observable action | FAIL | Checks for navigation, dialog, message, or visible content change. |

## Build issues

- Extra element: h1|||||Welcome back !
- Extra element: form|||||Company CodeUser NamePasswordForgot password?RegisterSign In
- Extra element: input||||text|
- Extra element: input||||text|
- Extra element: input||||password|
- Extra element: span|button|Show|||
- Extra element: span|img|eye-invisible|||
- Extra element: a|||||Forgot password?
- Extra element: button||||button|Register
- Extra element: button||||submit|Sign In
- Functional check failed: Register button action — No navigation, dialog, message, or visible content change.

## Artifacts

- Baseline screenshot: `D:\Sonu\Ticket\Ticket_portal\qa-results\baseline-5173.png`
- Build screenshot: `D:\Sonu\Ticket\Ticket_portal\qa-results\build-5174.png`
- Full machine-readable results: `D:\Sonu\Ticket\Ticket_portal\qa-results\comparison.json`
