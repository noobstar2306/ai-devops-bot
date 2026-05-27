# test_app.py — automated tests for app.py (portfolio health checker)
# pytest runs these automatically in the CI pipeline on every push.
# Tests cover: check_page, check_all_pages, get_summary, format_report.

import pytest
from unittest.mock import patch, MagicMock
import urllib.error

from app import check_page, check_all_pages, get_summary, format_report


# ── FIXTURES ──────────────────────────────────────────────────────────────────

# A fake successful HTTP response used by mock patches
def make_mock_response(status=200):
    mock = MagicMock()
    mock.status = status
    mock.__enter__ = lambda s: s
    mock.__exit__  = MagicMock(return_value=False)
    return mock


# ── check_page ────────────────────────────────────────────────────────────────

def test_check_page_returns_ok_on_200():
    """A reachable page returning 200 should produce ok=True."""
    with patch("urllib.request.urlopen", return_value=make_mock_response(200)):
        result = check_page("Test page", "https://example.com")
    assert result["ok"]     is True
    assert result["status"] == 200
    assert result["error"]  is None
    assert result["name"]   == "Test page"


def test_check_page_returns_not_ok_on_404():
    """A page returning 404 should produce ok=False."""
    with patch("urllib.request.urlopen", side_effect=urllib.error.HTTPError(
        url=None, code=404, msg="Not Found", hdrs=None, fp=None
    )):
        result = check_page("Missing page", "https://example.com/missing")
    assert result["ok"]     is False
    assert result["status"] == 404


def test_check_page_returns_not_ok_on_network_error():
    """A network failure should produce ok=False with an error message."""
    with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("Connection refused")):
        result = check_page("Unreachable", "https://unreachable.example.com")
    assert result["ok"]    is False
    assert result["error"] is not None
    assert result["status"] is None


def test_check_page_raises_on_invalid_url():
    """An invalid URL should raise a ValueError before making a request."""
    with pytest.raises(ValueError, match="Invalid URL"):
        check_page("Bad URL", "not-a-url")


def test_check_page_raises_on_empty_url():
    """An empty URL should raise a ValueError."""
    with pytest.raises(ValueError, match="Invalid URL"):
        check_page("Empty", "")


# ── check_all_pages ───────────────────────────────────────────────────────────

def test_check_all_pages_returns_result_per_page():
    """check_all_pages should return one result dict per page in the list."""
    pages = [
        {"name": "Page A", "url": "https://a.example.com"},
        {"name": "Page B", "url": "https://b.example.com"},
    ]
    with patch("urllib.request.urlopen", return_value=make_mock_response(200)):
        results = check_all_pages(pages)
    assert len(results) == 2


def test_check_all_pages_empty_list():
    """An empty pages list should return an empty results list."""
    results = check_all_pages([])
    assert results == []


def test_check_all_pages_mixed_results():
    """check_all_pages should handle a mix of passing and failing pages."""
    pages = [
        {"name": "Good", "url": "https://good.example.com"},
        {"name": "Bad",  "url": "https://bad.example.com"},
    ]

    def side_effect(req, timeout=10):
        if "good" in req.full_url:
            return make_mock_response(200)
        raise urllib.error.HTTPError(url=None, code=500, msg="Error", hdrs=None, fp=None)

    with patch("urllib.request.urlopen", side_effect=side_effect):
        results = check_all_pages(pages)

    passed = [r for r in results if r["ok"]]
    failed = [r for r in results if not r["ok"]]
    assert len(passed) == 1
    assert len(failed) == 1


# ── get_summary ───────────────────────────────────────────────────────────────

def test_get_summary_all_passing():
    """All passing results should produce healthy=True and failed=0."""
    results = [
        {"ok": True},
        {"ok": True},
        {"ok": True},
    ]
    summary = get_summary(results)
    assert summary["total"]   == 3
    assert summary["passed"]  == 3
    assert summary["failed"]  == 0
    assert summary["healthy"] is True


def test_get_summary_some_failing():
    """Any failing result should produce healthy=False."""
    results = [
        {"ok": True},
        {"ok": False},
        {"ok": True},
    ]
    summary = get_summary(results)
    assert summary["failed"]  == 1
    assert summary["healthy"] is False


def test_get_summary_empty_results():
    """Empty results should return healthy=True with all counts at zero."""
    summary = get_summary([])
    assert summary["total"]   == 0
    assert summary["healthy"] is True


def test_get_summary_all_failing():
    """All failing results should return healthy=False."""
    results = [{"ok": False}, {"ok": False}]
    summary = get_summary(results)
    assert summary["passed"]  == 0
    assert summary["healthy"] is False


# ── format_report ─────────────────────────────────────────────────────────────

def test_format_report_contains_page_names():
    """The report should include every page name from the results."""
    results = [
        {"name": "Portfolio",  "url": "https://a.com", "status": 200, "ok": True,  "error": None},
        {"name": "Dashboard",  "url": "https://b.com", "status": 404, "ok": False, "error": "Not Found"},
    ]
    report = format_report(results)
    assert "Portfolio"  in report
    assert "Dashboard"  in report


def test_format_report_shows_healthy_when_all_pass():
    """Report should say HEALTHY when all pages pass."""
    results = [
        {"name": "Page", "url": "https://a.com", "status": 200, "ok": True, "error": None}
    ]
    report = format_report(results)
    assert "HEALTHY" in report


def test_format_report_shows_unhealthy_on_failure():
    """Report should say UNHEALTHY when any page fails."""
    results = [
        {"name": "Page", "url": "https://a.com", "status": 500, "ok": False, "error": "Server Error"}
    ]
    report = format_report(results)
    assert "UNHEALTHY" in report


def test_format_report_shows_error_detail():
    """Report should include error details for failed pages."""
    results = [
        {"name": "Page", "url": "https://a.com", "status": None, "ok": False, "error": "Connection refused"}
    ]
    report = format_report(results)
    assert "Connection refused" in report
