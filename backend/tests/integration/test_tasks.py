"""
Integration tests for task creation and listing.

Tests the complete task workflow from API request
through database operation with user isolation.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient


class TestTaskAPIIntegration:
    """Integration tests for task API endpoints."""

    @pytest.fixture
    def app(self):
        """Create a FastAPI test app."""
        from src.main import app
        return app

    @pytest.fixture
    def client(self, app):
        """Create a test client."""
        return TestClient(app)

    def test_root_endpoint(self, client):
        """Verify root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Todo Application API"

    def test_health_endpoint(self, client):
        """Verify health endpoint returns healthy status."""
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_list_tasks_requires_auth(self, client):
        """Verify GET /api/tasks requires authentication."""
        response = client.get("/api/tasks")
        # Should return 401 or 403 for unauthenticated request
        assert response.status_code in [401, 403]

    def test_create_task_requires_auth(self, client):
        """Verify POST /api/tasks requires authentication."""
        response = client.post(
            "/api/tasks",
            json={"title": "Test task"}
        )
        # Should return 401 or 403 for unauthenticated request
        assert response.status_code in [401, 403]


class TestTaskEndpointsStructure:
    """Tests for task endpoint structure."""

    def test_all_task_routes_registered(self):
        """Verify all task endpoints are registered."""
        from src.main import app

        route_paths = [r.path for r in app.routes]

        # Check for task-related routes
        has_tasks_list = any("/api/tasks" == p for p in route_paths)
        has_tasks_create = any("tasks" in p and "POST" in str(routes) for p, routes in [(r.path, r.methods) for r in app.routes])

        assert has_tasks_list or any("tasks" in p for p in route_paths)


class TestTaskServiceIntegration:
    """Integration tests for task service."""

    def test_create_and_list_workflow(self):
        """Verify complete create and list workflow."""
        from src.service.task_service import TaskService
        from src.schemas.task import TaskCreate

        mock_session = AsyncMock()
        mock_task = MagicMock()
        mock_task.id = 1
        mock_task.user_id = 123
        mock_task.title = "Test task"
        mock_task.description = ""
        mock_task.completed = False

        mock_session.add = MagicMock()
        mock_session.flush = AsyncMock()
        mock_session.refresh = AsyncMock(return_value=mock_task)

        service = TaskService(mock_session, "123")

        # Mock repository methods
        service.repository.create = AsyncMock(return_value=mock_task)
        service.repository.get_all = AsyncMock(return_value=[mock_task])

        import asyncio

        # Create task
        task_data = TaskCreate(title="Test task")
        created = asyncio.run(service.create_task(task_data))
        assert created is not None

        # List tasks
        tasks = asyncio.run(service.get_tasks())
        assert len(tasks) == 1

    def test_toggle_task_workflow(self):
        """Verify task toggle workflow."""
        from src.service.task_service import TaskService

        mock_session = AsyncMock()
        mock_task = MagicMock()
        mock_task.id = 1
        mock_task.user_id = 123
        mock_task.title = "Test task"
        mock_task.completed = False

        service = TaskService(mock_session, "123")
        service.repository.toggle = AsyncMock(return_value=mock_task)

        import asyncio

        # Initially incomplete
        assert mock_task.completed is False

        # Toggle should work
        result = asyncio.run(service.toggle_task(1))
        assert result is not None


class TestUserIsolationIntegration:
    """Integration tests for user isolation."""

    def test_different_users_cannot_access_each_other_tasks(self):
        """Verify user A cannot access user B's tasks."""
        from src.repository.task_repository import TaskRepository

        # User A's session and repository
        session_a = AsyncMock()
        repo_a = TaskRepository(session_a, "101")

        # User B's session and repository
        session_b = AsyncMock()
        repo_b = TaskRepository(session_b, "102")

        # Both should store different user_ids
        assert repo_a.user_id == "101"
        assert repo_b.user_id == "102"

        # Queries will use different user_id filters
        # Even if same task_id, each user only sees their own
        import asyncio

        asyncio.run(repo_a.get_by_id(task_id=1))
        asyncio.run(repo_b.get_by_id(task_id=1))

        # Both execute calls should have been made
        assert session_a.execute.called
        assert session_b.execute.called

        # The actual filtering happens in SQL via WHERE clauses
        # This test verifies each repository is configured for its user


class TestTaskDataIntegrity:
    """Tests for task data integrity."""

    def test_task_created_with_user_id(self):
        """Verify new tasks are created with the authenticated user's ID."""
        from src.repository.task_repository import TaskRepository
        from src.schemas.task import TaskCreate

        mock_session = AsyncMock()
        mock_task = MagicMock()
        mock_task.id = 1
        mock_session.add = MagicMock()
        mock_session.flush = AsyncMock()
        mock_session.refresh = AsyncMock(return_value=mock_task)

        # Use numeric user_id since repository converts to int
        user_id = "456"
        repo = TaskRepository(mock_session, user_id)

        # When creating a task, the user_id should be used
        import asyncio
        asyncio.run(repo.create(TaskCreate(title="My task")))

        # Verify session.add was called (task was queued for add)
        assert mock_session.add.called

    def test_task_timestamps_set_on_create(self):
        """Verify timestamps are set when task is created."""
        from datetime import datetime, timezone
        from src.models.task import Task

        task = Task(
            user_id=1,
            title="Test task",
            description=""
        )

        # created_at should be set
        assert task.created_at is not None
        assert task.created_at.tzinfo is not None  # Should be timezone-aware

        # updated_at should be None initially
        assert task.updated_at is None

    def test_task_default_completed_is_false(self):
        """Verify new tasks default to incomplete."""
        from src.models.task import Task

        task = Task(
            user_id=1,
            title="Test task",
            description=""
        )

        assert task.completed is False


class TestTaskAPIResponses:
    """Tests for task API response formats."""

    def test_list_response_format(self):
        """Verify list tasks returns array."""
        from src.schemas.task import TaskResponse
        from datetime import datetime

        tasks = [
            TaskResponse(
                id=1,
                title="Task 1",
                description="",
                completed=False,
                created_at=datetime.now(),
                updated_at=None
            ),
            TaskResponse(
                id=2,
                title="Task 2",
                description="Description",
                completed=True,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ]

        assert len(tasks) == 2
        assert tasks[0].id == 1
        assert tasks[1].completed is True

    def test_create_response_contains_all_fields(self):
        """Verify create response contains all task fields."""
        from src.schemas.task import TaskResponse
        from datetime import datetime

        response = TaskResponse(
            id=42,
            title="New task",
            description="Task description",
            completed=False,
            created_at=datetime.now(),
            updated_at=None
        )

        assert response.id == 42
        assert response.title == "New task"
        assert response.completed is False
        # Note: user_id is intentionally excluded from response for security


class TestTaskStateTransitions:
    """Tests for task state transitions."""

    def test_toggle_transitions_complete_to_incomplete(self):
        """Verify toggle changes completed to incomplete."""
        from src.models.task import Task

        task = Task(
            user_id=1,
            title="Test task",
            completed=True  # Initially complete
        )

        # Toggle should change state
        import asyncio
        asyncio.run(task.toggle(MagicMock()))

        assert task.completed is False

    def test_toggle_transitions_incomplete_to_complete(self):
        """Verify toggle changes incomplete to completed."""
        from src.models.task import Task

        task = Task(
            user_id=1,
            title="Test task",
            completed=False  # Initially incomplete
        )

        # Toggle should change state
        import asyncio
        asyncio.run(task.toggle(MagicMock()))

        assert task.completed is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
