# ⚡ AI DevOps Bot

A fully automated DevOps system built from scratch — CI/CD pipeline with AI-powered failure analysis, automated code review, live pipeline dashboard, hobbies page with AI recommendations, Cloudflare Worker API proxy, reverse proxy setup, and access log monitoring.

**Live sites:**
- 🌐 [Pipeline Dashboard](https://noobstar2306.github.io/ai-devops-bot/)
- 🎯 [Hobbies & Interests](https://noobstar2306.github.io/ai-devops-bot/hobbies.html)
- 💼 [Portfolio](https://noobstar2306.github.io)

---

## What this project does

Every push to `main` triggers a CI pipeline that:
1. Runs 15 automated tests with coverage reporting
2. If tests fail — Gemini AI reads the error log and posts a plain-English explanation on the PR
3. On every PR — Gemini AI reviews all changed files (Python, YAML, HTML, JS) and posts constructive feedback
4. Deploys the live dashboard, hobbies page, and widgets.js to GitHub Pages

---

## Architecture

All browser-facing API calls go through a **Cloudflare Worker proxy** — no API keys ever appear in source code or deployed files.

```
Browser → Cloudflare Worker (gemini-proxy.ganeshputran.workers.dev)
               ├── /gemini       → Gemini API (tips, recommendations)
               ├── /github-issue → GitHub API (issue creation)
               └── /readme       → GitHub API (README tooltip)
```

---

## Project structure

```
ai-devops-bot/
│
├── app.py                  # Portfolio health checker — pings all live URLs
├── gemini_utils.py         # Shared Gemini API + GitHub comment utilities
├── explain_failure.py      # Reads CI error log from file, posts AI explanation to PR
├── review_code.py          # Fetches PR diff, posts AI code review (8000 char limit)
├── test_app.py             # 15 pytest tests using unittest.mock for HTTP calls
│
├── widgets.js              # All browser-side functionality via Cloudflare Worker
│                           # Tips modal, help modal, hobbies btn, skills grid
│
├── hobbies.html            # Hobbies page — Music, Travel, Tech, Gaming + AI recs
├── maintenance.html        # Maintenance banner — swap in during updates
│
├── dashboard/
│   └── index.html          # Live pipeline dashboard via Cloudflare Worker
│
└── .github/workflows/
    ├── ci.yml              # Tests + AI review on every push
    └── deploy-dashboard.yml # Deploys full repo to GitHub Pages
```

---

## CI/CD Pipeline

| Stage | What happens |
|-------|-------------|
| **1** | pytest runs 15 tests on every push with pip caching |
| **2** | On failure: Gemini reads `test_output.txt` and posts PR explanation |
| **3** | On every PR: Gemini reviews all changed files and posts feedback |
| **4** | On merge: full repo deploys to GitHub Pages |

---

## Key features

### AI failure explainer
`explain_failure.py` reads the CI error log from a **file path** (avoids shell arg length limits), truncates to 6000 chars, and posts an AI explanation to the PR using the shared `gemini_utils.py`.

### AI code reviewer
`review_code.py` fetches the PR diff, filters to reviewable extensions (`.py .yml .html .js`), caps at 8000 chars, and posts constructive feedback. Uses `gemini_utils.py` — a failed review posts a fallback message rather than crashing the pipeline.

### Shared utilities (`gemini_utils.py`)
Eliminates code duplication. Provides `call_gemini()` with retry logic on 429/503, and `post_github_comment()` used by both AI scripts.

### Portfolio health checker (`app.py`)
Pings all 4 live URLs and generates a health report with HTTP status, response times, and pass/fail summary.

### Live dashboard
Real-time pipeline health via GitHub Actions API. Tips powered by Cloudflare Worker → Gemini.

### Hobbies page with AI recommendations
4 sections (Music, Travel, Tech, Gaming) with lazy-loaded AI recommendations via Cloudflare Worker.

### Help & issue routing
Issues routed by type via Cloudflare Worker:
- 🐛 Bug / ❓ Question → `noobstar2306/ai-devops-bot`
- 💡 Suggestion / ✨ Improvement → `noobstar2306/noobstar2306.github.io`

### Cloudflare Worker proxy
All API keys live in Cloudflare environment variables — never in source code or deployed files. See `gemini-proxy/src/index.js`.

---

## Local development

```bash
# Run tests
pip install pytest pytest-cov
pytest -v --cov=app

# Run health checker
python app.py

# Caddy reverse proxy (WSL)
sudo systemctl start caddy
# Portfolio:  http://localhost:8080
# Dashboard:  http://localhost:8081
# Hobbies:    http://localhost:8082

# Cloudflare Tunnel (public HTTPS)
cloudflared tunnel --url http://localhost:8080

# Log analysis
sudo python3 log_analyser.py
sudo python3 log_analyser.py --errors
sudo python3 log_analyser.py --log portfolio --tail 50
```

---

## Secrets

| Secret | Location | Purpose |
|--------|----------|---------|
| `GEMINI_API_KEY` | GitHub Secrets (`ai-devops-bot`) | CI pipeline AI scripts |
| `GEMINI_TIPS_KEY` | Cloudflare Worker env | Browser tips + hobbies |
| `GH_PAT` | Cloudflare Worker env | GitHub issue creation |

---

## Tech stack

| Layer | Tools |
|-------|-------|
| CI/CD | GitHub Actions |
| AI | Google Gemini 2.5 Flash |
| API proxy | Cloudflare Workers (free) |
| Testing | pytest, pytest-cov, unittest.mock |
| Hosting | GitHub Pages |
| Reverse proxy | Caddy v2 (local WSL) |
| Tunnel | Cloudflare Tunnel (free) |
| Logging | Caddy JSON logs + Python log analyser |
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Python 3.11 |

---

## Stats

- **15** automated tests
- **4** CI pipeline stages
- **3** AI integrations (failure explainer, code reviewer, tips/recommendations)
- **3** live pages (portfolio, dashboard, hobbies)
- **1** Cloudflare Worker proxy
- **0** API keys in source code or deployed files

---

## Author

**Ganesh Putran**
- GitHub: [noobstar2306](https://github.com/noobstar2306)
- LinkedIn: [ganesh-putran](https://www.linkedin.com/in/ganesh-putran-b047ba235/)
- Portfolio: [noobstar2306.github.io](https://noobstar2306.github.io)
