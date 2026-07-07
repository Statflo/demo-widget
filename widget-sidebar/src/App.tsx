import React, { useEffect, useState, useRef } from "react";
import "iframe-resizer-react";
import { useStore } from "zustand";
import "./../node_modules/@statflo/ui/index.css";
import "./App.css";
import { Button, ExpandingCard } from "@statflo/ui";

import widgetStore, { WidgetEvent } from "@statflo/widget-sdk";

/**
 * ACCOUNT COMMENTS WIDGET — SAMPLE TEMPLATE
 * -------------------------------------------------------------------------
 * This is a minimal, end-to-end example of a Statflo widget. Copy this
 * folder as a starting point for your own widget and swap out the pieces
 * marked below.
 *
 * A widget generally does three things:
 *   1. Listens for events from the host app (auth token, current account,
 *      dark mode, etc.) via the widget store.
 *   2. Loads/displays whatever data is relevant to that account.
 *   3. Optionally publishes events back to the host app when the user
 *      takes an action (here: adding a comment).
 *
 * Everything below is intentionally generic so it's easy to delete the
 * "comments" specific bits and replace them with your own feature.
 */

// `widgetStore` from the SDK is a vanilla zustand store (it has getState /
// setState / subscribe, but isn't itself a React hook). `useStore` from
// zustand is what binds a vanilla store to React so it re-renders on change.

// --- Data shape -----------------------------------------------------------
// Replace this with whatever shape your widget's data actually has.
interface Comment {
  id: string;
  author: string;
  timestamp: string; // ISO 8601
  text: string;
}

// Convenience alias so we don't have to write WidgetEvent<any> everywhere.
type WidgetEventType<T = any> = WidgetEvent<T>;

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const App = () => {
  // events / publishEvent / getLatestEvent come from the widget SDK store.
  // - `events` changes whenever the host app sends a new event.
  // - `publishEvent` sends an event from this widget back to the host app.
  // - `getLatestEvent` reads the most recent event without re-rendering.
  const { events, publishEvent, getLatestEvent } = useStore(widgetStore);

  // --- Framework state: present in every widget, keep as-is -------------
  const [initialized, setInitialized] = useState(false);
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [lastEvent, setLastEvent] = useState<WidgetEventType | null>(null);

  // --- Feature-specific state: this is the part you'll change ------------
  const [comments, setComments] = useState<Comment[]>([]);
  const [draftComment, setDraftComment] = useState("");
  const isSendingRef = useRef(false);

  // Load whatever data your widget needs. Here we just fetch a static
  // JSON file for the demo; swap this for a real API call.
  const fetchComments = async () => {
    try {
      const response = await fetch("/comments.json");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments data:", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // --- Listening for events from the host app -----------------------------
  // The host app (Statflo) pushes events like the auth token, the account
  // currently being viewed, and dark-mode preference. Handle whichever of
  // these your widget actually needs; the switch below covers the common
  // ones. `initialized` flips to true once we've heard from the host, so
  // we don't render before we have the context we need (e.g. accountId).
  useEffect(() => {
    const latest = getLatestEvent();
    if (!latest || lastEvent?.type === latest.type) return;
    setLastEvent(latest);

    switch (latest.type) {
      case "TOKEN_UPDATED":
        setToken(latest.data);
        break;
      case "CURRENT_ACCOUNT_ID":
        setAccountId(latest.data);
        break;
      case "DARK_MODE":
        if (latest.data === true) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        setInitialized(true);
        break;
    }
  }, [events]);

  // --- Publishing an event back to the host app ---------------------------
  // Whenever the user does something the host app should know about,
  // call `publishEvent` with a `type` and a `data` payload. The
  // `isSendingRef` guard just prevents accidental double-submits.
  const handleAddComment = () => {
    if (isSendingRef.current || !draftComment.trim()) return;
    isSendingRef.current = true;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: "You",
      timestamp: new Date().toISOString(),
      text: draftComment.trim(),
    };

    // Optimistically update local UI.
    setComments((prev) => [newComment, ...prev]);
    setDraftComment("");

    // Let the host app know a comment was added, e.g. so it can persist it.
    publishEvent({
      type: "COMMENT_ADDED",
      data: { accountId, commentId: newComment.id, text: newComment.text },
    } as WidgetEventType);

    setTimeout(() => {
      isSendingRef.current = false;
    }, 300);
  };

  return (
    <div className="p-1 overflow-hidden relative" style={{ height: "auto" }}>
      {!initialized ? (
        <div className="loading">Loading...</div>
      ) : (
        // ExpandingCard and Button come from @statflo/ui and give you the
        // standard widget "card" chrome for free (title bar, collapse
        // toggle, error state). Swap the title/id for your widget's name.
        <ExpandingCard
          defaultExpanded={true}
          error={false}
          id="account-comments"
          title={{ name: "Account Comments" }}
          translate={(key) => key ?? ""}
        >
          <div className="innerContent">
            <div className="add-comment">
              <textarea
                className="add-comment-input"
                placeholder="Add a comment about this account..."
                value={draftComment}
                onChange={(e) => setDraftComment(e.target.value)}
                rows={2}
              />
              <div className="add-comment-actions">
                <Button
                  className="btn btn-primary add-comment-btn"
                  onClick={handleAddComment}
                  disabled={!draftComment.trim()}
                >
                  Add Comment
                </Button>
              </div>
            </div>

            <ul className="list-group comments-list">
              {comments.map((comment) => (
                <li key={comment.id} className="list-group-item comment-item">
                  <div className="comment-avatar">{getInitials(comment.author)}</div>
                  <div className="comment-main">
                    <div className="comment-header">
                      <span className="fw-semibold comment-author">{comment.author}</span>
                      <span className="text-secondary comment-timestamp">
                        {formatTimestamp(comment.timestamp)}
                      </span>
                    </div>
                    <div className="comment-text">{comment.text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </ExpandingCard>
      )}
    </div>
  );
};

export default App;
