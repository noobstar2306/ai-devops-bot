# app.py — a simple task manager
# This is the "app" our CI pipeline will test automatically

tasks = []


def add_task(title: str) -> dict:
    """Add a new task and return it."""
    if not task_description or not task_description.strip():
       raise ValueError("Task cannot be empty")
    task = {"id": len(tasks) + 1, "title": title.strip(), "done": False}
    tasks.append(task)
    return task


def complete_task(task_id: int) -> dict:
    """Mark a task as done by its ID."""
    for task in tasks:
        if task["id"] == task_id:
            task["done"] = True
            return task
    raise ValueError(f"No task found with id {task_id}")


def get_tasks(only_pending: bool = False) -> list:
    """Return all tasks, or only pending ones."""
    if only_pending:
        return [t for t in tasks if not t["done"]]
    return list(tasks)


def clear_tasks():
    """Clear all tasks (useful for testing)."""
    tasks.clear()


if __name__ == "__main__":
    # Quick manual demo — run with: python app.py
    clear_tasks()
    add_task("Learn GitHub Actions")
    add_task("Build the CI pipeline")
    add_task("Add AI to the pipeline")
    complete_task(1)

    print("All tasks:")
    for t in get_tasks():
        status = "done" if t["done"] else "pending"
        print(f"  [{status}] {t['id']}. {t['title']}")

    print("\nPending only:")
    for t in get_tasks(only_pending=True):
        print(f"  - {t['title']}")
