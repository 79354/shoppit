The diagram illustrates a hybrid AI + human support pipeline for handling customer queries in Shoppit.
The system attempts to resolve user queries automatically first, and only escalates to human support when necessary.

1. User Initiates a Query

A customer sends a support message from the platform.
This query is forwarded directly to the AI support module.

2. AI Tries to Resolve the Query

The AI engine processes the message and attempts to provide a response.

If the AI can answer → the response is returned immediately.

If the AI cannot resolve the query → the workflow transitions to escalation.

This decision point is represented by the diamond “Query Resolved?” in the diagram.

3. Escalation to Human Support

When the AI fails, the system generates a Support Room Request.

This request is sent to the Support Dashboard, where several agents are online.
Each agent receives a notification that:

A new unresolved support query is waiting.

This notification is broadcasted to all available agents simultaneously.

4. Agent Acceptance and Room Creation

The moment any one agent accepts:

A unique Chat Room is created (e.g., Room ID #12345).

The user is connected to this room via a live WebSocket session.

The agent joins the same room.

Crucially:

Once an agent accepts the request, it becomes invalid for all other agents.

This prevents duplicate handling and ensures exactly one agent responds.

5. Real-Time Chat

Both sides now communicate in real time:

User ↔ Chat Room ↔ Support Agent

Messages are streamed over WebSockets.

All interactions are saved to the database for history and analytics.

The diagram indicates this with dotted lines pointing to the database.

6. Lifecycle Completion

When the chat ends:

The session is closed.

The room becomes inactive.

Chat logs remain stored permanently.