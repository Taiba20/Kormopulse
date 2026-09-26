import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { messageService } from "../services/messageService";
import { getSocket } from "../services/socket";
import { useI18n } from "../i18n/I18nContext";

const AVATAR_FALLBACK = "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";

const formatListTime = (d, locale) => {
  const date = new Date(d);
  const diffHours = (Date.now() - date) / 3600000;
  if (diffHours < 24) return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  if (diffHours < 168) return date.toLocaleDateString(locale, { weekday: "short" });
  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
};

function ConversationRow({ conv, active, onClick }) {
  const { locale, formatNumber } = useI18n();
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-neutral-100 hover:bg-neutral-50 ${active ? "bg-primary/5" : ""}`}
    >
      <div className="relative flex-shrink-0">
        <img src={AVATAR_FALLBACK} alt="" className="h-11 w-11 rounded-full object-cover" />
        {conv.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <p className={`text-sm truncate ${conv.unread > 0 ? "font-semibold text-text-primary" : "font-medium text-text-primary"}`}>{conv.user.name}</p>
          <span className="text-[11px] text-text-muted flex-shrink-0">{formatListTime(conv.lastMessage.createdAt, locale)}</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className="text-xs text-text-secondary truncate">{conv.lastMessage.content}</p>
          {conv.unread > 0 && (
            <span className="flex-shrink-0 bg-primary text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
              {formatNumber(conv.unread)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Messages() {
  const { t, tError, formatTime } = useI18n();
  const { userData } = useSelector((store) => store.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeUserId = searchParams.get("chat");

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [thread, setThread] = useState(null); // { user, messages }
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(!activeUserId);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // Both the socket ("message:new"/"message:sent") and the optimistic update in send() can
  // deliver the same message; de-duping by _id is what keeps it from appearing twice.
  const appendMessage = (message) => {
    setThread((prev) => {
      if (!prev) return prev;
      if (prev.messages.some((m) => m._id === message._id)) return prev;
      return { ...prev, messages: [...prev.messages, message] };
    });
  };

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to load conversations", error);
    } finally {
      setLoadingList(false);
    }
  };

  const loadThread = async (userId) => {
    setLoadingThread(true);
    setOtherTyping(false);
    try {
      const data = await messageService.getConversation(userId);
      setThread(data);
      setConversations((prev) => prev.map((c) => (c.user._id === userId ? { ...c, unread: 0 } : c)));
    } catch (error) {
      console.error("Failed to load conversation", error);
      setThread(null);
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeUserId) {
      loadThread(activeUserId);
      setShowListOnMobile(false);
    } else {
      setThread(null);
    }
  }, [activeUserId]);

  useEffect(() => {
    const socket = getSocket();

    const onNewMessage = (message) => {
      const fromId = message.from?._id || message.from;
      if (String(fromId) === String(activeUserId)) {
        appendMessage(message);
        setOtherTyping(false);
        messageService.markMessageAsRead(message._id).catch(() => {});
      }
      loadConversations();
    };
    const onSent = (message) => {
      // The server echoes every sent message back to the sender's own socket (so a second tab
      // stays in sync); on the tab that actually sent it, send() below already appended it
      // optimistically, so appendMessage's de-dup by _id is what stops it being shown twice.
      const toId = message.to?._id || message.to;
      if (String(toId) === String(activeUserId)) {
        appendMessage(message);
      }
      loadConversations();
    };
    const onTyping = ({ from, isTyping }) => {
      if (String(from) === String(activeUserId)) setOtherTyping(isTyping);
    };

    socket.on("message:new", onNewMessage);
    socket.on("message:sent", onSent);
    socket.on("typing", onTyping);
    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("message:sent", onSent);
      socket.off("typing", onTyping);
    };
  }, [activeUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length, otherTyping]);

  const openConversation = (userId) => {
    setSearchParams({ chat: userId });
  };

  const sendTyping = (isTyping) => {
    if (!activeUserId) return;
    getSocket().emit("typing", { to: activeUserId, isTyping });
  };

  const handleDraftChange = (value) => {
    setDraft(value);
    sendTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(false), 1500);
  };

  const send = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !activeUserId) return;
    setSending(true);
    setDraft("");
    clearTimeout(typingTimeout.current);
    sendTyping(false);
    try {
      const message = await messageService.sendChat(activeUserId, content);
      appendMessage(message);
      loadConversations();
    } catch (error) {
      alert(tError(error, "chat.sendFailed"));
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  const isMine = (m) => (m.from?._id || m.from) !== activeUserId;

  return (
    <div className="mt-16 h-[calc(100vh-4rem)] bg-background-secondary flex">
      {/* Conversation list */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-neutral-200 bg-background overflow-y-auto ${showListOnMobile ? "block" : "hidden md:block"}`}>
        <div className="px-4 py-3.5 border-b border-neutral-200">
          <h1 className="font-semibold text-text-primary">{t("chat.title")}</h1>
        </div>
        {loadingList ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-10 px-4">
            {userData?.role === "jobSeeker" ? t("chat.emptySeeker") : t("chat.emptyEmployer")}
          </p>
        ) : (
          conversations.map((conv) => (
            <ConversationRow
              key={conv.user._id}
              conv={conv}
              active={conv.user._id === activeUserId}
              onClick={() => {
                openConversation(conv.user._id);
                setShowListOnMobile(false);
              }}
            />
          ))
        )}
      </div>

      {/* Thread */}
      <div className={`flex-1 flex flex-col ${showListOnMobile ? "hidden md:flex" : "flex"}`}>
        {!activeUserId ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
            {t("chat.select")}
          </div>
        ) : loadingThread ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !thread ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">{t("chat.notFound")}</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-neutral-200 bg-background flex items-center gap-3">
              <button onClick={() => setShowListOnMobile(true)} className="md:hidden text-text-secondary">
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <img src={AVATAR_FALLBACK} alt="" className="h-9 w-9 rounded-full" />
              <div>
                <p className="font-medium text-text-primary text-sm">{thread.user.name}</p>
                <p className="text-xs text-text-secondary">{thread.user.online ? t("chat.online") : t("chat.offline")}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {thread.messages.map((m) => (
                <div key={m._id} className={`flex ${isMine(m) ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
                      isMine(m) ? "bg-primary text-white rounded-br-sm" : "bg-neutral-100 text-text-primary rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                    <div className={`text-[10px] mt-1 ${isMine(m) ? "text-white/70" : "text-text-muted"}`}>{formatTime(m.createdAt)}</div>
                  </div>
                </div>
              ))}
              {otherTyping && (
                <div className="flex justify-start">
                  <div className="bg-neutral-100 rounded-2xl rounded-bl-sm px-3.5 py-2 text-xs text-text-secondary italic">{t("chat.typing")}</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="border-t border-neutral-200 bg-background px-4 py-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                placeholder={t("chat.placeholder")}
                maxLength={2000}
                className="flex-1 border border-neutral-300 rounded-full px-4 py-2 text-sm bg-background text-text-primary"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="bg-primary text-white rounded-full h-10 w-10 flex items-center justify-center hover:bg-primary-dark disabled:opacity-50 flex-shrink-0"
              >
                <i className="fa-solid fa-paper-plane text-sm"></i>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Messages;
