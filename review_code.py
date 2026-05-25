# review_code.py
# This script runs on every PR.
# It fetches the code diff, sends it to Gemini for review,
# and posts the feedback as a PR comment on GitHub.

import os
import sys
import json
import urllib.request
import urllib.error
import time


def get_pr_diff() -> str:
    """Fetch the code diff for this PR from GitHub."""
    token = os.environ["GITHUB_TOKEN"]
    repo  = os.environ["GITHUB_REPOSITORY"]
    pr_number = os.environ["PR_NUMBER"]

    url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files"

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json"
        }
    )

    with urllib.request.urlopen(req) as response:
        files = json.loads(response.read().decode("utf-8"))

    # Build a readable diff summary
    diff_text = ""
    for f in files:
        filename = f.get("filename", "")
        patch    = f.get("patch", "(binary or no diff)")
        diff_text += f"\n--- {filename} ---\n{patch}\n"

    return diff_text if diff_text.strip() else "No code changes found."


def ask_gemini(diff: str) -> str:
    """Send the diff to Gemini and get a code review."""
    api_key = os.environ["GEMINI_API_KEY"]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    prompt = f"""You are a helpful senior developer reviewing a pull request for a beginner.
Review the following code changes and give friendly, constructive feedback.
Focus on: bugs, missing error handling, unclear variable names, and improvements.
Keep it under 300 words. Use bullet points. Be encouraging.

Code changes:
{diff}
"""

    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}]
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode("utf-8"))
                return result["candidates"][0]["content"]["parts"][0]["text"]
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                print(f"Rate limited, waiting 30 seconds... (attempt {attempt + 1}/3)")
                time.sleep(30)
            else:
                raise


def post_github_comment(comment: str):
    """Post the review as a comment on the PR."""
    token = os.environ["GITHUB_TOKEN"]
    repo  = os.environ["GITHUB_REPOSITORY"]
    pr_number = os.environ["PR_NUMBER"]

    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"

    body = json.dumps({
        "body": f"## AI Code Review\n\n{comment}\n\n---\n*Automated review by your AI DevOps Bot*"
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json"
        },
        method="POST"
    )

    with urllib.request.urlopen(req) as response:
        print(f"Review posted successfully: {response.status}")


if __name__ == "__main__":
    print("Fetching PR diff...")
    diff = get_pr_diff()
    print(f"Got diff ({len(diff)} chars). Sending to Gemini...")

    review = ask_gemini(diff)
    print("Review received:\n", review)

    post_github_comment(review)
