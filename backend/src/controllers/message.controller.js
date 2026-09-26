import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Notification } from "../models/notification.model.js";
import { notify } from "../utils/notify.js";
import { emitToUser, isOnline } from "../socket.js";

// A job seeker and an employer may message each other only when they are connected through an
// application (seeker applied to a job the employer posted) or one of them already wrote first.
const canMessage = async (senderId, recipient, sender) => {
  if (String(senderId) === String(recipient._id)) return false;
  if (sender.role === "admin" || recipient.role === "admin") return true;
  if (sender.role === recipient.role) return false;

  const [seekerId, employerId] =
    sender.role === "jobSeeker" ? [sender._id, recipient._id] : [recipient._id, sender._id];

  const employerJobs = await Job.find({ postedBy: employerId }).select("_id");
  const linked = await Application.exists({
    applicant: seekerId,
    job: { $in: employerJobs.map((j) => j._id) },
  });
  if (linked) return true;

  return Boolean(await Message.exists({ from: recipient._id, to: senderId }));
};

// Push a new message to both parties in real time and raise (or refresh) a notification.
const announceMessage = async (message) => {
  const fromId = message.from?._id || message.from;
  const toId = message.to?._id || message.to;
  emitToUser(toId, "message:new", message);
  emitToUser(fromId, "message:sent", message);

  // Live chat messages don't need a bell notification while the recipient is watching
  if (message.type === "general" && isOnline(toId)) return;

  const senderName = message.from?.name || "Someone";
  const existing = await Notification.findOne({
    user: toId,
    type: "message",
    isRead: false,
    "data.from": String(fromId),
  });
  if (existing) {
    existing.message = String(message.content).slice(0, 200);
    existing.createdAt = new Date();
    await existing.save();
    emitToUser(toId, "notification:new", existing.toObject());
    return;
  }
  await notify(toId, {
    type: "message",
    key: "newMessage",
    params: { name: senderName, message: String(message.content).slice(0, 200) },
    link: `/messages?chat=${fromId}`,
    data: { from: String(fromId) },
  });
};

// Send a message (including chat requests from employers)
const sendMessage = asyncHandler(async (req, res) => {
  const { to, type, subject, content, relatedJob, relatedApplication } = req.body;
  const from = req.user._id;

  // Validate recipient exists
  const recipient = await User.findById(to);
  if (!recipient) {
    throw new ApiError(404, "Recipient not found");
  }

  if (!(await canMessage(from, recipient, req.user))) {
    throw new ApiError(403, "You can only message people you are connected with through an application.");
  }

  // Validate related job if provided
  if (relatedJob) {
    const job = await Job.findById(relatedJob);
    if (!job) {
      throw new ApiError(404, "Related job not found");
    }
  }

  // Validate related application if provided
  if (relatedApplication) {
    const application = await Application.findById(relatedApplication);
    if (!application) {
      throw new ApiError(404, "Related application not found");
    }
  }

  const message = await Message.create({
    from,
    to,
    type: type || "general",
    subject,
    content,
    relatedJob,
    relatedApplication
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('from', 'name email')
    .populate('to', 'name email')
    .populate('relatedJob', 'title')
    .populate('relatedApplication');

  await announceMessage(populatedMessage.toObject());

  return res.status(201).json(
    new ApiResponse(201, populatedMessage, "Message sent successfully")
  );
});

// Send chat request to job seeker
const sendChatRequest = asyncHandler(async (req, res) => {
  const { applicantId, jobId } = req.body;
  const employerId = req.user._id;

  // Validate employer has permission for this job
  const job = await Job.findById(jobId);
  if (!job || job.postedBy.toString() !== employerId.toString()) {
    throw new ApiError(403, "Unauthorized to send chat request for this job");
  }

  // Get applicant details
  const applicant = await User.findById(applicantId);
  if (!applicant) {
    throw new ApiError(404, "Applicant not found");
  }

  // Get employer details
  const employer = await User.findById(employerId).populate('companyProfile', 'companyName');

  const subject = `Chat Request from ${employer.companyProfile?.companyName || employer.name}`;
  const content = `Hello ${applicant.name},

${employer.companyProfile?.companyName || employer.name} would like to connect with you regarding your application for the position: ${job.title}.

We are interested in discussing this opportunity with you further. Please feel free to reach out if you'd like to continue the conversation.

Best regards,
${employer.name}
${employer.companyProfile?.companyName || 'Hiring Team'}`;

  const message = await Message.create({
    from: employerId,
    to: applicantId,
    type: "chat_request",
    subject,
    content,
    relatedJob: jobId
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('from', 'name email')
    .populate('to', 'name email')
    .populate('relatedJob', 'title');

  await announceMessage(populatedMessage.toObject());

  return res.status(201).json(
    new ApiResponse(201, populatedMessage, "Chat request sent successfully")
  );
});

// Get user's messages (inbox)
const getMyMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, type = 'all', isRead = 'all' } = req.query;

  const filter = { to: userId };
  
  if (type !== 'all') {
    filter.type = type;
  }
  
  if (isRead !== 'all') {
    filter.isRead = isRead === 'true';
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const messages = await Message.find(filter)
    .populate('from', 'name email')
    .populate('relatedJob', 'title')
    .populate('relatedApplication')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  const total = await Message.countDocuments(filter);
  const unreadCount = await Message.countDocuments({ to: userId, isRead: false });

  const pagination = {
    current: pageNumber,
    total: Math.ceil(total / limitNumber),
    hasNext: skip + limitNumber < total,
    hasPrev: pageNumber > 1,
  };

  return res.status(200).json(
    new ApiResponse(200, { 
      messages, 
      pagination, 
      unreadCount 
    }, "Messages fetched successfully")
  );
});

// Mark message as read
const markMessageAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findOneAndUpdate(
    { _id: messageId, to: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!message) {
    throw new ApiError(404, "Message not found or unauthorized");
  }

  emitToUser(message.from, "message:read", { by: String(userId), ids: [String(message._id)] });

  return res.status(200).json(
    new ApiResponse(200, message, "Message marked as read")
  );
});

// Mark all messages as read
const markAllMessagesAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await Message.updateMany(
    { to: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return res.status(200).json(
    new ApiResponse(200, { modifiedCount: result.modifiedCount }, "All messages marked as read")
  );
});

// Get unread message count
const getUnreadMessageCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const unreadCount = await Message.countDocuments({ to: userId, isRead: false });

  return res.status(200).json(
    new ApiResponse(200, { unreadCount }, "Unread message count fetched")
  );
});

// Send a response to a message
const sendMessageResponse = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content, subject } = req.body;
  const from = req.user._id;

  // Get the original message
  const originalMessage = await Message.findById(messageId);
  if (!originalMessage) {
    throw new ApiError(404, "Original message not found");
  }

  // Verify user is the recipient of the original message
  if (originalMessage.to.toString() !== from.toString()) {
    throw new ApiError(403, "You can only respond to messages sent to you");
  }

  // Create response message
  const responseMessage = await Message.create({
    from,
    to: originalMessage.from,
    type: "response",
    subject: subject || `Re: ${originalMessage.subject}`,
    content,
    relatedJob: originalMessage.relatedJob,
    relatedApplication: originalMessage.relatedApplication
  });

  const populatedResponse = await Message.findById(responseMessage._id)
    .populate('from', 'name email')
    .populate('to', 'name email')
    .populate('relatedJob', 'title');

  await announceMessage(populatedResponse.toObject());

  return res.status(201).json(
    new ApiResponse(201, populatedResponse, "Response sent successfully")
  );
});

// ---- Real-time chat ---------------------------------------------------------

// Quick chat message (no subject needed). Same relationship rules as sendMessage.
const sendChatMessage = asyncHandler(async (req, res) => {
  const { to, content, relatedJob } = req.body;
  const recipient = await User.findById(to);
  if (!recipient) throw new ApiError(404, "Recipient not found");

  if (!(await canMessage(req.user._id, recipient, req.user))) {
    throw new ApiError(403, "You can only message people you are connected with through an application.");
  }

  const message = await Message.create({
    from: req.user._id,
    to,
    type: "general",
    subject: "Chat message",
    content,
    relatedJob,
  });
  const populated = await Message.findById(message._id)
    .populate("from", "name email")
    .populate("to", "name email");

  await announceMessage(populated.toObject());
  return res.status(201).json(new ApiResponse(201, populated, "Message sent"));
});

// One row per person you have talked to: last message, unread count and online status
const getConversations = asyncHandler(async (req, res) => {
  const me = req.user._id;

  const rows = await Message.aggregate([
    { $match: { $or: [{ from: me }, { to: me }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ["$from", me] }, "$to", "$from"] },
        lastMessage: { $first: "$$ROOT" },
        unread: { $sum: { $cond: [{ $and: [{ $eq: ["$to", me] }, { $eq: ["$isRead", false] }] }, 1, 0] } },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
    { $limit: 100 },
  ]);

  const users = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select("name email role userProfile");
  const byId = new Map(users.map((u) => [u._id.toString(), u]));

  const conversations = rows
    .filter((row) => byId.has(row._id.toString()))
    .map((row) => {
      const user = byId.get(row._id.toString());
      return {
        user: { _id: user._id, name: user.name, role: user.role, email: user.email },
        lastMessage: {
          _id: row.lastMessage._id,
          content: row.lastMessage.content,
          from: row.lastMessage.from,
          createdAt: row.lastMessage.createdAt,
        },
        unread: row.unread,
        online: isOnline(user._id),
      };
    });

  return res.status(200).json(new ApiResponse(200, { conversations }, "Conversations fetched"));
});

// Full thread with one person; opening it marks their messages as read
const getConversation = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const otherId = req.params.userId;
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const other = await User.findById(otherId).select("name email role");
  if (!other) throw new ApiError(404, "User not found");

  const filter = {
    $or: [
      { from: me, to: otherId },
      { from: otherId, to: me },
    ],
  };
  if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };

  const newestFirst = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("from", "name")
    .populate("relatedJob", "title");
  const messages = newestFirst.reverse();

  const unreadIds = messages
    .filter((m) => m.to.toString() === me.toString() && !m.isRead)
    .map((m) => m._id);
  if (unreadIds.length) {
    await Message.updateMany({ _id: { $in: unreadIds } }, { isRead: true, readAt: new Date() });
    emitToUser(otherId, "message:read", { by: String(me), ids: unreadIds.map(String) });
    // Their notification about these messages is now stale
    await Notification.updateMany(
      { user: me, type: "message", isRead: false, "data.from": String(otherId) },
      { isRead: true, readAt: new Date() }
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: { _id: other._id, name: other.name, role: other.role, email: other.email, online: isOnline(other._id) },
        messages: messages.map((m) => ({ ...m.toObject(), isRead: unreadIds.some((id) => id.equals(m._id)) ? true : m.isRead })),
        hasMore: newestFirst.length === limit,
      },
      "Conversation fetched"
    )
  );
});

export {
  sendChatMessage,
  getConversations,
  getConversation,
  sendMessage,
  sendChatRequest,
  getMyMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadMessageCount,
  sendMessageResponse
};