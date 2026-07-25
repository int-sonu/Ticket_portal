import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const targets = [
  {
    name: 'Baseline (5173)',
    baseUrl: process.env.QA_BASELINE_URL || 'http://localhost:5173/',
  },
  {
    name: 'Build (5174)',
    baseUrl: process.env.QA_BUILD_URL || 'http://localhost:5174/',
  },
];
const publicRoutes = new Set([
  '/login',
  '/forgot-password',
  '/forgot-password-otp',
  '/set-new-password',
]);
const outputDir = path.resolve('qa-results');
const routesSource = await readFile(
  path.resolve('src/AppRoutes/Routes.tsx'),
  'utf8',
);
const configuredRoutes = [
  ...routesSource.matchAll(/<Route\b[^>]*\bpath="([^"]+)"/g),
].map((match) => match[1]);
const allRoutes = [
  ...new Set(
    configuredRoutes
      .filter((route) => route !== '*')
      .map((route) => route.replace(/:id\b/g, '1')),
  ),
].sort();
const representativeRoutes = new Set([
  '/login',
  '/forgot-password',
  '/forgot-password-otp',
  '/set-new-password',
  '/dashboard',
  '/tickets',
  '/callreports',
  '/reports',
  '/masters/agent',
  '/bills',
  '/item-repair/assign',
  '/more/customer-details',
  '/settings/features',
]);
const routes =
  process.env.QA_ALL_ROUTES === '1'
    ? allRoutes
    : allRoutes.filter((route) => representativeRoutes.has(route));

const clean = (value = '') => value.replace(/\s+/g, ' ').trim();

const probeTarget = async (browser, target) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const preflightPage = await context.newPage();
  let availabilityError = null;

  try {
    await preflightPage.goto(target.baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 8_000,
    });
  } catch (error) {
    availabilityError = clean(error.message);
  } finally {
    await preflightPage.close();
  }

  if (availabilityError) {
    await context.close();
    return {
      ...target,
      available: false,
      availabilityError,
      routes: [],
    };
  }

  const page = await context.newPage();
  let capture = null;

  page.on('console', (message) => {
    if (capture && message.type() === 'error') {
      capture.consoleErrors.push(clean(message.text()));
    }
  });
  page.on('pageerror', (error) => {
    if (capture) capture.pageErrors.push(clean(error.message));
  });
  page.on('requestfailed', (request) => {
    if (capture) {
      capture.failedRequests.push({
        method: request.method(),
        url: request.url(),
        error: request.failure()?.errorText || 'Unknown failure',
      });
    }
  });
  page.on('response', (response) => {
    if (capture && response.status() >= 400) {
      capture.errorResponses.push({
          status: response.status(),
          method: response.request().method(),
          url: response.url(),
        });
      }
  });

  const results = [];
  for (const route of routes) {
    capture = {
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      errorResponses: [],
    };
    let navigationStatus = null;
    let navigationError = null;
    try {
      const response = await page.goto(new URL(route, target.baseUrl).href, {
        waitUntil: 'domcontentloaded',
        timeout: 10_000,
      });
      navigationStatus = response?.status() ?? null;
      await page.waitForTimeout(750);
    } catch (error) {
      navigationError = clean(error.message);
    }

    const finalPath = new URL(page.url()).pathname;
    const bodyText = navigationError
      ? ''
      : clean(await page.locator('body').innerText().catch(() => ''));
    const expectedPath = publicRoutes.has(route) ? route : '/login';
    if (
      target.baseUrl.includes('5174') &&
      publicRoutes.has(route) &&
      !navigationError
    ) {
      const screenshotName =
        route === '/login'
          ? 'route-login.png'
          : `route-${route.replace(/^\//, '').replace(/\//g, '-')}.png`;
      await page
        .screenshot({
          path: path.join(outputDir, screenshotName),
          fullPage: true,
        })
        .catch(() => {});
    }
    const passed =
      !navigationError &&
      navigationStatus !== null &&
      navigationStatus < 400 &&
      bodyText.length >= 20 &&
      finalPath === expectedPath &&
      capture.consoleErrors.length === 0 &&
      capture.pageErrors.length === 0 &&
      capture.failedRequests.length === 0 &&
      capture.errorResponses.length === 0;

    results.push({
      route,
      kind: publicRoutes.has(route) ? 'public' : 'private',
      expectedPath,
      finalPath,
      navigationStatus,
      navigationError,
      bodyTextLength: bodyText.length,
      title: await page.title().catch(() => ''),
      consoleErrors: [...new Set(capture.consoleErrors)],
      pageErrors: [...new Set(capture.pageErrors)],
      failedRequests: capture.failedRequests,
      errorResponses: capture.errorResponses,
      passed,
    });
    process.stdout.write(
      `[${target.name}] ${route} → ${finalPath} ${passed ? 'PASS' : 'FAIL'}\n`,
    );
  }

  capture = null;
  await page.close();
  await context.close();
  return {
    ...target,
    available: true,
    availabilityError: null,
    routes: results,
  };
};

const escapeCell = (value) =>
  String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const targetResults = [];
  for (const target of targets) {
    targetResults.push(await probeTarget(browser, target));
  }

  const baseline = targetResults[0];
  const build = targetResults[1];
  const baselineByRoute = new Map(
    baseline.routes.map((result) => [result.route, result]),
  );
  const buildByRoute = new Map(
    build.routes.map((result) => [result.route, result]),
  );

  const rows = routes.map((route) => {
    const baselineResult = baselineByRoute.get(route);
    const buildResult = buildByRoute.get(route);
    const comparisonPass =
      baseline.available &&
      build.available &&
      baselineResult?.passed &&
      buildResult?.passed &&
      baselineResult.finalPath === buildResult.finalPath &&
      baselineResult.title === buildResult.title;

    return {
      route,
      baseline: baseline.available
        ? `${baselineResult?.passed ? 'PASS' : 'FAIL'} → ${baselineResult?.finalPath}`
        : 'BLOCKED: server unavailable',
      build: build.available
        ? `${buildResult?.passed ? 'PASS' : 'FAIL'} → ${buildResult?.finalPath}`
        : 'BLOCKED: server unavailable',
      result: comparisonPass
        ? 'PASS'
        : baseline.available && build.available
          ? 'FAIL'
          : 'BLOCKED',
      notes: buildResult
        ? [
            buildResult.navigationError,
            ...buildResult.consoleErrors,
            ...buildResult.pageErrors,
            ...buildResult.failedRequests.map(
              (request) => `${request.method} ${request.url}: ${request.error}`,
            ),
            ...buildResult.errorResponses.map(
              (response) =>
                `HTTP ${response.status} ${response.method} ${response.url}`,
            ),
          ]
            .filter(Boolean)
            .join('; ') || `${buildResult.kind} route`
        : '',
    };
  });

  const buildFailures = build.routes.filter((result) => !result.passed);
  const markdown = `# Route sweep

- Routes tested: ${routes.length}
- Baseline: ${baseline.available ? 'reachable' : `unreachable — ${baseline.availabilityError}`}
- Build: ${build.available ? 'reachable' : `unreachable — ${build.availabilityError}`}
- Build route checks passed: ${build.routes.filter((result) => result.passed).length}/${build.routes.length}

| Route | Baseline (5173) | Build (5174) | Result | Notes |
|---|---|---|---|---|
${rows
  .map(
    (row) =>
      `| ${escapeCell(row.route)} | ${escapeCell(row.baseline)} | ${escapeCell(row.build)} | ${row.result} | ${escapeCell(row.notes)} |`,
  )
  .join('\n')}

## Build failures

${
  buildFailures.length
    ? buildFailures
        .map(
          (failure) =>
            `- \`${failure.route}\`: expected \`${failure.expectedPath}\`, reached \`${failure.finalPath}\`.`,
        )
        .join('\n')
    : '- No failures in the unauthenticated route sweep.'
}
`;

  const results = {
    generatedAt: new Date().toISOString(),
    configuredRouteCount: routes.length,
    targets: targetResults,
    rows,
  };
  await writeFile(
    path.join(outputDir, 'routes.json'),
    JSON.stringify(results, null, 2),
  );
  await writeFile(path.join(outputDir, 'routes-report.md'), markdown);
  process.stdout.write(markdown);
  process.exitCode =
    baseline.available && build.available && buildFailures.length === 0 ? 0 : 1;
} finally {
  await browser.close();
}
