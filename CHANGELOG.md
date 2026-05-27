# Changelog

## [1.1.0] — 2026-05-27
### Added
- gemini_utils.py — shared Gemini + GitHub utilities
- Cloudflare Worker proxy — all API keys removed from source code
- In-memory caching in Worker — reduces Gemini rate limit hits
- Hourly health check via cron job + log_analyser.py
### Changed
- explain_failure.py — reads from file path, uses gemini_utils
- review_code.py — uses gemini_utils, 8000 char diff limit, error handling
- app.py — portfolio health checker replacing task manager
- test_app.py — 15 tests for health checker using unittest.mock
- Gemini model switched to gemini-2.5-flash-lite (1000 RPD free tier)
- All browser API calls routed through Cloudflare Worker

## [1.0.0] — 2026-05-26
### Added
- CI pipeline with pytest (10 tests, 80% coverage threshold)
- AI failure explainer on PR comments
- AI code reviewer on every PR
- Live pipeline dashboard on GitHub Pages
- Hobbies page with AI recommendations
- widgets.js centralised functionality layer
- Maintenance page
- Caddy v2 reverse proxy (local WSL)
- Cloudflare Tunnel for public HTTPS
- Caddy JSON access logs and log_analyser.py
- Two-repo architecture (appearance vs functionality)
