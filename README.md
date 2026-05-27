# ⚡ AI DevOps Bot

A fully automated DevOps system built from scratch — CI/CD pipeline with AI-powered failure analysis, automated code review, live pipeline dashboard, hobbies page with AI recommendations, reverse proxy setup, and access log monitoring.

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
4. Deploys the live dashboard and hobbies page to GitHub Pages with secrets injected securely at build time

---

## Project structure

```
ai-devops-bot/
│
├── app.py                  # Portfolio health checker — pings all live URLs
├── gemini_utils.py         # Shared Gemini API + GitHub comment utilities
├── explain_failure.py      # Reads CI error log, posts AI explanation to PR
├── review_code.py          # Fetches PR diff, posts AI code review
├── test_app.py             # 15 pytest tests for the health checker
│
├── widgets.js              # All interactive functionality loaded by portfolio
│                           # Tips modal, help modal, hobbies button, skills grid
│
├── hobbies.html            # Hobbies & interests page with AI recommendations
├── maintenance.html        # Swap in during site updates
│
├── dashboard/
│   └── index.html          # Live pipeline dashboard
│
└── .github/workflows/
    ├── ci.yml              # CI pipeline — tests + AI review on every push
    └── deploy-dashboard.yml # Deploys dashboard + widgets.js to GitHub Pages
```

---

## CI/CD Pipeline stages

| Stage | What happens |
|-------|-------------|
| **Stage 1** | pytest runs 15 tests on every push — pass/fail reported instantly |
| **Stage 2** | On failure: Gemini reads the error log and posts explanation on the PR |
| **Stage 3** | On every PR: Gemini reviews all changed files and posts feedback |
| **Stage 4** | On merge to main: dashboard and widgets deploy to GitHub Pages |

---

## Key features

### AI failure explainer
When tests fail, `explain_failure.py` reads `test_output.txt` and calls the Gemini API to generate a plain-English explanation with a specific fix suggestion. Posted automatically as a PR comment.

### AI code reviewer
On every pull request, `review_code.py` fetches the full diff (filtered to `.py`, `.yml`, `.html`, `.js` files, capped at 8000 chars) and asks Gemini for constructive feedback. Posted as a PR comment.

### Portfolio health checker
`app.py` pings all four live URLs (portfolio, dashboard, hobbies, widgets.js) and generates a health report showing HTTP status, response times, and any failures. Run manually or hooked into CI.

### Live dashboard
Real-time pipeline health page showing:
- Total runs, pass/fail counts, success rate
- Build history bar chart (last 30 runs)
- Recent runs table with status badges
- AI-generated health summary
- 💡 AI DevOps tips powered by Gemini

### Hobbies page with AI recommendations
Four hobby sections (Music, Travel, Tech, Gaming) — each shows static favourites and loads a personalised Gemini AI recommendation on first expand.

### Help & issue routing
The ❓ help button lets visitors submit GitHub issues directly from the portfolio. Issues are routed by type:
- 🐛 Bug / ❓ Question → this repo (`ai-devops-bot`)
- 💡 Suggestion / ✨ Improvement → portfolio repo (`noobstar2306.github.io`)

### Secure secret injection
API keys (`GEMINI_API_KEY`, `GEMINI_TIPS_KEY`, `GH_PAT`) are stored as GitHub Secrets and injected into HTML/JS files at deploy time using `sed`. Keys never appear in source code.

---

## Local development setup

### Prerequisites
- Python 3.11+
- WSL (Ubuntu) for Caddy reverse proxy
- Caddy v2 for local reverse proxy

### Run tests locally
```bash
pip install pytest pytest-cov
pytest -v --cov=app
```

### Run health checker
```bash
python app.py
```

### Caddy reverse proxy (WSL)
```bash
sudo systemctl start caddy
# Portfolio:  http://localhost:8080
# Dashboard:  http://localhost:8081
# Hobbies:    http://localhost:8082
```

### Cloudflare Tunnel (public HTTPS)
```bash
cloudflared tunnel --url http://localhost:8080
# Generates a public https://*.trycloudflare.com URL
```

### Log analysis
```bash
sudo python3 log_analyser.py              # all three logs
sudo python3 log_analyser.py --errors     # errors only
sudo python3 log_analyser.py --log portfolio --tail 50
```

---

## GitHub Secrets required

| Secret | Used by | Purpose |
|--------|---------|---------|
| `GEMINI_API_KEY` | `ci.yml` | AI failure explainer + code review |
| `GEMINI_TIPS_KEY` | `deploy-dashboard.yml` | Dashboard tips + hobbies AI recommendations |
| `GH_PAT` | `deploy-dashboard.yml` | GitHub issue creation from help modal |

---

## Tech stack

| Layer | Tools |
|-------|-------|
| CI/CD | GitHub Actions |
| AI | Google Gemini 2.5 Flash |
| Testing | pytest, pytest-cov |
| Hosting | GitHub Pages |
| Reverse proxy | Caddy v2 (local) |
| Tunnel | Cloudflare Tunnel |
| Logging | Caddy JSON access logs + custom Python analyser |
| Frontend | HTML, CSS, Vanilla JS |
| Backend scripts | Python 3.11 |

---

## Stats

- **15** automated tests
- **4** CI pipeline stages
- **3** AI integrations (failure explainer, code reviewer, tips/recommendations)
- **3** live pages (portfolio, dashboard, hobbies)
- **1** shared utility module (gemini_utils.py)
- **0** API keys in source code

---

## Author

**Ganesh Putran**
- GitHub: [noobstar2306](https://github.com/noobstar2306)
- LinkedIn: [ganesh-putran](https://www.linkedin.com/in/ganesh-putran-b047ba235/)
- Portfolio: [noobstar2306.github.io](https://noobstar2306.github.io)
