import * as fs from 'fs';
import * as path from 'path';

export interface ReportIndicator {
  id: string;
  name: string;
  weight: number;
  passed: boolean;
  score: number;
  details: string;
  evidence?: { url?: string; snippet?: string };
}

export interface ReportDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface ReportTrendDay {
  name: string;
  accepted: number;
  rejected: number;
  withdrawn: number;
}

export interface ReportConsentRow {
  userId: string;
  region: string;
  language: string;
  categories: string[];
  status: string;
}

export interface CookieComplianceReportData {
  websiteName: string;
  websiteUrl: string;
  baseDomain: string;
  complianceScore: number;
  riskLevel: string;
  pagesCrawled: number;
  cookiesFound: number;
  lastScanLabel: string;
  generatedAtLabel: string;
  scanTrace: {
    queued: number;
    attempted: number;
    crawled: number;
    skipped: number;
    baseDomain: string;
  } | null;
  indicators: ReportIndicator[];
  thirdPartyHosts: string[];
  distribution: ReportDistributionItem[];
  trend: ReportTrendDay[];
  recentConsents: ReportConsentRow[];
  scanConfig: {
    name: string;
    url: string;
    frequency: string;
    depth: string;
    autoCategorize: boolean;
    scanBehindLogin: boolean;
    email: string;
  };
  categoryMap: Record<string, string>;
}

const PASS_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l3 3 5-5"/></svg>';
const FAIL_ICON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 2l8 8M10 2l-8 8"/></svg>';

let cachedLogoDataUri: string | null | undefined;

function getProteccioLogoDataUri(): string {
  if (cachedLogoDataUri !== undefined) return cachedLogoDataUri ?? '';
  const candidates = [
    path.join(__dirname, 'assets', 'proteccio_logo.png'),
    path.join(process.cwd(), 'dist', 'cookies-management', 'assets', 'proteccio_logo.png'),
    path.join(process.cwd(), 'src', 'cookies-management', 'assets', 'proteccio_logo.png'),
    path.join(process.cwd(), '..', 'frontend', 'public', 'proteccio_logo_new-removebg-preview1.png'),
  ];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const buf = fs.readFileSync(filePath);
    cachedLogoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
    return cachedLogoDataUri;
  }
  cachedLogoDataUri = null;
  return '';
}

function renderProteccioLogo(heightPx: number, alt = 'Proteccio Data'): string {
  const src = getProteccioLogoDataUri();
  if (!src) return '';
  return `<img src="${src}" alt="${escapeHtml(alt)}" class="report-logo" style="height:${heightPx}px;width:auto;max-width:120px;object-fit:contain;vertical-align:middle" />`;
}

function escapeHtml(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadReportStyles(): string {
  const candidates = [
    path.join(__dirname, 'templates', 'cookie-compliance-report.base.html'),
    path.join(process.cwd(), 'src', 'cookies-management', 'templates', 'cookie-compliance-report.base.html'),
    path.join(process.cwd(), 'proteccio_cookie_report.html'),
    path.join(process.cwd(), '..', 'proteccio_cookie_report.html'),
  ];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const html = fs.readFileSync(filePath, 'utf8');
    const match = html.match(/<style>([\s\S]*?)<\/style>/);
    if (match?.[1]) return match[1];
  }
  return `body{font-family:system-ui,sans-serif;margin:0;padding:24px;color:#0f1a13}`;
}

function scoreRingOffset(score: number): number {
  const circumference = 283;
  return Math.round(circumference * (1 - Math.min(100, Math.max(0, score)) / 100));
}

function barClass(ind: ReportIndicator): string {
  if (ind.passed && ind.score >= ind.weight) return 'pass';
  if (ind.score > 0) return 'partial';
  return 'fail';
}

function barWidth(ind: ReportIndicator): number {
  if (!ind.weight) return 0;
  return Math.min(100, Math.round((ind.score / ind.weight) * 100));
}

function renderProofBox(ind: ReportIndicator, websiteUrl: string): string {
  if (!ind.evidence?.snippet && !ind.evidence?.url) return '';
  const label = ind.passed ? 'Proof of Compliance' : 'Failing Cookies';
  const link = ind.evidence?.url || websiteUrl;
  return `
    <div class="proof-box">
      <div>
        <div class="proof-label">${label}</div>
        <div class="proof-text">${escapeHtml(ind.evidence?.snippet || '')}</div>
      </div>
      <a class="proof-link" href="${escapeHtml(link)}" target="_blank" rel="noopener">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        View Page
      </a>
    </div>`;
}

function renderScoreItem(ind: ReportIndicator, websiteUrl: string): string {
  const isFail = !ind.passed || ind.score < ind.weight;
  const iconClass = ind.passed && ind.score >= ind.weight ? 'pass' : 'fail';
  const fractionClass = ind.passed && ind.score >= ind.weight ? 'pass' : 'fail';
  return `
    <div class="score-item${isFail ? ' fail' : ''}">
      <div class="score-item-top">
        <div class="score-icon ${iconClass}">${ind.passed && ind.score >= ind.weight ? PASS_ICON : FAIL_ICON}</div>
        <div class="score-info">
          <div class="score-name">${escapeHtml(ind.name)}</div>
          <div class="score-desc">${escapeHtml(ind.details)}</div>
          ${renderProofBox(ind, websiteUrl)}
        </div>
        <div class="score-points">
          <div class="score-fraction ${fractionClass}">${ind.score} / ${ind.weight}</div>
          <div class="score-pts-lbl">Points</div>
        </div>
      </div>
      <div class="score-bar-wrap"><div class="score-bar ${barClass(ind)}" style="width:${barWidth(ind)}%"></div></div>
    </div>`;
}

function renderScanTrace(data: CookieComplianceReportData): string {
  if (!data.scanTrace) return '';
  const t = data.scanTrace;
  return `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <div class="section-title">Scan Trace</div>
      </div>
      <div class="trace-grid">
        <div class="trace-card"><div class="trace-card-label">Queued</div><div class="trace-card-value">${t.queued}</div></div>
        <div class="trace-card"><div class="trace-card-label">Attempted</div><div class="trace-card-value">${t.attempted}</div></div>
        <div class="trace-card"><div class="trace-card-label">Crawled</div><div class="trace-card-value">${t.crawled}</div></div>
        <div class="trace-card"><div class="trace-card-label">Skipped</div><div class="trace-card-value">${t.skipped}</div></div>
        <div class="trace-card"><div class="trace-card-label">Base Domain</div><div class="trace-card-value mono">${escapeHtml(t.baseDomain)}</div></div>
      </div>
    </div>`;
}

function renderThirdPartyHosts(hosts: string[]): string {
  if (!hosts.length) {
    return `<p style="color:var(--muted);font-size:13px">No third-party hosts detected.</p>`;
  }
  return `<div class="host-tags">${hosts.map(h => `<span class="host-tag">${escapeHtml(h)}</span>`).join('')}</div>`;
}

function renderConsentRows(rows: ReportConsentRow[]): string {
  if (!rows.length) {
    return `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">No consent activity recorded yet.</td></tr>`;
  }
  return rows.map(row => {
    const statusClass = row.status === 'ACCEPTED' ? 'accepted' : row.status === 'REJECTED' ? 'rejected' : 'rejected';
    const cats = row.categories.map(c => `<span class="cat-badge">${escapeHtml(c)}</span>`).join(' ');
    const actions = row.status === 'ACCEPTED' ? '<span class="action-link">Withdraw</span>' : '—';
    return `<tr>
      <td><span class="uid-mono">${escapeHtml(row.userId)}</span></td>
      <td>${escapeHtml(row.region)}</td>
      <td>${escapeHtml(row.language)}</td>
      <td>${cats || '—'}</td>
      <td><span class="status-badge ${statusClass}">${escapeHtml(row.status)}</span></td>
      <td>${actions}</td>
    </tr>`;
  }).join('');
}

function renderToggle(enabled: boolean): string {
  if (enabled) {
    return `<div class="toggle-on"><span class="toggle-pill"></span> Enabled</div>`;
  }
  return `<div class="config-value" style="color:var(--muted)">Disabled</div>`;
}

export function renderCookieComplianceReport(data: CookieComplianceReportData): string {
  const styles = loadReportStyles();
  const ringOffset = scoreRingOffset(data.complianceScore);
  const donutTotal = data.distribution.reduce((s, d) => s + d.value, 0);
  const donutLabels = JSON.stringify(data.distribution.map(d => d.name));
  const donutValues = JSON.stringify(data.distribution.map(d => d.value));
  const donutColors = JSON.stringify(data.distribution.map(d => d.color));
  const trendLabels = JSON.stringify(data.trend.map(t => t.name));
  const trendAccepted = JSON.stringify(data.trend.map(t => t.accepted));
  const trendRejected = JSON.stringify(data.trend.map(t => t.rejected));
  const trendWithdrawn = JSON.stringify(data.trend.map(t => t.withdrawn));
  const trendRange = data.trend.length
    ? `${data.trend[0].name} – ${data.trend[data.trend.length - 1].name}`
    : 'Last 7 days';
  const legendHtml = data.distribution.map(d => `
    <li class="legend-item"><span class="legend-dot" style="background:${d.color}"></span> ${escapeHtml(d.name)} <span class="legend-count">${d.value}</span></li>
  `).join('');

  const scoreItemsHtml = data.indicators.map(ind => renderScoreItem(ind, data.websiteUrl)).join('');
  const scanDate = escapeHtml(data.lastScanLabel);
  const generatedFooter = escapeHtml(data.generatedAtLabel);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cookie Compliance Report — ${escapeHtml(data.websiteName)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<style>${styles}
  .score-ring-fill { stroke-dashoffset: ${ringOffset}; }
  .footer-brand { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .topbar-brand { display: flex; align-items: center; gap: 10px; }
  .report-logo { flex-shrink: 0; }
</style>
</head>
<body>
<nav class="topbar no-print">
  <div class="topbar-brand">
    ${renderProteccioLogo(26)}
    Proteccio Data — Cookie Compliance Report
  </div>
  <div class="topbar-right">
    <button class="btn-print" onclick="window.print()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      Print / Export PDF
    </button>
  </div>
</nav>

<div class="page">
  <div class="cover">
    <div class="cover-top">
      <div class="cover-meta">
        <div class="cover-tag">Compliance Scan Report</div>
        <div class="cover-title">Compliance Audit Results</div>
        <div class="cover-subtitle">
          <a href="${escapeHtml(data.websiteUrl)}" target="_blank" rel="noopener">${escapeHtml(data.websiteUrl)}</a>
          &nbsp;·&nbsp; <span>${scanDate}</span>
        </div>
      </div>
      <div class="score-ring-wrap">
        <svg class="score-ring" viewBox="0 0 100 100" role="img" aria-label="Compliance score ${data.complianceScore}%">
          <circle class="score-ring-bg" cx="50" cy="50" r="45"/>
          <circle class="score-ring-fill" cx="50" cy="50" r="45"/>
        </svg>
        <div class="score-ring-label">
          <div class="score-pct">${data.complianceScore}%</div>
          <div class="score-lbl">Score</div>
        </div>
      </div>
    </div>
    <div class="cover-stats">
      <div class="cover-stat">
        <div class="cover-stat-label">Risk Level</div>
        <div><span class="badge-risk">${escapeHtml(data.riskLevel)}</span></div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-label">Pages Crawled</div>
        <div class="cover-stat-value">${data.pagesCrawled}</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-label">Cookies Found</div>
        <div class="cover-stat-value">${data.cookiesFound}</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-label">Base Domain</div>
        <div class="cover-stat-value" style="font-size:13px;margin-top:3px">${escapeHtml(data.baseDomain)}</div>
      </div>
    </div>
  </div>

  <div class="body">
    ${renderScanTrace(data)}

    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
        </div>
        <div class="section-title">Score Breakdown</div>
        <div class="section-count">${data.indicators.length} checks</div>
      </div>
      <div id="score-list">${scoreItemsHtml}</div>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
        </div>
        <div class="section-title">Detected Third-Party Hosts</div>
        <div class="section-count">${data.thirdPartyHosts.length} domains</div>
      </div>
      ${renderThirdPartyHosts(data.thirdPartyHosts)}
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21H4.6C4.04 21 3.76 21 3.55 20.89a1 1 0 01-.44-.44C3 20.24 3 19.96 3 19.4V3"/><path d="M7 17l4-8 4 6 2-4"/></svg>
        </div>
        <div class="section-title">Cookie Distribution &amp; Consent Activity</div>
        <div class="section-count">${escapeHtml(trendRange)}</div>
      </div>
      <div class="two-col">
        <div class="chart-card">
          <div class="chart-card-title">Cookie Distribution</div>
          <div class="chart-card-sub">Total cookies by category</div>
          <div class="donut-wrap">
            <div class="donut-canvas-wrap">
              <canvas id="donutChart"></canvas>
              <div class="donut-center">
                <div class="donut-num">${donutTotal}</div>
                <div class="donut-lbl">Total</div>
              </div>
            </div>
            <ul class="legend-list">${legendHtml}</ul>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">Consent Activity Trend</div>
          <div class="chart-card-sub">Last 7 days</div>
          <div class="trend-legend">
            <div class="trend-legend-item"><span class="trend-legend-line" style="background:#1dd05e"></span> Accepted</div>
            <div class="trend-legend-item"><span class="trend-legend-line" style="background:#f59e0b;border-top:2px dashed #f59e0b;height:0"></span> Rejected</div>
            <div class="trend-legend-item"><span class="trend-legend-line" style="background:#ef4444;border-top:2px dotted #ef4444;height:0"></span> Withdrawn</div>
          </div>
          <div class="trend-canvas-wrap"><canvas id="trendChart"></canvas></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
        </div>
        <div class="section-title">Recent Consent Activity</div>
        <div class="section-count">Latest preferences</div>
      </div>
      <div style="border:1px solid var(--border-light);border-radius:var(--radius-lg);overflow:hidden">
        <table class="consent-table">
          <thead>
            <tr>
              <th>User ID</th><th>Region</th><th>Language</th><th>Categories</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${renderConsentRows(data.recentConsents)}</tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 00-14.14 0M21 12a9 9 0 01-9 9 9 9 0 01-9-9 9 9 0 0118 0z"/></svg>
        </div>
        <div class="section-title">Scan Configuration</div>
      </div>
      <div class="config-grid">
        <div class="config-item"><div class="config-label">Website Name</div><div class="config-value">${escapeHtml(data.scanConfig.name)}</div></div>
        <div class="config-item"><div class="config-label">Website URL</div><div class="config-value" style="font-size:12px;color:var(--brand-dark)">${escapeHtml(data.scanConfig.url)}</div></div>
        <div class="config-item"><div class="config-label">Scan Frequency</div><div class="config-value">${escapeHtml(data.scanConfig.frequency)}</div></div>
        <div class="config-item"><div class="config-label">Scan Depth</div><div class="config-value">${escapeHtml(data.scanConfig.depth)}</div></div>
        <div class="config-item"><div class="config-label">Automatic Categorization</div>${renderToggle(data.scanConfig.autoCategorize)}</div>
        <div class="config-item"><div class="config-label">Scan Behind Login</div>${renderToggle(data.scanConfig.scanBehindLogin)}</div>
        <div class="config-item" style="grid-column:1/-1">
          <div class="config-label">Notification Email</div>
          <div class="config-value" style="font-family:'DM Mono',monospace;font-size:12px">${escapeHtml(data.scanConfig.email || '—')}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="report-footer">
    <div class="footer-brand">
      ${renderProteccioLogo(22)}
      <span>Generated by <strong>Proteccio Data</strong> &nbsp;·&nbsp; Cookie Compliance Platform</span>
    </div>
    <div class="footer-meta">${generatedFooter} &nbsp;·&nbsp; ${escapeHtml(data.baseDomain)}</div>
  </div>
</div>

<script>
const donutCtx = document.getElementById('donutChart').getContext('2d');
new Chart(donutCtx, {
  type: 'doughnut',
  data: {
    labels: ${donutLabels},
    datasets: [{
      data: ${donutValues},
      backgroundColor: ${donutColors},
      borderWidth: 2,
      borderColor: '#f5faf7',
      hoverOffset: 4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: { legend: { display: false } }
  }
});

const trendCtx = document.getElementById('trendChart').getContext('2d');
new Chart(trendCtx, {
  type: 'line',
  data: {
    labels: ${trendLabels},
    datasets: [
      { label: 'Accepted', data: ${trendAccepted}, borderColor: '#1dd05e', backgroundColor: 'rgba(29,208,94,.08)', borderWidth: 2, pointBackgroundColor: '#1dd05e', pointRadius: 4, tension: 0.4, fill: true },
      { label: 'Rejected', data: ${trendRejected}, borderColor: '#f59e0b', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5,3], pointBackgroundColor: '#f59e0b', pointRadius: 4, tension: 0.4 },
      { label: 'Withdrawn', data: ${trendWithdrawn}, borderColor: '#ef4444', backgroundColor: 'transparent', borderWidth: 2, borderDash: [2,3], pointBackgroundColor: '#ef4444', pointRadius: 4, tension: 0.4 }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 }, color: '#7a9585' } },
      y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 }, color: '#7a9585' }, beginAtZero: true }
    }
  }
});
</script>
</body>
</html>`;
}
