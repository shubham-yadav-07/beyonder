"""
File System Monitor Service — Phase 8
Uses `watchdog` for real OS-level file system events (create/modify/delete/move).
Falls back gracefully if a path doesn't exist (so demo paths like C:/... still work
on Linux dev machines — they're tracked but not actively watched).
"""
from __future__ import annotations
import asyncio, os, logging
from datetime import datetime
from typing import Callable, Optional

logger = logging.getLogger("beyonder.fs_monitor")

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler, FileSystemEvent
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    logger.warning("watchdog not installed — file system monitoring disabled")


class _Handler(FileSystemEventHandler if WATCHDOG_AVAILABLE else object):
    """Routes raw OS events into the async callback via the event loop."""

    def __init__(self, folder_id: str, user_id: str, loop: asyncio.AbstractEventLoop, callback: Callable):
        self.folder_id = folder_id
        self.user_id = user_id
        self.loop = loop
        self.callback = callback

    def _dispatch(self, event_type: str, src_path: str, dest_path: Optional[str] = None):
        asyncio.run_coroutine_threadsafe(
            self.callback(self.folder_id, self.user_id, event_type, src_path, dest_path),
            self.loop,
        )

    def on_created(self, event: "FileSystemEvent"):
        if not event.is_directory:
            self._dispatch("created", event.src_path)

    def on_deleted(self, event: "FileSystemEvent"):
        if not event.is_directory:
            self._dispatch("deleted", event.src_path)

    def on_modified(self, event: "FileSystemEvent"):
        if not event.is_directory:
            self._dispatch("modified", event.src_path)

    def on_moved(self, event: "FileSystemEvent"):
        if not event.is_directory:
            self._dispatch("renamed", event.src_path, event.dest_path)


class FolderMonitorManager:
    """
    Manages one watchdog Observer per monitored folder.
    Singleton — instantiated once in app.main lifespan.
    """

    def __init__(self):
        self._observers: dict[str, "Observer"] = {}
        self._event_callback: Optional[Callable] = None

    def set_callback(self, callback: Callable):
        self._event_callback = callback

    def watch(self, folder_id: str, user_id: str, path: str) -> bool:
        """Start watching a path. Returns True if the watch was started."""
        if not WATCHDOG_AVAILABLE:
            return False
        if folder_id in self._observers:
            return True  # already watching
        if not os.path.isdir(path):
            logger.info(f"Path does not exist on this host, skipping live watch: {path}")
            return False

        loop = asyncio.get_event_loop()
        handler = _Handler(folder_id, user_id, loop, self._event_callback)
        observer = Observer()
        observer.schedule(handler, path, recursive=True)
        observer.start()
        self._observers[folder_id] = observer
        logger.info(f"Started watching: {path} (folder_id={folder_id})")
        return True

    def unwatch(self, folder_id: str):
        observer = self._observers.pop(folder_id, None)
        if observer:
            observer.stop()
            observer.join(timeout=2)
            logger.info(f"Stopped watching folder_id={folder_id}")

    def stop_all(self):
        for folder_id in list(self._observers.keys()):
            self.unwatch(folder_id)

    @property
    def active_count(self) -> int:
        return len(self._observers)


# Global singleton
fs_monitor = FolderMonitorManager()


def count_files(path: str) -> int:
    """Count files in a directory tree. Returns 0 if path doesn't exist."""
    if not os.path.isdir(path):
        return 0
    total = 0
    for _, _, files in os.walk(path):
        total += len(files)
    return total
