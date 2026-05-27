/**
 * widgets.js — Functionality layer for noobstar2306's portfolio
 * Hosted in: ai-devops-bot repo (noobstar2306.github.io/ai-devops-bot/widgets.js)
 * Loaded by: noobstar2306.github.io (portfolio) via a single <script> tag
 *
 * This file owns ALL interactive functionality so the portfolio repo
 * only needs to manage appearance. To update any feature, edit this
 * file in ai-devops-bot — the portfolio picks up changes automatically.
 *
 * Features:
 *   1. Floating buttons  — 💡 tips, 🎯 hobbies, ❓ help (stacked bottom-right)
 *   2. AI tips modal     — Gemini-generated DevOps tips on demand
 *   3. Help modal        — GitHub issue creator via GitHub API
 *   4. README tooltip    — repo overview on hover over the help button
 */

(function () {
  'use strict';

  // ── CONFIGURATION ──
  // Keys are injected at deploy time by the ai-devops-bot GitHub Actions
  // workflow via sed replacement before the file is uploaded to Pages.
  // These placeholders are never committed with real values.
  const GEMINI_KEY  = 'PASTE_GEMINI_TIPS_KEY_HERE';
  const GH_PAT      = 'PASTE_GITHUB_PAT_HERE';

  // ── ISSUE ROUTING ──
  // Defines which GitHub repo each issue type is created in.
  // bugs + questions  → backend repo (ai-devops-bot) — functional issues
  // suggestions + improvements → frontend repo (noobstar2306.github.io) — appearance/UX ideas
  const ISSUE_ROUTING = {
    bug:         { repo: 'noobstar2306/ai-devops-bot',      label: 'ai-devops-bot',       color: '#4fa3ff' },
    question:    { repo: 'noobstar2306/ai-devops-bot',      label: 'ai-devops-bot',       color: '#4fa3ff' },
    suggestion:  { repo: 'noobstar2306/noobstar2306.github.io', label: 'noobstar2306.github.io', color: '#a78bfa' },
    improvement: { repo: 'noobstar2306/noobstar2306.github.io', label: 'noobstar2306.github.io', color: '#a78bfa' },
  };

  // README always fetches from the backend repo
  const README_REPO = 'noobstar2306/ai-devops-bot';

  // ── TIPS CONFIGURATION ──
  // Categories and topics for the Gemini prompt.
  // All topics are strictly DevOps / AI / cloud engineering.
  const CATEGORIES = ['Did you know?', 'Pro tip', 'Quick fact', 'Best practice', 'Fun fact'];
  const TOPICS = [
    'GitHub Actions CI/CD pipelines',
    'AI-powered DevOps and AIOps',
    'Docker containerisation',
    'Kubernetes orchestration and deployments',
    'DevSecOps and pipeline security',
    'Python automation scripts for DevOps',
    'Monitoring and observability with dashboards',
    'Git branching strategies and best practices',
    'Infrastructure as Code with Terraform',
    'LLM APIs integrated into DevOps workflows',
    'Gemini and Claude APIs for build automation',
    'GitHub Secrets and secrets management',
    'Automated code review in CI pipelines',
    'Container registries and image management',
    'Shift-left testing in DevOps pipelines'
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // STYLES
  // Injected into <head> so widgets render correctly regardless of the
  // host page's CSS. Uses CSS variables where possible so colours match
  // the portfolio's dark theme automatically.
  // ──────────────────────────────────────────────────────────────────────────
  const STYLES = `
    /* ── FLOATING BUTTON BASE ── */
    .gp-fab {
      position: fixed; right: 1.75rem;
      width: 54px; height: 54px; border-radius: 50%;
      background: #0e1420; border: 1px solid;
      font-size: 1.4rem; display: grid; place-items: center;
      z-index: 9999; cursor: pointer;
      text-decoration: none; color: #e4eaf6;
      transition: transform 0.2s, box-shadow 0.2s;
      font-family: inherit;
    }

    /* Stack order bottom to top: 💡 tips, 🎯 hobbies, ❓ help */
    #gp-tips-btn    { bottom: 1.75rem; border-color: #ffb547; box-shadow: 0 0 20px rgba(255,181,71,0.2); }
    #gp-hobbies-btn { bottom: 5.5rem;  border-color: #a78bfa; box-shadow: 0 0 20px rgba(167,139,250,0.2); }
    #gp-help-btn    { bottom: 9.25rem; border-color: rgba(255,77,106,0.6); box-shadow: 0 0 20px rgba(255,77,106,0.15); }

    #gp-tips-btn:hover    { transform: scale(1.1) rotate(-8deg); box-shadow: 0 0 32px rgba(255,181,71,0.4); }
    #gp-hobbies-btn:hover { transform: scale(1.1) rotate(8deg);  box-shadow: 0 0 32px rgba(167,139,250,0.4); }
    #gp-help-btn:hover    { transform: scale(1.1); box-shadow: 0 0 32px rgba(255,77,106,0.35); }

    /* ── MODAL OVERLAY ── */
    .gp-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
      align-items: center; justify-content: center;
      padding: 1.5rem; z-index: 99999;
    }
    .gp-overlay.open { display: flex; }

    /* ── MODAL BOX ── */
    .gp-modal {
      width: 100%; max-width: 500px;
      background: #0e1420; border: 1px solid #212d40;
      border-radius: 24px; overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.5);
      animation: gpPopIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
      font-family: 'Outfit', -apple-system, sans-serif;
    }
    @keyframes gpPopIn { from{opacity:0;transform:scale(0.88);} to{opacity:1;transform:scale(1);} }

    /* ── MODAL HEADER ── */
    .gp-modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.2rem 1.4rem; border-bottom: 1px solid #1a2234;
    }
    .gp-modal-badge {
      display: block; font-family: 'JetBrains Mono', monospace;
      font-size: 0.68rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 3px;
    }
    .gp-modal-sub { font-size: 0.72rem; color: #7a8ba6; }
    .gp-close-btn {
      background: #121928; border: 1px solid #1a2234;
      color: #7a8ba6; font-size: 0.85rem; cursor: pointer;
      width: 28px; height: 28px; border-radius: 8px;
      display: grid; place-items: center; transition: all 0.15s;
      font-family: inherit;
    }
    .gp-close-btn:hover { color: #e4eaf6; border-color: #212d40; }

    /* ── MODAL BODY ── */
    .gp-modal-body {
      padding: 1.5rem 1.4rem; min-height: 120px;
      display: flex; align-items: center;
    }
    .gp-modal-body-inner { width: 100%; }

    /* ── LOADING SPINNER ── */
    .gp-loading { display: flex; align-items: center; gap: 0.75rem; color: #7a8ba6; font-size: 0.9rem; }
    .gp-spinner {
      width: 18px; height: 18px; flex-shrink: 0;
      border: 2px solid #212d40; border-radius: 50%;
      animation: gpSpin 0.7s linear infinite;
    }
    @keyframes gpSpin { to { transform: rotate(360deg); } }

    /* ── TIP TEXT ── */
    #gp-tips-text { font-size: 0.925rem; line-height: 1.8; color: #e4eaf6; display: none; }
    #gp-tips-text strong { color: #ffb547; }

    /* ── MODAL FOOTER ── */
    .gp-modal-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.4rem; border-top: 1px solid #1a2234; background: #0a0f1a;
    }
    .gp-refresh-btn {
      font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;
      padding: 0.6rem 1.1rem; border: 1px solid #212d40;
      border-radius: 8px; color: #7a8ba6; background: none; cursor: pointer;
      display: flex; align-items: center; gap: 0.4rem; transition: all 0.2s;
    }
    .gp-refresh-btn:hover { border-color: #ffb547; color: #ffb547; }
    .gp-tips-category {
      font-family: 'JetBrains Mono', monospace; font-size: 0.65rem;
      color: #7a8ba6; text-transform: uppercase; letter-spacing: 0.1em;
      max-width: 180px; text-align: right; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    }

    /* ── HELP FORM ELEMENTS ── */
    .gp-help-label {
      font-family: 'JetBrains Mono', monospace; font-size: 0.65rem;
      color: #7a8ba6; text-transform: uppercase; letter-spacing: 0.1em;
      margin-bottom: 0.4rem; display: block;
    }
    .gp-issue-types { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .gp-type-btn {
      font-family: 'JetBrains Mono', monospace; font-size: 0.68rem;
      padding: 5px 14px; border-radius: 999px;
      border: 1px solid #212d40; color: #7a8ba6;
      background: #121928; cursor: pointer; transition: all 0.2s;
    }
    .gp-type-btn:hover   { border-color: #4fa3ff; color: #4fa3ff; }
    .gp-type-btn.selected { border-color: #4fa3ff; color: #4fa3ff; background: rgba(79,163,255,0.1); }
    .gp-input, .gp-textarea {
      width: 100%; background: #121928; border: 1px solid #212d40;
      border-radius: 8px; color: #e4eaf6;
      font-family: 'Outfit', sans-serif; font-size: 0.9rem;
      padding: 0.75rem 1rem; transition: border-color 0.2s;
      resize: none; margin-bottom: 1rem;
    }
    .gp-input:focus, .gp-textarea:focus { outline: none; border-color: #4fa3ff; }
    .gp-textarea { height: 100px; line-height: 1.6; }
    .gp-submit-btn {
      font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
      background: rgba(255,77,106,0.15); border: 1px solid rgba(255,77,106,0.5);
      color: rgba(255,77,106,0.9); padding: 0.6rem 1.4rem;
      border-radius: 8px; cursor: pointer; transition: all 0.2s;
    }
    .gp-submit-btn:hover:not(:disabled) { background: rgba(255,77,106,0.25); }
    .gp-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .gp-help-note { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; color: #7a8ba6; max-width: 240px; line-height: 1.5; }
    .gp-status { font-size: 0.8rem; padding: 0.6rem 1rem; border-radius: 8px; display: none; margin-bottom: 0.75rem; font-family: 'JetBrains Mono', monospace; }
    .gp-status.success { background: rgba(0,224,154,0.1); color: #00e09a; border: 1px solid rgba(0,224,154,0.3); }
    .gp-status.error   { background: rgba(255,77,106,0.1); color: rgba(255,77,106,0.9); border: 1px solid rgba(255,77,106,0.3); }
    .gp-status a { color: #00e09a; text-decoration: underline; }

    /* ── README TOOLTIP ── */
    #gp-readme-tooltip {
      position: fixed; right: 5rem; bottom: 7.5rem;
      width: 300px; max-height: 320px;
      background: #0e1420; border: 1px solid rgba(255,77,106,0.3);
      border-radius: 22px; padding: 1.1rem 1.25rem;
      box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      z-index: 9998; overflow-y: auto;
      opacity: 0; pointer-events: none;
      transform: translateX(8px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      font-family: 'Outfit', sans-serif;
    }
    #gp-readme-tooltip.visible { opacity: 1; pointer-events: auto; transform: translateX(0); }
    #gp-readme-tooltip::-webkit-scrollbar { width: 4px; }
    #gp-readme-tooltip::-webkit-scrollbar-thumb { background: #212d40; border-radius: 4px; }
    .gp-readme-label {
      font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; font-weight: 700;
      color: rgba(255,77,106,0.8); text-transform: uppercase; letter-spacing: 0.12em;
      margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;
    }
    .gp-readme-body { font-size: 0.8rem; line-height: 1.7; color: #9aaec7; }
    .gp-readme-body strong { color: #e4eaf6; }
    .gp-readme-body h1, .gp-readme-body h2, .gp-readme-body h3 { font-size: 0.85rem; font-weight: 600; color: #e4eaf6; margin: 0.6rem 0 0.3rem; }
    .gp-readme-body p  { margin-bottom: 0.5rem; }
    .gp-readme-body ul { padding-left: 1rem; margin-bottom: 0.5rem; }
    .gp-readme-body li { margin-bottom: 0.2rem; }
    .gp-readme-body code { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; background: #121928; border: 1px solid #1a2234; padding: 1px 5px; border-radius: 4px; color: #4fa3ff; }
    .gp-readme-loading { color: #7a8ba6; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; }
    .gp-readme-spinner { width:14px; height:14px; border:2px solid #212d40; border-top-color:rgba(255,77,106,0.8); border-radius:50%; animation:gpSpin 0.7s linear infinite; flex-shrink:0; }
  `;

  // ──────────────────────────────────────────────────────────────────────────
  // HTML
  // All widget HTML injected into document.body at runtime.
  // ──────────────────────────────────────────────────────────────────────────
  const HTML = `
    <!-- ❓ Help button with README tooltip -->
    <button id="gp-help-btn" class="gp-fab" type="button" aria-label="Report an issue or get help" title="Help &amp; Feedback">❓</button>

    <div id="gp-readme-tooltip" role="tooltip" aria-hidden="true">
      <div class="gp-readme-label">✦ About this repo</div>
      <div id="gp-readme-body" class="gp-readme-body">
        <div class="gp-readme-loading"><div class="gp-readme-spinner"></div><span>Loading README...</span></div>
      </div>
    </div>

    <!-- Help modal -->
    <div id="gp-help-overlay" class="gp-overlay" role="dialog" aria-modal="true">
      <div class="gp-modal" style="--header-bg:rgba(255,77,106,0.07);">
        <div class="gp-modal-header" style="background:rgba(255,77,106,0.07);">
          <div>
            <span class="gp-modal-badge" style="color:rgba(255,77,106,0.9);">Report an issue</span>
            <span class="gp-modal-sub">Creates a GitHub issue on this repo</span>
          </div>
          <button class="gp-close-btn" id="gp-help-close" type="button" aria-label="Close help">✕</button>
        </div>
        <div class="gp-modal-body">
          <div class="gp-modal-body-inner">
            <div id="gp-help-status" class="gp-status"></div>
            <span class="gp-help-label">Issue type</span>
            <div class="gp-issue-types" id="gp-issue-types">
              <button class="gp-type-btn selected" data-type="bug" type="button">🐛 Bug</button>
              <button class="gp-type-btn" data-type="suggestion" type="button">💡 Suggestion</button>
              <button class="gp-type-btn" data-type="question" type="button">❓ Question</button>
              <button class="gp-type-btn" data-type="improvement" type="button">✨ Improvement</button>
            </div>
            <!-- Routing indicator: shows which repo the issue will be created in -->
            <div id="gp-routing-indicator" style="
              font-family:'JetBrains Mono',monospace; font-size:0.62rem;
              padding:5px 10px; border-radius:6px; margin-bottom:1rem;
              background:rgba(79,163,255,0.08); border:1px solid rgba(79,163,255,0.2);
              color:#4fa3ff; display:flex; align-items:center; gap:0.5rem;
            ">
              <span>→</span>
              <span id="gp-routing-text">Will be created in: noobstar2306/ai-devops-bot</span>
            </div>
            <label class="gp-help-label" for="gp-issue-title">Title</label>
            <input id="gp-issue-title" class="gp-input" type="text" placeholder="Short description of the issue..." maxlength="100"/>
            <label class="gp-help-label" for="gp-issue-body">Description</label>
            <textarea id="gp-issue-body" class="gp-textarea" placeholder="What happened? What did you expect?"></textarea>
          </div>
        </div>
        <div class="gp-modal-footer">
          <span class="gp-help-note">Issues are created publicly on GitHub.</span>
          <button id="gp-help-submit" class="gp-submit-btn" type="button">
            <span id="gp-submit-text">Submit issue →</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 🎯 Hobbies button — links to hobbies page -->
    <a id="gp-hobbies-btn" class="gp-fab" href="https://noobstar2306.github.io/ai-devops-bot/hobbies.html"
       target="_blank" rel="noopener" aria-label="View hobbies and interests" title="Hobbies &amp; Interests">🎯</a>

    <!-- 💡 Tips button -->
    <button id="gp-tips-btn" class="gp-fab" type="button" aria-label="Get an AI DevOps tip" title="AI DevOps Tips">💡</button>

    <!-- Tips modal -->
    <div id="gp-tips-overlay" class="gp-overlay" role="dialog" aria-modal="true">
      <div class="gp-modal">
        <div class="gp-modal-header" style="background:rgba(255,181,71,0.06);">
          <div>
            <span id="gp-tips-badge" class="gp-modal-badge" style="color:#ffb547;">Did you know?</span>
            <span class="gp-modal-sub">AI DevOps Tips — powered by Gemini</span>
          </div>
          <button class="gp-close-btn" id="gp-tips-close" type="button" aria-label="Close tips">✕</button>
        </div>
        <div class="gp-modal-body">
          <div class="gp-modal-body-inner">
            <div id="gp-tips-loading" class="gp-loading">
              <div class="gp-spinner" style="border-top-color:#ffb547;"></div>
              <span>Generating tip...</span>
            </div>
            <div id="gp-tips-text"></div>
          </div>
        </div>
        <div class="gp-modal-footer">
          <button id="gp-tips-refresh" class="gp-refresh-btn" type="button">↻ New tip</button>
          <span id="gp-tips-category" class="gp-tips-category"></span>
        </div>
      </div>
    </div>
  `;

  // ──────────────────────────────────────────────────────────────────────────
  // INIT — inject styles and HTML into the page
  // ──────────────────────────────────────────────────────────────────────────

  // Inject CSS into <head>
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);

  // Inject HTML at end of <body>
  const wrapper = document.createElement('div');
  wrapper.innerHTML = HTML;
  document.body.appendChild(wrapper);

  // ──────────────────────────────────────────────────────────────────────────
  // TIPS FEATURE
  // Opens a modal and calls Gemini to generate a DevOps tip on demand.
  // ──────────────────────────────────────────────────────────────────────────

  function openTips() {
    document.getElementById('gp-tips-overlay').classList.add('open');
    fetchTip();
  }

  function closeTips() {
    document.getElementById('gp-tips-overlay').classList.remove('open');
  }

  async function fetchTip() {
    const loadingEl  = document.getElementById('gp-tips-loading');
    const textEl     = document.getElementById('gp-tips-text');
    const badgeEl    = document.getElementById('gp-tips-badge');
    const categoryEl = document.getElementById('gp-tips-category');

    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const topic    = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    badgeEl.textContent    = category;
    categoryEl.textContent = topic;
    loadingEl.style.display = 'flex';
    textEl.style.display    = 'none';
    textEl.innerHTML        = '';

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text:
              `Give me one "${category}" about: ${topic}.
This must be strictly about DevOps, CI/CD, cloud engineering, or AI/ML in DevOps.
Start with a bold heading using <strong> tags, then 2-3 sentences.
Keep it practical for a beginner DevOps engineer.
No bullet points. No preamble. Just the tip directly.`
            }] }]
          })
        }
      );
      const data    = await res.json();
      const tipText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not load tip. Try again!';
      loadingEl.style.display = 'none';
      textEl.style.display    = 'block';
      textEl.innerHTML        = tipText;
    } catch (err) {
      loadingEl.style.display = 'none';
      textEl.style.display    = 'block';
      textEl.innerHTML        = '<strong>Connection error.</strong> Try clicking New tip.';
    }
  }

  document.getElementById('gp-tips-btn').addEventListener('click', openTips);
  document.getElementById('gp-tips-close').addEventListener('click', closeTips);
  document.getElementById('gp-tips-refresh').addEventListener('click', fetchTip);
  document.getElementById('gp-tips-overlay').addEventListener('click', e => {
    if (e.target.id === 'gp-tips-overlay') closeTips();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // HELP FEATURE
  // Opens a form modal that creates a GitHub issue via the GitHub API.
  // ──────────────────────────────────────────────────────────────────────────

  function openHelp() {
    document.getElementById('gp-help-overlay').classList.add('open');
    document.getElementById('gp-help-status').style.display = 'none';
    document.getElementById('gp-issue-title').value = '';
    document.getElementById('gp-issue-body').value  = '';
  }

  function closeHelp() {
    document.getElementById('gp-help-overlay').classList.remove('open');
  }

  // Issue type pill selector — updates selection and routing indicator
  document.getElementById('gp-issue-types').addEventListener('click', e => {
    const btn = e.target.closest('.gp-type-btn');
    if (!btn) return;
    document.querySelectorAll('.gp-type-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Update routing indicator to show which repo this issue type goes to
    const route     = ISSUE_ROUTING[btn.dataset.type] || ISSUE_ROUTING.bug;
    const indicator = document.getElementById('gp-routing-indicator');
    const text      = document.getElementById('gp-routing-text');
    indicator.style.background   = `${route.color}14`;
    indicator.style.borderColor  = `${route.color}33`;
    indicator.style.color        = route.color;
    text.textContent = `Will be created in: ${route.repo}`;
  });

  async function submitIssue() {
    const titleEl   = document.getElementById('gp-issue-title');
    const bodyEl    = document.getElementById('gp-issue-body');
    const submitBtn = document.getElementById('gp-help-submit');
    const submitTxt = document.getElementById('gp-submit-text');
    const statusEl  = document.getElementById('gp-help-status');
    const typeBtn   = document.querySelector('.gp-type-btn.selected');

    if (!titleEl.value.trim()) {
      titleEl.focus();
      titleEl.style.borderColor = 'rgba(255,77,106,0.8)';
      setTimeout(() => titleEl.style.borderColor = '', 2000);
      return;
    }

    const issueType  = typeBtn?.dataset.type || 'bug';

    // Look up which repo this issue type should be created in
    const route      = ISSUE_ROUTING[issueType] || ISSUE_ROUTING.bug;

    const issueTitle = `[${issueType}] ${titleEl.value.trim()}`;
    const issueBody  = `${bodyEl.value.trim() || '_No description provided._'}

---
**Source:** ${window.location.href}
**Submitted:** ${new Date().toUTCString()}`;

    submitBtn.disabled    = true;
    submitTxt.textContent = '⏳ Submitting...';
    statusEl.style.display = 'none';

    try {
      // POST to the routed repo — bug/question → ai-devops-bot, suggestion/improvement → portfolio repo
      const res = await fetch(`https://api.github.com/repos/${route.repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GH_PAT}`,
          'Accept':        'application/vnd.github+json',
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({ title: issueTitle, body: issueBody, labels: [issueType] })
      });

      const data = await res.json();
      if (res.ok) {
        statusEl.className     = 'gp-status success';
        statusEl.style.display = 'block';
        statusEl.innerHTML     = `✅ Issue created! <a href="${data.html_url}" target="_blank" rel="noopener">View #${data.number} on GitHub →</a>`;
        titleEl.value = '';
        bodyEl.value  = '';
      } else {
        throw new Error(data.message || 'GitHub API error');
      }
    } catch (err) {
      statusEl.className     = 'gp-status error';
      statusEl.style.display = 'block';
      statusEl.textContent   = `❌ Failed: ${err.message}`;
    } finally {
      submitBtn.disabled    = false;
      submitTxt.textContent = 'Submit issue →';
    }
  }

  document.getElementById('gp-help-btn').addEventListener('click', openHelp);
  document.getElementById('gp-help-close').addEventListener('click', closeHelp);
  document.getElementById('gp-help-submit').addEventListener('click', submitIssue);
  document.getElementById('gp-help-overlay').addEventListener('click', e => {
    if (e.target.id === 'gp-help-overlay') closeHelp();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // README TOOLTIP
  // Fetches and shows the repo README on hover over the help button.
  // Cached after first load — only one API call per session.
  // ──────────────────────────────────────────────────────────────────────────

  let readmeLoaded = false;

  // Lightweight Markdown-to-HTML converter for tooltip display.
  // Strips images, code blocks, links and cleans up for small tooltip context.
  function parseMarkdown(md) {
    return md
      .replace(/<!--[\s\S]*?-->/g, '')         // remove HTML comments
      .replace(/```[\s\S]*?```/g, '')           // remove fenced code blocks
      .replace(/!\[.*?\]\(.*?\)/g, '')          // remove images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → plain text
      .replace(/[├──│└]/g, '')                  // remove tree characters
      .split('\n')
      .map(line => {
        if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
        if (line.startsWith('## '))  return `<h2>${line.slice(3)}</h2>`;
        if (line.startsWith('# '))   return `<h1>${line.slice(2)}</h1>`;
        if (/^[-*] /.test(line))     return `<li>${line.slice(2)}</li>`;
        if (/^\d+\. /.test(line))    return `<li>${line.replace(/^\d+\. /,'')}</li>`;
        if (line.trim() === '' || line.startsWith('---') || line.trim() === '|') return '';
        // Skip table rows
        if (line.trim().startsWith('|')) return '';
        return `<p>${line}</p>`;
      })
      .join('')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/(<li>.*?<\/li>)+/g, m => `<ul>${m}</ul>`)
      .replace(/<p><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '');
  }

  async function fetchReadme() {
    if (readmeLoaded) return;
    readmeLoaded = true;
    const bodyEl = document.getElementById('gp-readme-body');
    try {
      const res  = await fetch(
        `https://api.github.com/repos/${README_REPO}/readme`,
        { headers: { 'Accept': 'application/vnd.github+json' } }
      );
      const data = await res.json();
      const raw  = atob(data.content.replace(/\n/g, ''));
      const trimmed = raw.length > 1200 ? raw.slice(0, 1200) + '\n\n...' : raw;
      bodyEl.innerHTML = parseMarkdown(trimmed);
    } catch {
      bodyEl.innerHTML = '<p>Could not load README.</p>';
    }
  }

  const helpBtn   = document.getElementById('gp-help-btn');
  const readmeTip = document.getElementById('gp-readme-tooltip');
  let tipTimeout  = null;

  helpBtn.addEventListener('mouseenter', () => {
    clearTimeout(tipTimeout);
    readmeTip.classList.add('visible');
    fetchReadme();
  });
  helpBtn.addEventListener('mouseleave', () => {
    tipTimeout = setTimeout(() => { if (!readmeTip.matches(':hover')) readmeTip.classList.remove('visible'); }, 200);
  });
  readmeTip.addEventListener('mouseenter', () => clearTimeout(tipTimeout));
  readmeTip.addEventListener('mouseleave', () => {
    tipTimeout = setTimeout(() => readmeTip.classList.remove('visible'), 200);
  });

  // ── Global Escape key closes whichever modal is open ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeTips(); closeHelp(); }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SKILLS RENDERING
  // Populates #tech-skills-grid and #soft-skills-grid in the portfolio.
  // Defined here so the portfolio HTML stays data-free — update skills
  // by editing these arrays only, no HTML changes needed.
  // ──────────────────────────────────────────────────────────────────────────

  // Technical skill cards — each renders as one card with icon, title, desc, tags
  // Updated to reflect all skills demonstrated across this project
  const TECH_SKILLS = [
    {
      color:'c-green', icon:'⚙️',
      title:'CI/CD Pipelines',
      desc:'Building automated pipelines that test, validate, deploy, and monitor code on every push using GitHub Actions.',
      tags:['GitHub Actions','YAML','pytest','coverage','pip caching']
    },
    {
      color:'c-blue', icon:'🤖',
      title:'AI Integration',
      desc:'Connecting LLM APIs into DevOps workflows — failure analysis, code review, personalised recommendations, and AI-generated tips.',
      tags:['Gemini API','Prompt engineering','REST APIs','JSON parsing']
    },
    {
      color:'c-purple', icon:'🐍',
      title:'Python scripting',
      desc:'Writing automation scripts, API clients, health checkers, log analysers, and test suites that power the entire DevOps pipeline.',
      tags:['Python 3.11','pytest','urllib','argparse','unittest.mock']
    },
    {
      color:'c-amber', icon:'📊',
      title:'Observability & monitoring',
      desc:'Building live dashboards, access log analysers, and health check systems that surface pipeline and site health in real time.',
      tags:['GitHub API','Caddy logs','JSON logs','log analysis','health checks']
    },
    {
      color:'c-green', icon:'🔀',
      title:'Git & version control',
      desc:'Managing branches, pull requests, submodule pitfalls, and collaborative workflows. Debugged and resolved nested git repo issues.',
      tags:['Git','GitHub','Pull requests','Branching','git rm --cached']
    },
    {
      color:'c-blue', icon:'🔒',
      title:'DevSecOps',
      desc:'Injecting secrets at deploy time via GitHub Actions sed commands — API keys never committed to source code.',
      tags:['GitHub Secrets','sed injection','GH_PAT','API key safety','OWASP basics']
    },
    {
      color:'c-purple', icon:'🌐',
      title:'Reverse proxy & networking',
      desc:'Configured Caddy v2 as a local reverse proxy with structured JSON logging, port routing, and header forwarding.',
      tags:['Caddy v2','reverse proxy','Caddyfile','HTTP headers','port routing']
    },
    {
      color:'c-amber', icon:'☁️',
      title:'Cloud & tunnelling',
      desc:'Deployed public HTTPS endpoints using Cloudflare Tunnel without a domain — exposing local services securely to the internet.',
      tags:['Cloudflare Tunnel','cloudflared','HTTPS','trycloudflare.com','WSL networking']
    },
    {
      color:'c-green', icon:'🖥️',
      title:'Linux & WSL',
      desc:'Comfortable working in Ubuntu on WSL — installing packages, managing services with systemctl, file permissions, and bash scripting.',
      tags:['Ubuntu','WSL2','systemctl','bash','apt','file permissions']
    },
    {
      color:'c-blue', icon:'🎨',
      title:'Frontend development',
      desc:'Building professional dark-themed UIs with CSS custom properties, animations, modals, scroll reveal, and responsive layouts.',
      tags:['HTML5','CSS3','Vanilla JS','CSS variables','IntersectionObserver']
    }
  ];

  // Soft skill cards — personal working traits shown below the technical grid
  const SOFT_SKILLS = [
    {
      icon:'🔍', title:'Problem solver',
      desc:'Debugged nested git repos, WSL networking issues, Caddy permission errors, and Gemini API rate limits — reading errors carefully and iterating to fix.'
    },
    {
      icon:'📖', title:'Fast learner',
      desc:'Built a full AI DevOps pipeline, reverse proxy, Cloudflare tunnel, and log analyser from zero in a single session by learning and applying immediately.'
    },
    {
      icon:'🗣️', title:'Clear communicator',
      desc:'Explains technical decisions in plain language — useful for cross-functional teams, documentation, and writing readable code comments.'
    },
    {
      icon:'🔄', title:'Iterative mindset',
      desc:'Ships working features early, gathers feedback, and improves incrementally — every feature on this site went through multiple iterations.'
    },
    {
      icon:'🏗️', title:'Systems thinker',
      desc:'Separated concerns across two repos (appearance vs functionality), designed secret injection patterns, and planned a full DevOps roadmap.'
    },
    {
      icon:'🎯', title:'Attention to detail',
      desc:'Catches security issues (leaked API keys, nested git repos), broken links, missing error handling, and placeholder values before they ship.'
    }
  ];

  // ── renderTechSkills ──
  // Injects one skill card per TECH_SKILLS entry into #tech-skills-grid.
  // Only runs if the grid exists on the page (portfolio only).
  function renderTechSkills() {
    const grid = document.getElementById('tech-skills-grid');
    if (!grid) return;
    grid.innerHTML = TECH_SKILLS.map(s => `
      <article class="skill-card ${s.color} reveal">
        <div class="skill-icon">${s.icon}</div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
        <div class="tag-group">${s.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </article>
    `).join('');
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }

  // ── renderSoftSkills ──
  // Injects one soft-skill card per SOFT_SKILLS entry into #soft-skills-grid.
  // Only runs if the grid exists on the page (portfolio only).
  function renderSoftSkills() {
    const grid = document.getElementById('soft-skills-grid');
    if (!grid) return;
    grid.innerHTML = SOFT_SKILLS.map(s => `
      <div class="soft-card reveal">
        <div class="soft-card-icon">${s.icon}</div>
        <div><h4>${s.title}</h4><p>${s.desc}</p></div>
      </div>
    `).join('');
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }

  // ── Scroll reveal observer ──
  // Watches .reveal elements and fades them in when they enter the viewport.
  // unobserve() stops watching once visible — more efficient than continuous checks.
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── Initialise ──
  // Wrapped in DOMContentLoaded to guarantee the portfolio's #tech-skills-grid
  // and #soft-skills-grid elements exist before we try to inject into them.
  // Without this, the script may run before the HTML is fully parsed,
  // causing getElementById to return null and skills to silently not render.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderTechSkills();
      renderSoftSkills();
    });
  } else {
    // DOM already ready (script loaded with defer or after DOMContentLoaded)
    renderTechSkills();
    renderSoftSkills();
  }

})();
