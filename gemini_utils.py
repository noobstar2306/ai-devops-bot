# gemini_utils.py — Shared Gemini API and GitHub utilities
# Used by explain_failure.py and review_code.py to avoid duplicated code.
# Any change to the Gemini model, retry logic, or GitHub comment format
# only needs to be made here — both scripts pick it up automatically.

import os
import json
import time
import urllib.request
import urllib.error


# ── Gemini model ──
# Update this one constant to switch model across all scripts.
GEMINI_MODEL = "gemini-2.5-flash"


def call_gemini(prompt: str, max_retries: int = 3) -> str:
    """
    Send a prompt to the Gemini API and return the response text.

    Retries up to max_retries times with a 30-second wait on HTTP 429
    (rate limit) or HTTP 503 (server overloaded). Raises on all other errors.

    Args:
        prompt:      The full prompt string to send.
        max_retries: Number of attempts before giving up (default 3).

    Returns:
        The text response from Gemini as a string.
    """
    api_key = os.environ["GEMINI_API_KEY"]
    url     = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={api_key}"
    )

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}]
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode("utf-8"))
                return result["candidates"][0]["content"]["parts"][0]["text"]

        except urllib.error.HTTPError as e:
            # Retry on rate limit (429) or server overload (503)
            if e.code in (429, 503) and attempt < max_retries - 1:
                wait = 30 * (attempt + 1)  # 30s, 60s on successive retries
                print(f"Gemini {e.code} — waiting {wait}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait)
            else:
                raise RuntimeError(f"Gemini API error {e.code}: {e.reason}") from e

    raise RuntimeError("Gemini API failed after all retries")


def post_github_comment(comment: str, pr_number: str = None) -> bool:
    """
    Post a comment on a GitHub PR or issue via the GitHub API.

    Reads GITHUB_TOKEN and GITHUB_REPOSITORY from environment variables,
    which are injected automatically by GitHub Actions.

    Args:
        comment:   The markdown comment body to post.
        pr_number: PR number as a string. Reads from PR_NUMBER env var if not passed.

    Returns:
        True if the comment was posted successfully, False otherwise.
    """
    token  = os.environ["GITHUB_TOKEN"]
    repo   = os.environ["GITHUB_REPOSITORY"]
    pr_num = pr_number or os.environ.get("PR_NUMBER", "")

    if not pr_num:
        print("No PR number found — skipping GitHub comment.")
        print("Comment content:\n", comment)
        return False

    url = f"https://api.github.com/repos/{repo}/issues/{pr_num}/comments"

    body = json.dumps({"body": comment}).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept":        "application/vnd.github+json",
            "Content-Type":  "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            print(f"GitHub comment posted: HTTP {response.status}")
            return True
    except urllib.error.HTTPError as e:
        print(f"Failed to post GitHub comment: {e.code} {e.reason}")
        return False
