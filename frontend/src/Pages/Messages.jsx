import React, { useState, useEffect } from 'react';
import { messageService } from '../services/messageService';
import { useSelector } from 'react-redux';

function Messages() {
  const { userData } = useSelector((store) => store.auth);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [responseTexts, setResponseTexts] = useState({});
  const [respondingTo, setRespondingTo] = useState(null);
  const [filter, setFilter] = useState({
    type: 'all',
    isRead: 'all',
    page: 1,
    limit: 20
  });

  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('Fetching messages with filter:', filter);
      const response = await messageService.getMyMessages(filter);
      console.log('Messages response:', response);
      setMessages(response.data?.messages || response.messages || []);
      setPagination(response.data?.pagination || response.pagination || {});
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await messageService.getUnreadMessageCount();
      setUnreadCount(response.data?.unreadCount || response.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const markAsRead = async (messageId) => {
    try {
      await messageService.markMessageAsRead(messageId);
      // Update the message in the list
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, isRead: true, readAt: new Date() } : msg
      ));
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await messageService.markAllMessagesAsRead();
      setMessages(messages.map(msg => ({ ...msg, isRead: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'chat_request':
        return '💬';
      case 'application_update':
        return '📋';
      default:
        return '📧';
    }
  };

  const getMessageTypeColor = (type) => {
    switch (type) {
      case 'chat_request':
        return 'bg-primary/10 text-primary';
      case 'application_update':
        return 'bg-success/10 text-success';
      default:
        return 'bg-neutral-100 text-text-secondary';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const handlePageChange = (newPage) => {
    setFilter(prev => ({ ...prev, page: newPage }));
  };

  const sendResponse = async (messageId) => {
    const responseText = responseTexts[messageId];
    if (!responseText || !responseText.trim()) {
      alert('Please enter a response message.');
      return;
    }

    try {
      await messageService.sendMessageResponse(messageId, {
        content: responseText,
        subject: 'Re: Message Acknowledgment'
      });
      
      alert('Response sent successfully!');
      setResponseTexts(prev => ({ ...prev, [messageId]: '' }));
      setRespondingTo(null);
      
      // Optionally refresh messages to show updated state
      fetchMessages();
    } catch (error) {
      console.error('Error sending response:', error);
      alert('Failed to send response. Please try again.');
    }
  };

  const handleResponseTextChange = (messageId, text) => {
    setResponseTexts(prev => ({ ...prev, [messageId]: text }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Messages</h1>
          {unreadCount > 0 && (
            <p className="text-text-secondary mt-1">
              You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Message Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value, page: 1 }))}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Messages</option>
              <option value="chat_request">Chat Requests</option>
              <option value="application_update">Application Updates</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
            <select
              value={filter.isRead}
              onChange={(e) => setFilter(prev => ({ ...prev, isRead: e.target.value, page: 1 }))}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-text-primary mb-2">No messages found</h3>
            <p className="text-text-secondary">
              {filter.type !== 'all' || filter.isRead !== 'all' 
                ? 'Try adjusting your filters to see more messages.' 
                : 'You don\'t have any messages yet.'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
                message.isRead ? 'border-neutral-200' : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">{getMessageTypeIcon(message.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${message.isRead ? 'text-text-primary' : 'text-primary font-semibold'}`}>
                          {message.subject}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMessageTypeColor(message.type)}`}>
                          {message.type.replace('_', ' ')}
                        </span>
                        {!message.isRead && (
                          <span className="bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mb-2">
                        From: {message.from?.name || 'Unknown'} ({message.from?.email})
                      </p>
                      {message.relatedJob && (
                        <p className="text-sm text-accent mb-2">
                          <i className="fa-solid fa-briefcase mr-1"></i>
                          Related to: {message.relatedJob.title}
                        </p>
                      )}
                      <div className="text-text-primary text-sm leading-relaxed">
                        {message.content.split('\n').map((line, index) => (
                          <React.Fragment key={index}>
                            {line}
                            {index < message.content.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <span className="text-xs text-text-muted">
                      {formatDate(message.createdAt)}
                    </span>
                    {!message.isRead && (
                      <button
                        onClick={() => markAsRead(message._id)}
                        className="text-xs text-primary hover:text-primary-dark transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                    {userData?.role === 'jobSeeker' && message.type === 'chat_request' && (
                      <button
                        onClick={() => setRespondingTo(respondingTo === message._id ? null : message._id)}
                        className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary-dark transition-colors"
                      >
                        {respondingTo === message._id ? 'Cancel' : 'Respond'}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Response form for job seekers */}
                {userData?.role === 'jobSeeker' && respondingTo === message._id && (
                  <div className="mt-4 p-3 border-t border-neutral-200">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-text-secondary">
                        Send a response to acknowledge this message:
                      </label>
                      <textarea
                        value={responseTexts[message._id] || ''}
                        onChange={(e) => handleResponseTextChange(message._id, e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm resize-none focus:outline-none focus:border-primary"
                        rows="3"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setRespondingTo(null)}
                          className="px-3 py-1 text-xs border border-neutral-300 rounded text-neutral-600 hover:bg-neutral-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => sendResponse(message._id)}
                          className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark"
                        >
                          Send Response
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-text-secondary">
            Page {pagination.current} of {pagination.total}
          </span>
          <button
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Messages;