"""Data source connectors for Deep Research."""

from freya.connectors._stubs import (
    Attachment,
    BaseConnector,
    Document,
    SyncStatus,
)
from freya.connectors.store import KnowledgeStore

__all__ = ["Attachment", "BaseConnector", "Document", "KnowledgeStore", "SyncStatus"]

# Auto-register built-in connectors
import freya.connectors.obsidian  # noqa: F401

try:
    import freya.connectors.gmail  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.gmail_imap  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.gdrive  # noqa: F401
except ImportError:
    pass  # httpx may not be installed

try:
    import freya.connectors.notion  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.granola  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.gcontacts  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.imessage  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.apple_notes  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.apple_music  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.apple_contacts  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.slack_connector  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.outlook  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.gcalendar  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.dropbox  # noqa: F401
except ImportError:
    pass  # httpx may not be installed

try:
    import freya.connectors.whatsapp  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.oura  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.apple_health  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.strava  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.spotify  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.google_tasks  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.weather  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.github_notifications  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.hackernews  # noqa: F401
except ImportError:
    pass

try:
    import freya.connectors.news_rss  # noqa: F401
except ImportError:
    pass
