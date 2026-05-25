# test_app.py — automated tests for app.py
# pytest runs these automatically in the CI pipeline

import pytest
from app import add_task, complete_task, get_tasks, clear_tasks


# This runs before EVERY test so each test starts with a clean slate
@pytest.fixture(autouse=True)
def reset():
    clear_tasks()


# ── add_task ──────────────────────────────────────────────────────────────────

def test_add_task_returns_task():
    task = add_task("Buy milk")
    assert task["title"] == "Buy milk"
    assert task["done"] is False
    assert task["id"] == 1


def test_add_task_trims_whitespace():
    task = add_task("  Buy milk  ")
    assert task["title"] == "Buy milk"


def test_add_multiple_tasks_get_incrementing_ids():
    t1 = add_task("First")
    t2 = add_task("Second")
    assert t1["id"] == 1
    assert t2["id"] == 2


def test_add_empty_task_raises_error():
    with pytest.raises(ValueError, match="cannot be empty"):
        add_task("")


def test_add_whitespace_only_task_raises_error():
    with pytest.raises(ValueError, match="cannot be empty"):
        add_task("   ")


# ── complete_task ─────────────────────────────────────────────────────────────

def test_complete_task_marks_done():
    add_task("Do laundry")
    task = complete_task(1)
    assert task["done"] is True


def test_complete_nonexistent_task_raises_error():
    with pytest.raises(ValueError, match="No task found"):
        complete_task(99)


# ── get_tasks ─────────────────────────────────────────────────────────────────

def test_get_tasks_returns_all():
    add_task("A")
    add_task("B")
    assert len(get_tasks()) == 2


def test_get_tasks_only_pending():
    add_task("A")
    add_task("B")
    complete_task(1)
    pending = get_tasks(only_pending=True)
    assert len(pending) == 1
    assert pending[0]["title"] == "B"


def test_get_tasks_empty_list():
    assert get_tasks() == []
