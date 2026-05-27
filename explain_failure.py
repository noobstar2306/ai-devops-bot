# explain_failure.py
# Runs inside the CI pipeline when tests fail.
# Reads the error log from a file, asks Gemini to explain it in plain English,
# and posts the explanation as a comment on the GitHub PR.
#
# Usage: python explain_failure.py test_output.txt
# (reads from file path — avoids shell argument length limits on large logs)

import sys
from gemini_utils import call_gemini, post_github_comment


# ── PROMPT TEMPLATE ──
# Instructs Gemini to act as a friendly DevOps assistant explaining CI failures.
# Covers all file types in the repo: Python tests, HTML pages, JS widgets, YAML.
FAILURE_PROMPT = """You are a helpful DevOps assistant for a beginner developer.
A CI pipeline just failed. Explain what went wrong in simple, friendly language.
The project is a portfolio site with Python scripts, GitHub Actions workflows,
HTML/CSS pages, and a JavaScript widgets file.

Keep your explanation under 200 words.
Suggest one specific fix the developer can make right now.

Here is the error output:
{error_log}
"""


def explain_failure(log_file_path: str) -> None:
    """
    Read a test output log file, send it to Gemini for analysis,
    and post the explanation as a GitHub PR comment.

    Args:
        log_file_path: Path to the file containing the CI error output.
    """
    # Read error log from file — safer than passing large text as a shell arg
    try:
        with open(log_file_path, "r") as f:
            error_log = f.read().strip()
    except FileNotFoundError:
        print(f"Error: log file '{log_file_path}' not found.")
        sys.exit(1)

    if not error_log:
        print("Log file is empty — nothing to analyse.")
        sys.exit(0)

    # Truncate very large logs to avoid exceeding Gemini's context window
    MAX_LOG_CHARS = 6000
    if len(error_log) > MAX_LOG_CHARS:
        error_log = error_log[:MAX_LOG_CHARS] + "\n\n... (log truncated)"
        print(f"Log truncated to {MAX_LOG_CHARS} characters.")

    print("Sending error log to Gemini for analysis...")
    prompt      = FAILURE_PROMPT.format(error_log=error_log)
    explanation = call_gemini(prompt)
    print("Gemini explanation received.")

    # Format as a clear PR comment with context
    comment = (
        "## 🤖 AI Build Failure Analysis\n\n"
        f"{explanation}\n\n"
        "---\n"
        "*Powered by Gemini via your AI DevOps Bot*"
    )

    post_github_comment(comment)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python explain_failure.py <path-to-log-file>")
        print("Example: python explain_failure.py test_output.txt")
        sys.exit(1)

    explain_failure(sys.argv[1])
