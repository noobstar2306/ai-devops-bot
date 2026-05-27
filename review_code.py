# review_code.py
# Runs on every pull request in the CI pipeline.
# Fetches the code diff from GitHub, sends it to Gemini for review,
# and posts the feedback as a PR comment.
#
# Covers all file types in the repo:
#   Python (.py), GitHub Actions (.yml), HTML (.html), JavaScript (.js)

import os
import json
import urllib.request
import urllib.error
from gemini_utils import call_gemini, post_github_comment


# ── DIFF SIZE LIMIT ──
# Caps the diff at 8000 characters before sending to Gemini.
# Prevents context window errors on large PRs.
MAX_DIFF_CHARS = 8000

# ── FILE FILTER ──
# Only review files with these extensions — skip binaries, lockfiles, etc.
REVIEWABLE_EXTENSIONS = (".py", ".yml", ".yaml", ".html", ".js", ".md", ".txt")

# ── PROMPT TEMPLATE ──
# Instructs Gemini to review all file types in the project.
REVIEW_PROMPT = """You are a helpful senior developer reviewing a pull request for a beginner DevOps engineer.
The project is a portfolio site. Files may include:
  - Python scripts (app.py, gemini_utils.py, explain_failure.py, review_code.py)
  - GitHub Actions YAML workflows
  - HTML/CSS portfolio pages (index.html, hobbies.html, dashboard/index.html)
  - JavaScript widgets (widgets.js)

Review the following code changes and give friendly, constructive feedback.
Focus on: bugs, missing error handling, security issues, unclear naming, and improvements.
Keep it under 300 words. Use bullet points. Be encouraging and specific.

Code changes:
{diff}
"""


def get_pr_diff() -> str:
    """
    Fetch changed files for the current PR from the GitHub API.

    Filters to only reviewable file extensions and truncates the total
    diff to MAX_DIFF_CHARS to stay within Gemini's context window.

    Returns:
        A formatted string of file diffs ready to send to Gemini.
    """
    token     = os.environ["GITHUB_TOKEN"]
    repo      = os.environ["GITHUB_REPOSITORY"]
    pr_number = os.environ["PR_NUMBER"]

    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files"

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept":        "application/vnd.github+json"
        }
    )

    try:
        with urllib.request.urlopen(req) as response:
            files = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Failed to fetch PR diff: {e.code} {e.reason}") from e

    diff_text  = ""
    file_count = 0

    for f in files:
        filename = f.get("filename", "")

        # Skip files we don't want to review (binaries, lock files, etc.)
        if not filename.endswith(REVIEWABLE_EXTENSIONS):
            print(f"Skipping: {filename}")
            continue

        patch = f.get("patch", "(binary or no diff available)")
        diff_text  += f"\n--- {filename} ---\n{patch}\n"
        file_count += 1

    if not diff_text.strip():
        return "No reviewable code changes found in this PR."

    # Truncate if diff exceeds the size limit
    if len(diff_text) > MAX_DIFF_CHARS:
        diff_text = diff_text[:MAX_DIFF_CHARS] + "\n\n... (diff truncated — too large)"
        print(f"Diff truncated to {MAX_DIFF_CHARS} characters.")

    print(f"Reviewing {file_count} file(s), {len(diff_text)} characters.")
    return diff_text


def review_pr() -> None:
    """
    Main function: fetch the PR diff, send to Gemini, post the review comment.
    Handles errors gracefully so a failed review doesn't break the pipeline.
    """
    print("Fetching PR diff...")
    diff = get_pr_diff()

    print("Sending diff to Gemini for review...")
    prompt = REVIEW_PROMPT.format(diff=diff)

    try:
        review = call_gemini(prompt)
        print("Review received.")
    except RuntimeError as e:
        # Don't fail the pipeline if the AI review fails
        print(f"Gemini review failed: {e}")
        review = "AI code review unavailable for this PR — Gemini API error."

    comment = (
        "## 🤖 AI Code Review\n\n"
        f"{review}\n\n"
        "---\n"
        "*Automated review by Gemini via your AI DevOps Bot*"
    )

    post_github_comment(comment)


if __name__ == "__main__":
    review_pr()
