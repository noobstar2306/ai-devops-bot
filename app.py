# app.py — Portfolio site health checker
# This is the core application tested by the CI pipeline.
# It validates that all key portfolio pages and links are reachable,
# checks HTTP status codes, and reports the health of the live site.
# Useful for the portfolio because it demonstrates real DevOps monitoring.

import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta


# ── PORTFOLIO PAGES ──
# All public URLs that should return HTTP 200.
# Add new pages here as the portfolio grows.
PORTFOLIO_PAGES = [
    {
        "name": "Portfolio (main)",
        "url":  "https://noobstar2306.github.io"
    },
    {
        "name": "Pipeline dashboard",
        "url":  "https://noobstar2306.github.io/ai-devops-bot/"
    },
    {
        "name": "Hobbies page",
        "url":  "https://noobstar2306.github.io/ai-devops-bot/hobbies.html"
    },
    {
        "name": "Widgets JS",
        "url":  "https://noobstar2306.github.io/ai-devops-bot/widgets.js"
    },
]


def check_page(name: str, url: str, timeout: int = 10) -> dict:
    """
    Check if a single URL is reachable and returns HTTP 200.

    Returns a result dict with:
      - name:    human-readable page name
      - url:     the URL that was checked
      - status:  HTTP status code returned, or None on error
      - ok:      True if status is 200, False otherwise
      - error:   error message if the request failed, else None
    """
    if not url or not url.startswith("http"):
        raise ValueError(f"Invalid URL: '{url}'")

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "PortfolioHealthChecker/1.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return {
                "name":   name,
                "url":    url,
                "status": response.status,
                "ok":     response.status == 200,
                "error":  None
            }
    except urllib.error.HTTPError as e:
        # Server responded with an error status (4xx, 5xx)
        return {"name": name, "url": url, "status": e.code, "ok": False, "error": str(e)}
    except urllib.error.URLError as e:
        # Network-level failure (DNS, timeout, connection refused)
        return {"name": name, "url": url, "status": None, "ok": False, "error": str(e.reason)}


def check_all_pages(pages: list = None) -> list:
    """
    Check all portfolio pages and return a list of result dicts.
    Uses PORTFOLIO_PAGES by default; pass a custom list for testing.
    """
    if pages is None:
        pages = PORTFOLIO_PAGES

    results = []
    for page in pages:
        result = check_page(page["name"], page["url"])
        results.append(result)
    return results


def get_summary(results: list) -> dict:
    """
    Summarise a list of check_page results.

    Returns a dict with:
      - total:   total number of pages checked
      - passed:  number that returned HTTP 200
      - failed:  number that did not
      - healthy: True if all pages passed
    """
    if not results:
        return {"total": 0, "passed": 0, "failed": 0, "healthy": True}

    passed = sum(1 for r in results if r["ok"])
    failed = len(results) - passed
    return {
        "total":   len(results),
        "passed":  passed,
        "failed":  failed,
        "healthy": failed == 0
    }


def format_report(results: list) -> str:
    """
    Format check results as a human-readable plain-text report.
    Used for printing to the console or posting to a PR comment.
    """
    summary = get_summary(results)
    lines   = [
        f"Portfolio Health Report — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"{'='*52}",
        f"Total: {summary['total']}  |  Passed: {summary['passed']}  |  Failed: {summary['failed']}",
        ""
    ]

    for r in results:
        icon   = "✅" if r["ok"] else "❌"
        status = str(r["status"]) if r["status"] else "ERR"
        lines.append(f"  {icon}  [{status}]  {r['name']}")
        if r["error"]:
            lines.append(f"         ↳ {r['error']}")

    lines.append("")
    lines.append("HEALTHY ✓" if summary["healthy"] else "UNHEALTHY — one or more pages failed")
    return "\n".join(lines)


if __name__ == "__main__":
    # Run health check manually: python app.py
    print("Checking portfolio pages...\n")
    results = check_all_pages()
    print(format_report(results))
