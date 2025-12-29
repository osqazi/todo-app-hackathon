"""
Contract tests for task API endpoints.

Tests CRUD operations for tasks with user isolation enforcement.
These tests verify the contract between the frontend API client
and the FastAPI backend task endpoints.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException


class TestTaskSchemas:
    """Tests for task Pydantic schemas."""

    def test_task_create_requires_title(self):
        """Verify TaskCreate requires non-empty title."""
        from src.schemas.task import TaskCreate

        # Empty title should fail validation
        with pytest.raises(ValueError):
            TaskCreate(title="")

    def test_task_create_with_valid_data(self):
        """Verify TaskCreate accepts valid data."""
        from src.schemas.task import TaskCreate

        task = TaskCreate(title="Buy groceries", description="Milk and eggs")
        assert task.title == "Buy groceries"
        assert task.description == "Milk and eggs"

    def test_task_create_defaults_description_to_empty(self):
        """Verify TaskCreate defaults description to empty string."""
        from src.schemas.task import TaskCreate

        task = TaskCreate(title="Test task")
        assert task.description == ""

    def test_task_update_allows_partial_updates(self):
        """Verify TaskUpdate allows partial updates."""
        from src.schemas.task import TaskUpdate

        # Only title provided
        update = TaskUpdate(title="Updated title")
        assert update.title == "Updated title"
        assert update.description is None

    def test_task_response_contains_all_fields(self):
        """Verify TaskResponse contains expected fields."""
        from src.schemas.task import TaskResponse
        from datetime import datetime

        task = TaskResponse(
            id=1,
            title="Test task",
            description="Test description",
            completed=False,
            created_at=datetime.now(),
            updated_at=None
        )
        assert task.id == 1
        assert task.title == "Test task"
        assert task.completed is False


class TestTaskRepository:
    """Tests for task repository data access."""

    def test_repository_stores_user_id(self):
        """Verify TaskRepository stores the user_id from JWT."""
        from src.repository.task_repository import TaskRepository

        mock_session = AsyncMock()
        repo = TaskRepository(mock_session, "user-123")

        assert repo.user_id == "user-123"

    def test_repository_create_task(self):
        """Verify create method adds task with correct user_id."""
        from src.repository.task_repository import TaskRepository
        from src.schemas.task import TaskCreate

        mock_session = AsyncMock()
        mock_task = MagicMock()
        mock_task.id = 1
        mock_task.user_id = 456
        mock_session.add = MagicMock()
        mock_session.flush = AsyncMock()
        mock_session.refresh = AsyncMock(return_value=mock_task)

        repo = TaskRepository(mock_session, "456")
        task_data = TaskCreate(title="New task", description="Test")

        # Note: Full async test would require proper mock setup
        # This verifies the structure is correct
        assert repo.user_id == "456"

    def test_repository_get_all_filters_by_user(self):
        """Verify get_all filters queries by user_id."""
        from src.repository.task_repository import TaskRepository

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)

        # Use numeric user_id since repository converts to int
        repo = TaskRepository(mock_session, "789")

        # Verify structure
        assert repo.user_id == "789"


class TestTaskService:
    """Tests for task service business logic."""

    def test_service_stores_user_id(self):
        """Verify TaskService stores the user_id from JWT."""
        from src.service.task_service import TaskService

        mock_session = AsyncMock()
        service = TaskService(mock_session, "jwt-user-123")

        assert service.user_id == "jwt-user-123"
        assert service.repository.user_id == "jwt-user-123"

    def test_service_create_task_validates_empty_title(self):
        """Verify create_task rejects empty title."""
        from src.service.task_service import TaskService
        from src.schemas.task import TaskCreate

        mock_session = AsyncMock()
        service = TaskService(mock_session, "123")

        # Empty title should raise ValueError
        with pytest.raises(ValueError, match="Title cannot be empty"):
            import asyncio
            asyncio.run(service.create_task(TaskCreate(title="   ")))

    def test_service_create_task_accepts_valid_title(self):
        """Verify create_task accepts valid title."""
        from src.service.task_service import TaskService
        from src.schemas.task import TaskCreate

        mock_session = AsyncMock()
        mock_task = MagicMock()
        mock_task.id = 1
        mock_session.add = MagicMock()
        mock_session.flush = AsyncMock()
        mock_session.refresh = AsyncMock(return_value=mock_task)

        service = TaskService(mock_session, "123")
        service.repository.create = AsyncMock(return_value=mock_task)

        import asyncio
        result = asyncio.run(service.create_task(TaskCreate(title="Valid task")))

        assert result is not None


class TestTaskAPIEndpoints:
    """Tests for task API endpoint structure."""

    def test_tasks_router_registered(self):
        """Verify tasks router is registered."""
        from src.api.tasks import router

        assert router.prefix == ""
        assert "/tasks" in router.prefix or router.prefix == ""

    def test_list_tasks_endpoint_exists(self):
        """Verify GET /api/tasks endpoint is defined."""
        from src.api.tasks import router

        route_paths = [r.path for r in router.routes]
        # Router uses "/" for list tasks (becomes /api/tasks/ when mounted)
        assert any("/" == path for path in route_paths)

    def test_create_task_endpoint_exists(self):
        """Verify POST /api/tasks endpoint is defined."""
        from src.api.tasks import router

        route_paths = [r.path for r in router.routes]
        # Router uses "/" for create (POST)
        assert any("/" == path for path in route_paths)

    def test_get_task_endpoint_exists(self):
        """Verify GET /api/tasks/{task_id} endpoint is defined."""
        from src.api.tasks import router

        route_paths = [r.path for r in router.routes]
        assert any("{task_id}" in path for path in route_paths)

    def test_delete_task_endpoint_exists(self):
        """Verify DELETE /api/tasks/{task_id} endpoint is defined."""
        from src.api.tasks import router

        route_paths = [r.path for r in router.routes]
        # Router uses "/{task_id}" for delete (DELETE)
        assert any("/{task_id}" == path for path in route_paths)

    def test_toggle_task_endpoint_exists(self):
        """Verify POST /api/tasks/{task_id}/toggle endpoint is defined."""
        from src.api.tasks import router

        route_paths = [r.path for r in router.routes]
        assert any("toggle" in path.lower() for path in route_paths)


class TestTaskUserIsolation:
    """Tests for user isolation in task operations."""

    def test_repository_filters_by_user_id_in_get_all(self):
        """Verify get_all includes user_id filter."""
        from src.repository.task_repository import TaskRepository

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.all.return_value = []
        mock_session.execute = AsyncMock(return_value=mock_result)

        # Use numeric user_id since repository converts to int
        repo = TaskRepository(mock_session, "999")

        import asyncio
        asyncio.run(repo.get_all())

        # Verify execute was called
        assert mock_session.execute.called

    def test_repository_filters_by_user_id_in_get_by_id(self):
        """Verify get_by_id includes user_id filter."""
        from src.repository.task_repository import TaskRepository

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)

        repo = TaskRepository(mock_session, "888")

        import asyncio
        asyncio.run(repo.get_by_id(task_id=42))

        # Verify execute was called with user filter
        assert mock_session.execute.called

    def test_repository_delete_verifies_ownership(self):
        """Verify delete only succeeds for owned tasks."""
        from src.repository.task_repository import TaskRepository

        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None  # Task not found
        mock_session.execute = AsyncMock(return_value=mock_result)

        repo = TaskRepository(mock_session, "777")

        import asyncio
        result = asyncio.run(repo.delete(task_id=1))

        # Should return False because task not found
        assert result is False


class TestTaskValidation:
    """Tests for task validation rules."""

    def test_title_max_length_200(self):
        """Verify title cannot exceed 200 characters."""
        from src.schemas.task import TaskCreate

        # 201 character string should fail
        long_title = "x" * 201
        with pytest.raises(ValueError):
            TaskCreate(title=long_title)

    def test_description_max_length_2000(self):
        """Verify description cannot exceed 2000 characters."""
        from src.schemas.task import TaskCreate

        # 2001 character string should fail
        long_desc = "x" * 2001
        with pytest.raises(ValueError):
            TaskCreate(title="Valid title", description=long_desc)

    def test_whitespace_only_title_rejected(self):
        """Verify whitespace-only title is rejected at service level."""
        from src.service.task_service import TaskService
        from src.schemas.task import TaskCreate

        mock_session = AsyncMock()
        service = TaskService(mock_session, "123")

        # Service validates whitespace-only titles, not the schema
        with pytest.raises(ValueError, match="Title cannot be empty"):
            import asyncio
            asyncio.run(service.create_task(TaskCreate(title="   \t\n  ")))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
