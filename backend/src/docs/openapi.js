// Hand-written OpenAPI 3.0 description of the public surface of the Kormopulse API.
// It documents the shape of the API for reference and for tools like Swagger UI / Postman;
// it is not used to validate requests (that's done by the zod schemas in src/validators).
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Kormopulse API",
    version: "1.0.0",
    description:
      "REST API for the Kormopulse job and talent matching platform. Most endpoints require a JWT, sent either as an httpOnly `accessToken` cookie (set automatically by /users/login) or as an `Authorization: Bearer <token>` header.",
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Auth", description: "Signup, login, email verification, password reset, Google sign-in" },
    { name: "Jobs", description: "Job listing, search, matching, salary insights" },
    { name: "Applications", description: "Applying, and the employer's Kanban pipeline" },
    { name: "Interviews", description: "Proposing, confirming and managing interviews" },
    { name: "Messages", description: "Real-time chat between candidates and employers" },
    { name: "Notifications", description: "In-app notification feed" },
    { name: "Alerts", description: "Saved job search alerts" },
    { name: "Reviews", description: "Company reviews and ratings" },
    { name: "AI", description: "Resume parsing, cover letters, interview preparation" },
    { name: "Admin", description: "Platform moderation and statistics (admin only)" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "accessToken" },
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          statusCode: { type: "integer" },
          data: {},
          message: { type: "string" },
          success: { type: "boolean" },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          message: { type: "string" },
          errors: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        tags: ["Auth"],
        security: [],
        responses: { 200: { description: "Server and database status" } },
      },
    },
    "/users/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create an account",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "role"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                  role: { type: "string", enum: ["jobSeeker", "employer"] },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Account created; a verification code is emailed" }, 409: { description: "Email already registered" } },
      },
    },
    "/users/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } } } },
        },
        responses: { 200: { description: "Sets auth cookies and returns the user and tokens" }, 401: { description: "Wrong password" }, 403: { description: "Account suspended" } },
      },
    },
    "/users/logout": { post: { tags: ["Auth"], summary: "Log out and clear auth cookies", responses: { 200: { description: "Logged out" } } } },
    "/users/current-user": { get: { tags: ["Auth"], summary: "Get the logged-in user", responses: { 200: { description: "Current user" } } } },
    "/users/verify-email": { post: { tags: ["Auth"], summary: "Verify email with the emailed 6-digit code", responses: { 200: { description: "Verified" } } } },
    "/users/resend-verification": { post: { tags: ["Auth"], summary: "Resend the verification code", responses: { 200: { description: "Sent" }, 429: { description: "Cooldown in effect" } } } },
    "/users/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset code by email",
        security: [],
        responses: { 200: { description: "Generic success response, regardless of whether the email exists" } },
      },
    },
    "/users/reset-password": {
      post: { tags: ["Auth"], summary: "Reset the password using the emailed code", security: [], responses: { 200: { description: "Password updated" }, 400: { description: "Invalid or expired code" } } },
    },
    "/users/google": {
      post: {
        tags: ["Auth"],
        summary: "Sign in or sign up with a Google ID token",
        security: [],
        requestBody: {
          content: { "application/json": { schema: { type: "object", required: ["credential"], properties: { credential: { type: "string" }, role: { type: "string", enum: ["jobSeeker", "employer"] } } } } },
        },
        responses: { 200: { description: "Signed in, or needsRole:true for a brand-new Google user" } },
      },
    },
    "/jobs/jobs": {
      get: { tags: ["Jobs"], summary: "Search and list jobs", security: [], responses: { 200: { description: "Paginated job list" } } },
      post: { tags: ["Jobs"], summary: "Post a new job (employer)", responses: { 201: { description: "Job created" } } },
    },
    "/jobs/jobs/{id}": { get: { tags: ["Jobs"], summary: "Get one job", security: [], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Job" } } } },
    "/jobs/companies": { get: { tags: ["Jobs"], summary: "List companies with open jobs and ratings", security: [], responses: { 200: { description: "Companies" } } } },
    "/jobs/company/{id}": { get: { tags: ["Jobs"], summary: "Public company profile with open jobs and rating", security: [], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Company" } } } },
    "/jobs/salary-insights": {
      get: {
        tags: ["Jobs"],
        summary: "Aggregated salary statistics from published job listings",
        security: [],
        parameters: ["title", "category", "location", "jobType", "workMode", "currency"].map((name) => ({ name, in: "query", schema: { type: "string" } })),
        responses: { 200: { description: "Salary statistics" } },
      },
    },
    "/jobs/apply/{id}": { post: { tags: ["Applications"], summary: "Apply to a job (job seeker)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Applied" } } } },
    "/jobs/match-scores": { post: { tags: ["Jobs"], summary: "Batch match scores for a page of job cards (job seeker)", responses: { 200: { description: "Scores by job id" } } } },
    "/jobs/match/{id}": { get: { tags: ["Jobs"], summary: "Detailed match breakdown for one job (job seeker)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Match breakdown" } } } },
    "/applications/mine": { get: { tags: ["Applications"], summary: "My applications with status timeline (job seeker)", responses: { 200: { description: "Applications" } } } },
    "/applications/pipeline/{jobId}": { get: { tags: ["Applications"], summary: "Kanban pipeline for a job (employer)", parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Applications grouped by stage" } } } },
    "/applications/{id}/status": {
      patch: {
        tags: ["Applications"],
        summary: "Move an application to another stage (employer)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["pending", "reviewed", "shortlisted", "interview", "hired", "rejected"] }, note: { type: "string" } } } } } },
        responses: { 200: { description: "Updated" } },
      },
    },
    "/interviews": { post: { tags: ["Interviews"], summary: "Propose interview time slots (employer)", responses: { 201: { description: "Proposed" } } } },
    "/interviews/mine": { get: { tags: ["Interviews"], summary: "My interviews", responses: { 200: { description: "Interviews" } } } },
    "/interviews/{id}/confirm": { post: { tags: ["Interviews"], summary: "Confirm a proposed slot (job seeker)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Confirmed; calendar invites emailed" } } } },
    "/interviews/{id}/decline": { post: { tags: ["Interviews"], summary: "Decline all proposed slots (job seeker)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Declined" } } } },
    "/interviews/{id}/cancel": { post: { tags: ["Interviews"], summary: "Cancel an interview (employer)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Cancelled" } } } },
    "/interviews/{id}/ics": { get: { tags: ["Interviews"], summary: "Download the .ics calendar file for a confirmed interview", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "text/calendar file" } } } },
    "/messages/conversations": { get: { tags: ["Messages"], summary: "List my conversations with last message and unread counts", responses: { 200: { description: "Conversations" } } } },
    "/messages/conversation/{userId}": { get: { tags: ["Messages"], summary: "Full thread with one person; marks their messages read", parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Thread" } } } },
    "/messages/chat": { post: { tags: ["Messages"], summary: "Send a chat message", responses: { 201: { description: "Sent" }, 403: { description: "Not connected through an application" } } } },
    "/notifications": { get: { tags: ["Notifications"], summary: "List my notifications", responses: { 200: { description: "Notifications" } } } },
    "/notifications/unread-count": { get: { tags: ["Notifications"], summary: "Unread notification count", responses: { 200: { description: "Count" } } } },
    "/alerts": {
      get: { tags: ["Alerts"], summary: "List my job alerts (job seeker)", responses: { 200: { description: "Alerts" } } },
      post: { tags: ["Alerts"], summary: "Create a job alert", responses: { 201: { description: "Created" } } },
    },
    "/reviews/company/{companyId}": {
      get: { tags: ["Reviews"], summary: "Reviews and rating summary for a company", security: [], parameters: [{ name: "companyId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Reviews" } } },
      post: { tags: ["Reviews"], summary: "Post a review (job seeker, one per company)", parameters: [{ name: "companyId", in: "path", required: true, schema: { type: "string" } }], responses: { 201: { description: "Created" }, 409: { description: "Already reviewed" } } },
    },
    "/ai/resume/parse": { post: { tags: ["AI"], summary: "Upload a resume (PDF/DOCX/TXT) and get a structured profile preview", requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { resume: { type: "string", format: "binary" } } } } } }, responses: { 200: { description: "Parsed profile" } } } },
    "/ai/resume/apply": { post: { tags: ["AI"], summary: "Merge a reviewed resume profile into the job seeker's profile", responses: { 200: { description: "Updated user" } } } },
    "/ai/cover-letter": { post: { tags: ["AI"], summary: "Draft a cover letter for a job", responses: { 200: { description: "Cover letter" } } } },
    "/ai/interview-prep/{jobId}": { get: { tags: ["AI"], summary: "Get interview questions and tips for a job", parameters: [{ name: "jobId", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Prep material" } } } },
    "/admin/stats": { get: { tags: ["Admin"], summary: "Platform-wide statistics (admin)", responses: { 200: { description: "Stats" } } } },
    "/admin/users": { get: { tags: ["Admin"], summary: "List and search users (admin)", responses: { 200: { description: "Users" } } } },
    "/admin/users/{id}/suspend": { patch: { tags: ["Admin"], summary: "Suspend or reinstate a user (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } } },
    "/admin/jobs": { get: { tags: ["Admin"], summary: "List and moderate jobs (admin)", responses: { 200: { description: "Jobs" } } } },
  },
};
