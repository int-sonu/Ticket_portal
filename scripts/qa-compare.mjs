import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baselineUrl = process.env.QA_BASELINE_URL || 'http://localhost:5173/';
const buildUrl = process.env.QA_BUILD_URL || 'http://localhost:5174/';
const outputDir = path.resolve('qa-results');
const viewport = { width: 1440, height: 900 };

const hash = (value) =>
  createHash('sha256').update(String(value)).digest('hex').slice(0, 16);

const unique = (values) => [...new Set(values)];

const cleanText = (value = '') => value.replace(/\s+/g, ' ').trim();

const testTarget = async (browser, label, url) => {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const errorResponses = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(cleanText(message.text()));
    }
  });
  page.on('pageerror', (error) => pageErrors.push(cleanText(error.message)));
  page.on('requestfailed', (request) => {
    failedRequests.push({
      method: request.method(),
      url: request.url(),
      error: request.failure()?.errorText || 'Unknown request failure',
    });
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      errorResponses.push({
        status: response.status(),
        method: response.request().method(),
        url: response.url(),
      });
    }
  });

  let navigationStatus = null;
  let navigationError = null;
  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    navigationStatus = response?.status() ?? null;
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
    await page.waitForTimeout(750);
  } catch (error) {
    navigationError = cleanText(error.message);
  }

  const screenshotPath = path.join(outputDir, `${label}.png`);
  let snapshot = {
    title: '',
    finalUrl: page.url(),
    bodyText: '',
    bodyHtml: '',
    structure: '',
    metrics: {},
    visibleElements: [],
    links: [],
  };

  if (!navigationError) {
    snapshot = await page.evaluate(() => {
      const normalizeText = (value = '') =>
        value.replace(/\s+/g, ' ').trim();
      const isVisible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number(style.opacity) > 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      };
      const structureOf = (node, depth = 0) => {
        if (!(node instanceof Element) || depth > 8) return '';
        const children = [...node.children]
          .map((child) => structureOf(child, depth + 1))
          .join('');
        return `<${node.tagName.toLowerCase()}>${children}</${node.tagName.toLowerCase()}>`;
      };
      const candidates = [
        ...document.querySelectorAll(
          'header,nav,main,aside,form,h1,h2,h3,a,button,input,select,textarea,[role]',
        ),
      ].filter(isVisible);
      const visibleElements = candidates.map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const text = normalizeText(
          element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement
            ? element.value || element.placeholder
            : element.textContent || '',
        ).slice(0, 100);

        return {
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          aria: element.getAttribute('aria-label') || '',
          name: element.getAttribute('name') || '',
          type: element.getAttribute('type') || '',
          text,
          href:
            element instanceof HTMLAnchorElement
              ? element.href
              : '',
          box: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          style: {
            display: style.display,
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontSize: style.fontSize,
          },
        };
      });

      return {
        title: document.title,
        finalUrl: location.href,
        bodyText: normalizeText(document.body?.innerText || ''),
        bodyHtml: document.body?.innerHTML || '',
        structure: structureOf(document.body),
        metrics: {
          totalElements: document.querySelectorAll('*').length,
          visibleElements: [...document.querySelectorAll('body *')].filter(
            isVisible,
          ).length,
          headings: document.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
          links: document.querySelectorAll('a[href]').length,
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input,select,textarea').length,
          forms: document.querySelectorAll('form').length,
          images: document.querySelectorAll('img').length,
          headers: document.querySelectorAll('header').length,
          navs: document.querySelectorAll('nav').length,
          mains: document.querySelectorAll('main').length,
          asides: document.querySelectorAll('aside').length,
        },
        visibleElements,
        links: [...document.querySelectorAll('a[href]')]
          .filter(isVisible)
          .map((anchor) => ({
            text: normalizeText(anchor.textContent || '').slice(0, 100),
            href: anchor.href,
          })),
      };
    });

  }

  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

  const blank =
    Boolean(navigationError) ||
    (snapshot.bodyText.length < 20 &&
      Number(snapshot.metrics.visibleElements || 0) < 2);

  const linkChecks = [];
  for (const link of snapshot.links) {
    let parsed;
    try {
      parsed = new URL(link.href);
    } catch {
      linkChecks.push({ ...link, status: null, broken: true, error: 'Invalid URL' });
      continue;
    }

    if (parsed.origin !== new URL(url).origin) continue;

    const linkPage = await context.newPage();
    try {
      const response = await linkPage.goto(link.href, {
        waitUntil: 'domcontentloaded',
        timeout: 10_000,
      });
      const linkText = cleanText(await linkPage.locator('body').innerText());
      linkChecks.push({
        ...link,
        status: response?.status() ?? null,
        finalUrl: linkPage.url(),
        broken: Boolean(response && response.status() >= 400) || linkText.length < 20,
        error: null,
      });
    } catch (error) {
      linkChecks.push({
        ...link,
        status: null,
        finalUrl: linkPage.url(),
        broken: true,
        error: cleanText(error.message),
      });
    } finally {
      await linkPage.close();
    }
  }

  const functionalChecks = [];
  if (!navigationError && new URL(page.url()).pathname === '/login') {
    const signInButton = page.getByRole('button', {
      name: 'Sign In',
      exact: true,
    });
    if ((await signInButton.count()) === 1) {
      await signInButton.click();
      await page.waitForTimeout(250);
      const validationMessages = await page
        .locator('.ant-form-item-explain-error')
        .allTextContents();
      functionalChecks.push({
        name: 'Empty login validation',
        pass: validationMessages.length >= 3,
        details: validationMessages.map(cleanText),
      });
    } else {
      functionalChecks.push({
        name: 'Empty login validation',
        pass: false,
        details: ['Unique Sign In button not found.'],
      });
    }

    const registerButton = page.getByRole('button', {
      name: 'Register',
      exact: true,
    });
    if ((await registerButton.count()) === 1) {
      const beforeUrl = page.url();
      const beforeText = cleanText(await page.locator('body').innerText());
      await registerButton.click();
      await page.waitForTimeout(500);
      const afterText = cleanText(await page.locator('body').innerText());
      const changed = page.url() !== beforeUrl || afterText !== beforeText;
      functionalChecks.push({
        name: 'Register button action',
        pass: changed,
        details: [
          changed
            ? `Observable change detected (${beforeUrl} → ${page.url()}).`
            : 'No navigation, dialog, message, or visible content change.',
        ],
      });
    } else {
      functionalChecks.push({
        name: 'Register button action',
        pass: false,
        details: ['Unique Register button not found.'],
      });
    }
  }

  await context.close();

  return {
    label,
    requestedUrl: url,
    navigationStatus,
    navigationError,
    title: snapshot.title,
    finalUrl: snapshot.finalUrl,
    blank,
    bodyTextLength: snapshot.bodyText.length,
    bodyTextPreview: snapshot.bodyText.slice(0, 500),
    bodyHtmlHash: hash(snapshot.bodyHtml),
    structureHash: hash(snapshot.structure),
    structureLength: snapshot.structure.length,
    metrics: snapshot.metrics,
    visibleElements: snapshot.visibleElements,
    visibleUiText: unique(
      snapshot.visibleElements.map((element) => element.text).filter(Boolean),
    ),
    consoleErrors: unique(consoleErrors),
    pageErrors: unique(pageErrors),
    failedRequests,
    errorResponses,
    linkChecks,
    functionalChecks,
    screenshotPath,
  };
};

const elementKey = (element) =>
  [
    element.tag,
    element.role,
    element.aria,
    element.name,
    element.type,
    element.text,
  ].join('|');

const compareResults = (baseline, build) => {
  const baselineKeys = baseline.visibleElements.map(elementKey);
  const buildKeys = build.visibleElements.map(elementKey);
  const missingElements = baseline.visibleElements.filter(
    (element) => !buildKeys.includes(elementKey(element)),
  );
  const extraElements = build.visibleElements.filter(
    (element) => !baselineKeys.includes(elementKey(element)),
  );

  const buildByKey = new Map(
    build.visibleElements.map((element) => [elementKey(element), element]),
  );
  const layoutDifferences = baseline.visibleElements
    .filter((element) => buildByKey.has(elementKey(element)))
    .map((element) => {
      const candidate = buildByKey.get(elementKey(element));
      const deltas = {
        x: candidate.box.x - element.box.x,
        y: candidate.box.y - element.box.y,
        width: candidate.box.width - element.box.width,
        height: candidate.box.height - element.box.height,
      };
      const styleChanged =
        JSON.stringify(element.style) !== JSON.stringify(candidate.style);
      const geometryChanged = Object.values(deltas).some(
        (value) => Math.abs(value) > 4,
      );
      return geometryChanged || styleChanged
        ? {
            element: elementKey(element),
            baseline: element.box,
            build: candidate.box,
            deltas,
            baselineStyle: element.style,
            buildStyle: candidate.style,
          }
        : null;
    })
    .filter(Boolean);

  const tests = [
    {
      test: 'Server/navigation',
      baseline: baseline.navigationError
        ? `ERROR: ${baseline.navigationError}`
        : `HTTP ${baseline.navigationStatus}`,
      build: build.navigationError
        ? `ERROR: ${build.navigationError}`
        : `HTTP ${build.navigationStatus}`,
      pass:
        !baseline.navigationError &&
        !build.navigationError &&
        baseline.navigationStatus < 400 &&
        build.navigationStatus < 400,
      notes: 'Both root URLs must load successfully.',
    },
    {
      test: 'Visible page content',
      baseline: baseline.blank
        ? 'Blank/broken'
        : `${baseline.bodyTextLength} text chars`,
      build: build.blank ? 'Blank/broken' : `${build.bodyTextLength} text chars`,
      pass: !baseline.blank && !build.blank,
      notes: 'Checks rendered body text and visible elements.',
    },
    {
      test: 'Page title',
      baseline: baseline.title || '(empty)',
      build: build.title || '(empty)',
      pass: baseline.title === build.title && Boolean(build.title),
      notes: 'Titles should match.',
    },
    {
      test: 'Final route',
      baseline: new URL(baseline.finalUrl).pathname,
      build: new URL(build.finalUrl).pathname,
      pass:
        new URL(baseline.finalUrl).pathname ===
        new URL(build.finalUrl).pathname,
      notes: 'Includes redirects such as unauthenticated /login.',
    },
    {
      test: 'Console/page errors',
      baseline: `${baseline.consoleErrors.length} console, ${baseline.pageErrors.length} page`,
      build: `${build.consoleErrors.length} console, ${build.pageErrors.length} page`,
      pass:
        baseline.consoleErrors.length === build.consoleErrors.length &&
        baseline.pageErrors.length === build.pageErrors.length &&
        build.pageErrors.length === 0,
      notes: 'Build should not introduce runtime errors.',
    },
    {
      test: 'Failed requests',
      baseline: `${baseline.failedRequests.length} failed`,
      build: `${build.failedRequests.length} failed`,
      pass:
        baseline.failedRequests.length === build.failedRequests.length &&
        build.failedRequests.length === 0,
      notes: 'Transport-level failures.',
    },
    {
      test: 'HTTP 4xx/5xx responses',
      baseline: `${baseline.errorResponses.length} errors`,
      build: `${build.errorResponses.length} errors`,
      pass:
        baseline.errorResponses.length === build.errorResponses.length &&
        build.errorResponses.length === 0,
      notes: 'All observed resources and API responses.',
    },
    {
      test: 'Visible key UI elements',
      baseline: `${baseline.visibleElements.length} key elements`,
      build: `${build.visibleElements.length} key elements`,
      pass: missingElements.length === 0 && extraElements.length === 0,
      notes: `${missingElements.length} missing, ${extraElements.length} extra.`,
    },
    {
      test: 'DOM structure',
      baseline: baseline.structureHash,
      build: build.structureHash,
      pass: baseline.structureHash === build.structureHash,
      notes: `Tag-tree lengths: ${baseline.structureLength} vs ${build.structureLength}.`,
    },
    {
      test: 'Layout/computed styles',
      baseline: 'Reference geometry',
      build: `${layoutDifferences.length} differences`,
      pass: layoutDifferences.length === 0,
      notes: 'Flags >4px geometry changes or computed style changes.',
    },
    {
      test: 'Visible links',
      baseline: `${baseline.linkChecks.filter((item) => item.broken).length} broken`,
      build: `${build.linkChecks.filter((item) => item.broken).length} broken`,
      pass:
        baseline.linkChecks.filter((item) => item.broken).length ===
          build.linkChecks.filter((item) => item.broken).length &&
        build.linkChecks.every((item) => !item.broken),
      notes: 'Same-origin visible links are opened in isolated pages.',
    },
    {
      test: 'Login form validation',
      baseline:
        baseline.functionalChecks.find(
          (check) => check.name === 'Empty login validation',
        )?.pass === true
          ? 'Working'
          : 'Unavailable/failed',
      build:
        build.functionalChecks.find(
          (check) => check.name === 'Empty login validation',
        )?.pass === true
          ? 'Working'
          : 'Unavailable/failed',
      pass:
        baseline.functionalChecks.find(
          (check) => check.name === 'Empty login validation',
        )?.pass ===
        build.functionalChecks.find(
          (check) => check.name === 'Empty login validation',
        )?.pass,
      notes: 'Submits the login form empty and expects three required-field messages.',
    },
    {
      test: 'Register button action',
      baseline:
        baseline.functionalChecks.find(
          (check) => check.name === 'Register button action',
        )?.pass === true
          ? 'Working'
          : 'Unavailable/failed',
      build:
        build.functionalChecks.find(
          (check) => check.name === 'Register button action',
        )?.pass === true
          ? 'Working'
          : 'No observable action',
      pass:
        baseline.functionalChecks.find(
          (check) => check.name === 'Register button action',
        )?.pass ===
        build.functionalChecks.find(
          (check) => check.name === 'Register button action',
        )?.pass,
      notes: 'Checks for navigation, dialog, message, or visible content change.',
    },
  ];

  return {
    tests,
    missingElements,
    extraElements,
    layoutDifferences,
    matches: tests.every((test) => test.pass),
  };
};

const escapeCell = (value) =>
  String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');

const createMarkdown = (baseline, build, comparison) => {
  const rows = comparison.tests
    .map(
      (test) =>
        `| ${escapeCell(test.test)} | ${escapeCell(test.baseline)} | ${escapeCell(test.build)} | ${test.pass ? 'PASS' : 'FAIL'} | ${escapeCell(test.notes)} |`,
    )
    .join('\n');

  const issueLines = [
    ...build.pageErrors.map((error) => `- Page error: ${error}`),
    ...build.consoleErrors.map((error) => `- Console error: ${error}`),
    ...build.failedRequests.map(
      (request) =>
        `- Failed request: ${request.method} ${request.url} — ${request.error}`,
    ),
    ...build.errorResponses.map(
      (response) =>
        `- HTTP ${response.status}: ${response.method} ${response.url}`,
    ),
    ...comparison.missingElements
      .slice(0, 20)
      .map((element) => `- Missing element: ${elementKey(element)}`),
    ...comparison.extraElements
      .slice(0, 20)
      .map((element) => `- Extra element: ${elementKey(element)}`),
    ...build.linkChecks
      .filter((link) => link.broken)
      .map(
        (link) =>
          `- Broken link: ${link.text || '(no text)'} → ${link.href} (${link.status || link.error})`,
      ),
    ...build.functionalChecks
      .filter((check) => !check.pass)
      .map(
        (check) =>
          `- Functional check failed: ${check.name} — ${check.details.join(' ')}`,
      ),
  ];

  return `# Local QA comparison

- Baseline: ${baseline.requestedUrl}
- Build: ${build.requestedUrl}
- Result: **${comparison.matches ? 'MATCH' : 'DIFFERENCES FOUND'}**

| Test | Baseline (5173) | Build (5174) | Pass/Fail | Notes |
|---|---|---|---|---|
${rows}

## Build issues

${issueLines.length ? issueLines.join('\n') : '- No runtime, network, element, or link issues detected.'}

## Artifacts

- Baseline screenshot: \`${baseline.screenshotPath}\`
- Build screenshot: \`${build.screenshotPath}\`
- Full machine-readable results: \`${path.join(outputDir, 'comparison.json')}\`
`;
};

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const baseline = await testTarget(browser, 'baseline-5173', baselineUrl);
  const build = await testTarget(browser, 'build-5174', buildUrl);
  const comparison = compareResults(baseline, build);
  const results = {
    generatedAt: new Date().toISOString(),
    baseline,
    build,
    comparison,
  };
  const markdown = createMarkdown(baseline, build, comparison);

  await writeFile(
    path.join(outputDir, 'comparison.json'),
    JSON.stringify(results, null, 2),
  );
  await writeFile(path.join(outputDir, 'report.md'), markdown);
  process.stdout.write(`${markdown}\n`);
  process.exitCode = comparison.matches ? 0 : 1;
} finally {
  await browser.close();
}
