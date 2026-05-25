# explain_failure.py
# This script runs when your CI pipeline fails.
# It reads the error log, asks Gemini to explain it,
# and posts the explanation as a comment on your GitHub PR.

import os
import sys
import json
import urllib.request
import urllib.error

def ask_gemini(error_log: str) -> str:
    """Send the error log to Gemini and get a plain-English explanation."""
    import time
    api_key = os.environ["GEMINI_API_KEY"]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key={api_key}"

    prompt = f"""You are a helpful DevOps assistant for a beginner developer.
A CI pipeline just failed. Explain what went wrong in simple, friendly language.
Keep it under 200 words. Suggest one specific fix.

Here is the error output:
{error_log}
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
    """Post a comment on the GitHub PR that triggered this pipeline."""
    token = os.environ["GITHUB_TOKEN"]
    repo  = os.environ["GITHUB_REPOSITORY"]
    pr_number = os.environ.get("PR_NUMBER", "")

    if not pr_number:
        print("No PR number found — skipping GitHub comment.")
        print("AI explanation:\n", comment)
        return

    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"

    body = json.dumps({
        "body": f"## AI Build Failure Analysis\n\n{comment}\n\n---\n*Powered by Gemini via your AI DevOps Bot*"
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

    try:
        with urllib.request.urlopen(req) as response:
            print(f"Comment posted successfully: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"Failed to post comment: {e.code} {e.reason}")


if __name__ == "__main__":
    # Read the error log passed as a command-line argument
    if len(sys.argv) < 2:
        print("Usage: python explain_failure.py '<error log>'")
        sys.exit(1)

    error_log = sys.argv[1]
    print("Sending error to Gemini for analysis...")

    explanation = ask_gemini(error_log)
    print("Gemini says:\n", explanation)

    post_github_comment(explanation)
