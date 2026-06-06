"""MCP (Model Context Protocol) layer for Freya."""

from freya.mcp.client import MCPClient
from freya.mcp.protocol import MCPError, MCPNotification, MCPRequest, MCPResponse
from freya.mcp.server import MCPServer
from freya.mcp.transport import (
    InProcessTransport,
    MCPTransport,
    SSETransport,
    StdioTransport,
    StreamableHTTPTransport,
)

__all__ = [
    "MCPClient",
    "MCPError",
    "MCPNotification",
    "MCPRequest",
    "MCPResponse",
    "MCPServer",
    "MCPTransport",
    "InProcessTransport",
    "SSETransport",
    "StdioTransport",
    "StreamableHTTPTransport",
]
