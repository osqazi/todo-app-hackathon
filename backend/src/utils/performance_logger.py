"""
Performance logging utilities for monitoring response times and tool calls.

Tracks latency, tool execution times, and provides metrics for optimization.
"""
import time
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager
from datetime import datetime
import json


class PerformanceMetrics:
    """Singleton for collecting performance metrics."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.metrics = []
            cls._instance.tool_metrics = []
            cls._instance.audit_log_enabled = True  # FR-019: Enable audit logging
            cls._instance.audit_log_path = "logs/agent_audit.log"  # FR-019: Log file path
        return cls._instance

    def log_chat_request(
        self,
        user_id: str,
        message_length: int,
        response_time_ms: float,
        tool_calls: int,
        streaming: bool,
        success: bool,
        error: Optional[str] = None
    ):
        """
        Log a chat request metric.

        Args:
            user_id: User identifier
            message_length: Length of user message
            response_time_ms: Total response time in milliseconds
            tool_calls: Number of tool calls made
            streaming: Whether streaming was used
            success: Whether request succeeded
            error: Error message if failed
        """
        metric = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "message_length": message_length,
            "response_time_ms": response_time_ms,
            "tool_calls": tool_calls,
            "streaming": streaming,
            "success": success,
            "error": error
        }
        self.metrics.append(metric)

        # Keep only last 1000 metrics to prevent memory leak
        if len(self.metrics) > 1000:
            self.metrics = self.metrics[-1000:]

    def log_tool_call(
        self,
        tool_name: str,
        execution_time_ms: float,
        success: bool,
        error: Optional[str] = None,
        arguments: Optional[Dict[str, Any]] = None,
        result: Optional[Any] = None,
        user_id: Optional[str] = None
    ):
        """
        Log a tool call metric (FR-019: Logging for debugging/auditing).

        Args:
            tool_name: Name of the MCP tool called
            execution_time_ms: Tool execution time in milliseconds
            success: Whether tool call succeeded
            error: Error message if failed
            arguments: Tool call arguments (for audit trail)
            result: Tool call result (sanitized for logging)
            user_id: User who initiated the tool call (for auditing)
        """
        metric = {
            "timestamp": datetime.now().isoformat(),
            "tool_name": tool_name,
            "execution_time_ms": execution_time_ms,
            "success": success,
            "error": error,
            "arguments": arguments,  # FR-019: Audit trail
            "result_preview": str(result)[:200] if result else None,  # Truncate for memory
            "user_id": user_id  # FR-019: User attribution
        }
        self.tool_metrics.append(metric)

        # Keep only last 1000 tool metrics
        if len(self.tool_metrics) > 1000:
            self.tool_metrics = self.tool_metrics[-1000:]

        # FR-019: Write to persistent log file for auditing (optional, configurable)
        self._write_to_audit_log(metric)

    def get_summary(self) -> Dict[str, Any]:
        """
        Get performance summary statistics.

        Returns:
            Dictionary with performance statistics
        """
        if not self.metrics:
            return {"message": "No metrics collected yet"}

        response_times = [m["response_time_ms"] for m in self.metrics if m["success"]]
        tool_times = [m["execution_time_ms"] for m in self.tool_metrics if m["success"]]

        return {
            "total_requests": len(self.metrics),
            "successful_requests": sum(1 for m in self.metrics if m["success"]),
            "failed_requests": sum(1 for m in self.metrics if not m["success"]),
            "avg_response_time_ms": sum(response_times) / len(response_times) if response_times else 0,
            "max_response_time_ms": max(response_times) if response_times else 0,
            "min_response_time_ms": min(response_times) if response_times else 0,
            "p95_response_time_ms": sorted(response_times)[int(len(response_times) * 0.95)] if response_times else 0,
            "total_tool_calls": len(self.tool_metrics),
            "avg_tool_time_ms": sum(tool_times) / len(tool_times) if tool_times else 0,
            "streaming_requests": sum(1 for m in self.metrics if m.get("streaming")),
            "non_streaming_requests": sum(1 for m in self.metrics if not m.get("streaming"))
        }

    def get_recent_metrics(self, limit: int = 100) -> list[Dict[str, Any]]:
        """
        Get recent metrics.

        Args:
            limit: Maximum number of metrics to return

        Returns:
            List of recent metrics
        """
        return self.metrics[-limit:]

    def _write_to_audit_log(self, metric: Dict[str, Any]):
        """
        Write tool call to persistent audit log (FR-019).

        Creates logs/ directory if it doesn't exist.
        Logs are append-only for audit compliance.
        """
        if not self.audit_log_enabled:
            return

        try:
            import os
            from pathlib import Path

            # Ensure logs directory exists
            log_file = Path(self.audit_log_path)
            log_file.parent.mkdir(parents=True, exist_ok=True)

            # Append to audit log (JSON Lines format for easy parsing)
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(metric) + '\n')

        except Exception as e:
            # Don't fail requests if logging fails, but print warning
            print(f"Warning: Failed to write audit log: {e}")


# Global performance metrics instance
perf_metrics = PerformanceMetrics()


@asynccontextmanager
async def measure_time(operation_name: str):
    """
    Context manager for measuring operation time.

    Usage:
        async with measure_time("my_operation") as timer:
            # Your code here
            pass
        print(f"Operation took {timer.elapsed_ms}ms")

    Args:
        operation_name: Name of the operation being measured

    Yields:
        Timer object with elapsed_ms property
    """
    class Timer:
        def __init__(self):
            self.start_time = time.time()
            self.elapsed_ms = 0

        def stop(self):
            self.elapsed_ms = (time.time() - self.start_time) * 1000

    timer = Timer()
    try:
        yield timer
    finally:
        timer.stop()
        print(f"[PERF] {operation_name}: {timer.elapsed_ms:.2f}ms")
