import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Send a message (including chat requests from employers)
const sendMessage = asyncHandler(async (req, res) => {
  const { to, type, subject, content, relatedJob, relatedApplication } = req.body;
  const from = req.user._id;

  // Validate recipient exists
  const recipient = await User.findById(to);
  if (!recipient) {
    throw new ApiError(404, "Recipient not found");
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

  return res.status(201).json(
    new ApiResponse(201, populatedResponse, "Response sent successfully")
  );
});

export {
  sendMessage,
  sendChatRequest,
  getMyMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadMessageCount,
  sendMessageResponse
};