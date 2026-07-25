import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.QA_BUILD_URL || 'http://localhost:5174/';
const outputDir = path.resolve('qa-results');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const apiRequests = [];
const consoleErrors = [];
const pageErrors = [];

page.on('request', (request) => {
  if (new URL(request.url()).pathname.toLowerCase().startsWith('/api/')) {
    apiRequests.push({
      method: request.method(),
      url: request.url(),
      postData: request.postData(),
    });
  }
});
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));

const checks = [];
const addCheck = (test, pass, notes) => checks.push({ test, pass, notes });

try {
  await page.goto(new URL('/forgot-password', baseUrl).href, {
    waitUntil: 'domcontentloaded',
    timeout: 15_000,
  });

  const forgotNext = page.getByRole('button', { name: 'Next', exact: true });
  await forgotNext.click();
  await page.waitForTimeout(200);
  const emailValidation = await page
    .locator('.ant-form-item-explain-error')
    .allTextContents();
  addCheck(
    'Forgot Password required validation',
    emailValidation.some((text) => text.includes('Email Id is required')),
    emailValidation.join(' | '),
  );

  const requestsBeforeForgotSubmit = apiRequests.length;
  await page.getByLabel('Email Id', { exact: true }).fill('qa@example.com');
  await forgotNext.click();
  await page.waitForTimeout(300);
  addCheck(
    'Forgot Password sends reset API',
    apiRequests.length > requestsBeforeForgotSubmit,
    apiRequests.length > requestsBeforeForgotSubmit
      ? 'An API request was sent.'
      : 'No API request was sent; the page only navigated locally.',
  );
  addCheck(
    'Forgot Password opens OTP page',
    new URL(page.url()).pathname === '/forgot-password-otp',
    `Final path: ${new URL(page.url()).pathname}`,
  );

  const otpBody = await page.locator('body').innerText();
  addCheck(
    'OTP page carries entered email',
    otpBody.includes('qa@example.com'),
    otpBody.includes('qa@example.com')
      ? 'Entered email is displayed.'
      : 'Entered email is missing.',
  );

  const resend = page.getByRole('button', {
    name: 'Click to resend',
    exact: true,
  });
  const requestsBeforeResend = apiRequests.length;
  const urlBeforeResend = page.url();
  await resend.click();
  await page.waitForTimeout(300);
  addCheck(
    'OTP resend action',
    apiRequests.length > requestsBeforeResend || page.url() !== urlBeforeResend,
    'No API request, navigation, or visible confirmation was produced.',
  );

  const otpInputs = page.locator('input[aria-label^="OTP digit"]');
  const otpCount = await otpInputs.count();
  for (let index = 0; index < otpCount; index += 1) {
    await otpInputs.nth(index).fill(String(index + 1));
  }
  const requestsBeforeOtpSubmit = apiRequests.length;
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.waitForTimeout(300);
  addCheck(
    'OTP is verified by API',
    apiRequests.length > requestsBeforeOtpSubmit,
    apiRequests.length > requestsBeforeOtpSubmit
      ? 'An OTP verification request was sent.'
      : 'Any six digits are accepted locally without an API request.',
  );
  addCheck(
    'OTP opens Set New Password',
    new URL(page.url()).pathname === '/set-new-password',
    `Final path: ${new URL(page.url()).pathname}`,
  );

  await page.getByLabel('Password', { exact: true }).fill('Qa-Test-123!');
  await page
    .getByLabel('New Password', { exact: true })
    .fill('Qa-Test-123!');
  const requestsBeforePasswordSubmit = apiRequests.length;
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.waitForTimeout(500);
  addCheck(
    'New password is saved by API',
    apiRequests.length > requestsBeforePasswordSubmit,
    apiRequests.length > requestsBeforePasswordSubmit
      ? 'A password API request was sent.'
      : 'No API request was sent; success is simulated locally.',
  );
  addCheck(
    'Password flow returns to Login',
    new URL(page.url()).pathname === '/login',
    `Final path: ${new URL(page.url()).pathname}`,
  );
  addCheck(
    'Console/page errors',
    consoleErrors.length === 0 && pageErrors.length === 0,
    `${consoleErrors.length} console errors, ${pageErrors.length} page errors.`,
  );
} finally {
  await mkdir(outputDir, { recursive: true });
  const result = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    checks,
    apiRequests,
    consoleErrors,
    pageErrors,
  };
  const markdown = `# Password recovery QA

| Test | Result | Notes |
|---|---|---|
${checks
  .map(
    (check) =>
      `| ${check.test} | ${check.pass ? 'PASS' : 'FAIL'} | ${String(check.notes).replace(/\|/g, '\\|')} |`,
  )
  .join('\n')}

- API requests observed during the entire flow: ${apiRequests.length}
- Console errors: ${consoleErrors.length}
- Page errors: ${pageErrors.length}
`;
  await writeFile(
    path.join(outputDir, 'auth-flow.json'),
    JSON.stringify(result, null, 2),
  );
  await writeFile(path.join(outputDir, 'auth-flow-report.md'), markdown);
  process.stdout.write(markdown);
  await context.close();
  await browser.close();
}

process.exitCode = checks.every((check) => check.pass) ? 0 : 1;
