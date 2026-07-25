# Password recovery QA

| Test | Result | Notes |
|---|---|---|
| Forgot Password required validation | PASS | Email Id is required. |
| Forgot Password sends reset API | FAIL | No API request was sent; the page only navigated locally. |
| Forgot Password opens OTP page | PASS | Final path: /forgot-password-otp |
| OTP page carries entered email | PASS | Entered email is displayed. |
| OTP resend action | FAIL | No API request, navigation, or visible confirmation was produced. |
| OTP is verified by API | FAIL | Any six digits are accepted locally without an API request. |
| OTP opens Set New Password | PASS | Final path: /set-new-password |
| New password is saved by API | FAIL | No API request was sent; success is simulated locally. |
| Password flow returns to Login | PASS | Final path: /login |
| Console/page errors | PASS | 0 console errors, 0 page errors. |

- API requests observed during the entire flow: 0
- Console errors: 0
- Page errors: 0
