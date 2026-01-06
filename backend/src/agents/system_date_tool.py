"""
System date/time tool for AI agent to get current system date/time.

This tool allows the AI agent to fetch the current system date and time,
bypassing any fixed date contexts that may be present in the AI model.
"""

from agents import function_tool
from datetime import datetime, timedelta
import calendar
import re
from typing import Dict, Any


@function_tool
async def get_system_date_time() -> Dict[str, Any]:
    """
    Get the current system date and time.

    This tool provides the actual current date and time from the system
    clock, which can be used by the AI agent for accurate date calculations
    instead of relying on potentially fixed model date contexts.

    Returns:
        Dict containing current date/time information in multiple formats:
        - iso_format: ISO 8601 format (YYYY-MM-DDTHH:MM:SS)
        - date_only: Date only in YYYY-MM-DD format
        - readable_format: Human-readable format
        - timestamp: Unix timestamp
    """
    now = datetime.now()

    return {
        "iso_format": now.isoformat(),
        "date_only": now.date().isoformat(),
        "readable_format": now.strftime("%A, %B %d, %Y at %I:%M %p"),
        "timestamp": int(now.timestamp()),
        "timezone_info": str(now.astimezone().tzinfo)
    }


@function_tool
async def get_relative_date(target: str) -> Dict[str, Any]:
    """
    Get a date relative to the current system date.

    Args:
        target: Relative date expression (e.g., "tomorrow", "day after tomorrow", "next week")

    Returns:
        Dict with the calculated date in multiple formats
    """
    # Get current system date
    today = datetime.now().date()

    target_lower = target.lower().strip()

    # Determine the target date based on the expression
    if "tomorrow" in target_lower:
        target_date = today + timedelta(days=1)
    elif "day after tomorrow" in target_lower or "day after now" in target_lower:
        target_date = today + timedelta(days=2)
    elif "yesterday" in target_lower:
        target_date = today - timedelta(days=1)
    elif "today" in target_lower or "now" in target_lower:
        target_date = today
    elif "next week" in target_lower:
        # Calculate next Monday
        days_ahead = 0 - today.weekday()  # 0 is Monday
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        target_date = today + timedelta(days=days_ahead)
    elif "next month" in target_lower:
        # Calculate first day of next month
        if today.month == 12:
            target_date = today.replace(year=today.year + 1, month=1, day=1)
        else:
            target_date = today.replace(month=today.month + 1, day=1)
    elif "next year" in target_lower:
        target_date = today.replace(year=today.year + 1, month=1, day=1)
    else:
        # Check for expressions like "in X days", "in X weeks", etc.
        match = re.search(r'in\s+(\d+)\s+(day|week|month|year)', target_lower)
        if match:
            quantity = int(match.group(1))
            unit = match.group(2)

            if unit.startswith("day"):
                target_date = today + timedelta(days=quantity)
            elif unit.startswith("week"):
                target_date = today + timedelta(weeks=quantity)
            elif unit.startswith("month"):
                # Calculate months ahead (approximately)
                target_month = today.month + quantity
                target_year = today.year + (target_month - 1) // 12
                target_month = ((target_month - 1) % 12) + 1
                # Handle day overflow (e.g., Jan 31 + 1 month)
                # Calculate max days in the target month
                max_days_in_month = calendar.monthrange(target_year, target_month)[1]
                target_day = min(today.day, max_days_in_month)
                try:
                    target_date = today.replace(year=target_year, month=target_month, day=target_day)
                except ValueError:  # Handle day overflow
                    target_date = today.replace(year=target_year, month=target_month, day=max_days_in_month)
            elif unit.startswith("year"):
                try:
                    target_date = today.replace(year=today.year + quantity)
                except ValueError:  # Handle leap year edge case
                    target_date = today.replace(year=today.year + quantity, day=28)
        else:
            # If we can't parse the relative expression, default to today
            target_date = today

    # Now check if the original target contains time information to append to the date
    time_match = re.search(r'at\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?', target, re.IGNORECASE)

    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0
        period = time_match.group(3).upper() if time_match.group(3) else None

        # Convert to 24-hour format if needed
        if period == 'PM' and hour != 12:
            hour += 12
        elif period == 'AM' and hour == 12:
            hour = 0

        # Ensure valid ranges
        hour = min(max(hour, 0), 23)
        minute = min(max(minute, 0), 59)

        # Create datetime with the calculated date and extracted time
        result_datetime = datetime.combine(target_date, datetime.min.time()).replace(hour=hour, minute=minute)

        return {
            "iso_format": result_datetime.isoformat(),
            "date_only": target_date.isoformat(),
            "readable_format": result_datetime.strftime("%A, %B %d, %Y at %I:%M %p"),
            "time_portion": f"{hour:02d}:{minute:02d}"
        }
    else:
        # Return date with 00:00:00 time
        result_datetime = datetime.combine(target_date, datetime.min.time())

        return {
            "iso_format": result_datetime.isoformat(),
            "date_only": target_date.isoformat(),
            "readable_format": result_datetime.strftime("%A, %B %d, %Y"),
            "time_portion": "00:00"
        }