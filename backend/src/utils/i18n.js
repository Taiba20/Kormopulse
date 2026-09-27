// Server-side translations for emails and in-app notifications, in the recipient's language.
// The user's choice is stored on User.language ("en" | "bn"); API error messages are translated by the
// frontend instead (see frontend/src/i18n/locales/serverMessages.js).

export const SUPPORTED_LANGUAGES = ["en", "bn"];
export const DEFAULT_LANGUAGE = "en";

export const normalizeLanguage = (lang) => (SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE);

const messages = {
  en: {
    common: {
      greeting: "Hi {name},",
      footer: "This is an automated message from {app}. Please do not reply.",
      timeSuffix: " (Bangladesh time)",
    },
    mail: {
      passwordReset: {
        subject: "{app} password reset code",
        title: "Reset your password",
        text: "Hi {name},\n\nYour {app} password reset code is {code}. It expires in {minutes} minutes.\n\nIf you did not request this, you can ignore this email.",
        html: "<p>Use this code to reset your password. It expires in {minutes} minutes.</p>",
        htmlIgnore: "<p>If you did not request this, you can safely ignore this email.</p>",
      },
      verifyEmail: {
        subject: "Verify your {app} email",
        title: "Verify your email",
        text: "Hi {name},\n\nWelcome to {app}! Your verification code is {code}. It expires in {minutes} minutes.",
        html: "<p>Welcome to {app}! Enter this code to verify your email address. It expires in {minutes} minutes.</p>",
      },
      applicationReceived: {
        subject: "Application submitted: {jobTitle}",
        title: "Application submitted",
        text: "Hi {name},\n\nYour application for \"{jobTitle}\" at {companyName} has been submitted. We will let you know when the employer updates its status.",
        html: "<p>Your application for <b>{jobTitle}</b> at <b>{companyName}</b> has been submitted.</p><p>We will email you when the employer updates its status.</p>",
      },
      newApplication: {
        subject: "New application for {jobTitle}",
        title: "New application received",
        text: "Hi {name},\n\n{applicantName} has applied for \"{jobTitle}\". Log in to {app} to review the application.",
        html: "<p><b>{applicantName}</b> has applied for <b>{jobTitle}</b>.</p><p>Log in to {app} to review the application.</p>",
      },
      shortlisted: {
        subject: "Good news: you were shortlisted for {jobTitle}",
        title: "You have been shortlisted",
        text: "Hi {name},\n\nGood news! {companyName} has shortlisted you for \"{jobTitle}\". They may contact you soon, so keep an eye on your {app} messages.",
        html: "<p>Good news! <b>{companyName}</b> has shortlisted you for <b>{jobTitle}</b>.</p><p>They may contact you soon, so keep an eye on your {app} messages.</p>",
      },
      hired: {
        subject: "Congratulations! You were selected for {jobTitle}",
        title: "Congratulations!",
        text: "Hi {name},\n\nCongratulations! {companyName} has selected you for \"{jobTitle}\". They will contact you with the next steps.",
        html: "<p><b>{companyName}</b> has selected you for <b>{jobTitle}</b>.</p><p>They will contact you with the next steps.</p>",
      },
      rejected: {
        subject: "Update on your application for {jobTitle}",
        title: "Application update",
        text: "Hi {name},\n\nThank you for applying for \"{jobTitle}\" at {companyName}. After careful consideration they have decided not to move forward with your application. We wish you every success and encourage you to keep exploring roles on {app}.",
        html: "<p>Thank you for applying for <b>{jobTitle}</b> at <b>{companyName}</b>. After careful consideration they have decided not to move forward with your application.</p><p>We wish you every success and encourage you to keep exploring roles on {app}.</p>",
        button: "Browse more jobs",
      },
      interviewProposed: {
        subject: "Interview invitation: {jobTitle} at {companyName}",
        title: "You have been invited to interview",
        text: "Hi {name},\n\n{companyName} would like to interview you for \"{jobTitle}\". Please log in to {app} and choose one of these times:\n{slots}\n\n{link}",
        html: "<p><b>{companyName}</b> would like to interview you for <b>{jobTitle}</b>. Please choose the time that suits you:</p>",
        button: "Choose a time",
      },
      interviewConfirmed: {
        subject: "Interview confirmed: {jobTitle}",
        title: "Interview confirmed",
        text: "Hi {name},\n\nThe interview for \"{jobTitle}\" ({companyName}) with {otherName} is confirmed for {when}. A calendar invite is attached.",
        html: "<p>The interview for <b>{jobTitle}</b> ({companyName}) with <b>{otherName}</b> is confirmed for:</p>",
        htmlAttached: "<p>A calendar invite is attached to this email.</p>",
      },
      interviewCancelled: {
        subject: "Interview cancelled: {jobTitle}",
        title: "Interview cancelled",
        text: "Hi {name},\n\nThe interview for \"{jobTitle}\" at {companyName} has been cancelled. The employer may propose new times.",
        html: "<p>The interview for <b>{jobTitle}</b> at <b>{companyName}</b> has been cancelled. The employer may propose new times.</p>",
      },
      interviewDeclined: {
        subject: "{candidateName} declined the interview slots for {jobTitle}",
        title: "Interview slots declined",
        text: "Hi {name},\n\n{candidateName} cannot make any of the proposed times for \"{jobTitle}\".{reasonLine}\nYou can propose new times from your {app} dashboard.",
        html: "<p><b>{candidateName}</b> cannot make any of the proposed times for <b>{jobTitle}</b>.</p>",
        reasonLine: "\nReason: {reason}",
        reasonHtml: "<p><b>Reason:</b> {reason}</p>",
        button: "Propose new times",
      },
      interviewDetails: {
        format: "Format",
        duration: "Duration",
        minutes: "{n} minutes",
        meetingLink: "Meeting link",
        location: "Location",
        notes: "Notes",
        modes: { online: "Online", onsite: "Onsite", phone: "Phone" },
      },
      ics: {
        title: "Interview: {jobTitle} ({companyName})",
        meetingLink: "Meeting link: {link}",
      },
      alertDigest: {
        subject_one: "{count} new job for your alert \"{alertName}\"",
        subject_other: "{count} new jobs for your alert \"{alertName}\"",
        text: "Hi {name},\n\nNew jobs matching \"{alertName}\":\n{lines}",
        title: "New jobs for \"{alertName}\"",
        intro: "Hi {name}, here are the newest matches:",
        button: "Manage alerts",
      },
    },
    notify: {
      emailVerified: { title: "Email verified", message: "Your email address is verified. You now have full access to {app}." },
      accountRestored: { title: "Account restored", message: "Your {app} account is active again." },
      jobDeactivated: { title: "A job posting was deactivated", message: "\"{jobTitle}\" was deactivated by a moderator." },
      applicationSubmitted: { title: "Application submitted", message: "Your application for {jobTitle} at {companyName} was submitted." },
      applicationReceived: { title: "New application received", message: "{applicantName} applied for {jobTitle}." },
      status: {
        reviewed: { title: "Your application is being reviewed", message: "{companyName} has started reviewing your application for {jobTitle}." },
        shortlisted: { title: "You have been shortlisted", message: "{companyName} shortlisted you for {jobTitle}." },
        interview: { title: "You moved to the interview stage", message: "{companyName} moved your application for {jobTitle} to the interview stage." },
        hired: { title: "Congratulations, you were selected!", message: "{companyName} selected you for {jobTitle}." },
        rejected: { title: "Application update", message: "{companyName} decided not to move forward with your application for {jobTitle}." },
      },
      newMessage: { title: "New message from {name}" },
      review: { title: "New company review", message: "Your company received a {rating}-star review: \"{title}\"" },
      interviewInvite: { title: "Interview invitation from {companyName}", message: "Choose a time for your {jobTitle} interview." },
      interviewConfirmed: { title: "{name} confirmed the interview", message: "{jobTitle}: {when}" },
      interviewDeclined: { title: "{name} can't make the proposed times", message: "Propose new times from the interviews page." },
      interviewCancelled: { title: "Interview cancelled", message: "{companyName} cancelled the {jobTitle} interview." },
      alertDigest_one: { title: "{count} new job for \"{label}\"" },
      alertDigest_other: { title: "{count} new jobs for \"{label}\"" },
      alertInstant: { title: "New job for \"{label}\"", message: "{jobTitle} at {companyName}" },
      aCompany: "a company",
      twoFactorEnabled: { title: "Two-factor authentication turned on", message: "Your account now requires a code from your authenticator app to sign in." },
      twoFactorDisabled: { title: "Two-factor authentication turned off", message: "Your account no longer requires a second step to sign in. Turn it back on if this wasn't you." },
      twoFactorBackupCodesRegenerated: { title: "New backup codes generated", message: "Your old two-factor backup codes no longer work." },
    },
  },
  bn: {
    common: {
      greeting: "প্রিয় {name},",
      footer: "এটি {app} থেকে পাঠানো একটি স্বয়ংক্রিয় বার্তা। অনুগ্রহ করে উত্তর দেবেন না।",
      timeSuffix: " (বাংলাদেশ সময়)",
    },
    mail: {
      passwordReset: {
        subject: "{app} পাসওয়ার্ড রিসেট কোড",
        title: "আপনার পাসওয়ার্ড রিসেট করুন",
        text: "প্রিয় {name},\n\nআপনার {app} পাসওয়ার্ড রিসেট কোড: {code}। কোডটি {minutes} মিনিট পর্যন্ত কার্যকর থাকবে।\n\nআপনি এটি না চাইলে এই ইমেইলটি উপেক্ষা করতে পারেন।",
        html: "<p>পাসওয়ার্ড রিসেট করতে এই কোডটি ব্যবহার করুন। কোডটি {minutes} মিনিট পর্যন্ত কার্যকর থাকবে।</p>",
        htmlIgnore: "<p>আপনি এটি না চাইলে এই ইমেইলটি নিশ্চিন্তে উপেক্ষা করতে পারেন।</p>",
      },
      verifyEmail: {
        subject: "আপনার {app} ইমেইল যাচাই করুন",
        title: "আপনার ইমেইল যাচাই করুন",
        text: "প্রিয় {name},\n\n{app}-এ স্বাগতম! আপনার যাচাইকরণ কোড: {code}। কোডটি {minutes} মিনিট পর্যন্ত কার্যকর থাকবে।",
        html: "<p>{app}-এ স্বাগতম! আপনার ইমেইল ঠিকানা যাচাই করতে এই কোডটি দিন। কোডটি {minutes} মিনিট পর্যন্ত কার্যকর থাকবে।</p>",
      },
      applicationReceived: {
        subject: "আবেদন জমা হয়েছে: {jobTitle}",
        title: "আবেদন জমা হয়েছে",
        text: "প্রিয় {name},\n\n{companyName}-এর \"{jobTitle}\" পদে আপনার আবেদন জমা হয়েছে। নিয়োগকর্তা অবস্থা হালনাগাদ করলে আমরা আপনাকে জানাব।",
        html: "<p><b>{companyName}</b>-এর <b>{jobTitle}</b> পদে আপনার আবেদন জমা হয়েছে।</p><p>নিয়োগকর্তা অবস্থা হালনাগাদ করলে আমরা আপনাকে ইমেইলে জানাব।</p>",
      },
      newApplication: {
        subject: "{jobTitle} পদে নতুন আবেদন",
        title: "নতুন আবেদন এসেছে",
        text: "প্রিয় {name},\n\n{applicantName} \"{jobTitle}\" পদে আবেদন করেছেন। আবেদনটি দেখতে {app}-এ লগইন করুন।",
        html: "<p><b>{applicantName}</b> <b>{jobTitle}</b> পদে আবেদন করেছেন।</p><p>আবেদনটি দেখতে {app}-এ লগইন করুন।</p>",
      },
      shortlisted: {
        subject: "সুখবর: {jobTitle} পদে আপনি শর্টলিস্টেড হয়েছেন",
        title: "আপনি শর্টলিস্টেড হয়েছেন",
        text: "প্রিয় {name},\n\nসুখবর! {companyName} আপনাকে \"{jobTitle}\" পদে শর্টলিস্ট করেছে। তারা শীঘ্রই যোগাযোগ করতে পারে, তাই আপনার {app} বার্তা দেখে রাখুন।",
        html: "<p>সুখবর! <b>{companyName}</b> আপনাকে <b>{jobTitle}</b> পদে শর্টলিস্ট করেছে।</p><p>তারা শীঘ্রই যোগাযোগ করতে পারে, তাই আপনার {app} বার্তা দেখে রাখুন।</p>",
      },
      hired: {
        subject: "অভিনন্দন! আপনি {jobTitle} পদে নির্বাচিত হয়েছেন",
        title: "অভিনন্দন!",
        text: "প্রিয় {name},\n\nঅভিনন্দন! {companyName} আপনাকে \"{jobTitle}\" পদে নির্বাচিত করেছে। পরবর্তী ধাপ নিয়ে তারা আপনার সাথে যোগাযোগ করবে।",
        html: "<p><b>{companyName}</b> আপনাকে <b>{jobTitle}</b> পদে নির্বাচিত করেছে।</p><p>পরবর্তী ধাপ নিয়ে তারা আপনার সাথে যোগাযোগ করবে।</p>",
      },
      rejected: {
        subject: "{jobTitle} পদে আপনার আবেদনের হালনাগাদ",
        title: "আবেদনের হালনাগাদ",
        text: "প্রিয় {name},\n\n{companyName}-এর \"{jobTitle}\" পদে আবেদন করার জন্য ধন্যবাদ। সতর্ক বিবেচনার পর তারা আপনার আবেদনটি এগিয়ে নিতে চায়নি। আমরা আপনার সাফল্য কামনা করি এবং {app}-এ আরও পদ খুঁজে দেখতে উৎসাহ দিই।",
        html: "<p><b>{companyName}</b>-এর <b>{jobTitle}</b> পদে আবেদন করার জন্য ধন্যবাদ। সতর্ক বিবেচনার পর তারা আপনার আবেদনটি এগিয়ে নিতে চায়নি।</p><p>আমরা আপনার সাফল্য কামনা করি এবং {app}-এ আরও পদ খুঁজে দেখতে উৎসাহ দিই।</p>",
        button: "আরও চাকরি দেখুন",
      },
      interviewProposed: {
        subject: "ইন্টারভিউয়ের আমন্ত্রণ: {companyName}-এ {jobTitle}",
        title: "আপনাকে ইন্টারভিউয়ে আমন্ত্রণ জানানো হয়েছে",
        text: "প্রিয় {name},\n\n{companyName} আপনাকে \"{jobTitle}\" পদের জন্য ইন্টারভিউ দিতে চায়। অনুগ্রহ করে {app}-এ লগইন করে নিচের সময়গুলোর একটি বেছে নিন:\n{slots}\n\n{link}",
        html: "<p><b>{companyName}</b> আপনাকে <b>{jobTitle}</b> পদের জন্য ইন্টারভিউ দিতে চায়। আপনার সুবিধামতো সময়টি বেছে নিন:</p>",
        button: "সময় বেছে নিন",
      },
      interviewConfirmed: {
        subject: "ইন্টারভিউ নিশ্চিত হয়েছে: {jobTitle}",
        title: "ইন্টারভিউ নিশ্চিত হয়েছে",
        text: "প্রিয় {name},\n\n{otherName}-এর সাথে {companyName}-এর \"{jobTitle}\" পদের ইন্টারভিউ {when} সময়ে নিশ্চিত হয়েছে। একটি ক্যালেন্ডার আমন্ত্রণ সংযুক্ত করা হয়েছে।",
        html: "<p>{otherName}-এর সাথে <b>{jobTitle}</b> ({companyName}) পদের ইন্টারভিউ নিচের সময়ে নিশ্চিত হয়েছে:</p>",
        htmlAttached: "<p>এই ইমেইলের সাথে একটি ক্যালেন্ডার আমন্ত্রণ সংযুক্ত আছে।</p>",
      },
      interviewCancelled: {
        subject: "ইন্টারভিউ বাতিল হয়েছে: {jobTitle}",
        title: "ইন্টারভিউ বাতিল হয়েছে",
        text: "প্রিয় {name},\n\n{companyName}-এর \"{jobTitle}\" পদের ইন্টারভিউ বাতিল করা হয়েছে। নিয়োগকর্তা নতুন সময় প্রস্তাব করতে পারেন।",
        html: "<p><b>{companyName}</b>-এর <b>{jobTitle}</b> পদের ইন্টারভিউ বাতিল করা হয়েছে। নিয়োগকর্তা নতুন সময় প্রস্তাব করতে পারেন।</p>",
      },
      interviewDeclined: {
        subject: "{candidateName} {jobTitle} পদের ইন্টারভিউয়ের সময়গুলো প্রত্যাখ্যান করেছেন",
        title: "ইন্টারভিউয়ের সময় প্রত্যাখ্যাত",
        text: "প্রিয় {name},\n\n{candidateName} \"{jobTitle}\" পদের প্রস্তাবিত কোনো সময়েই উপস্থিত থাকতে পারবেন না।{reasonLine}\nআপনি {app} ড্যাশবোর্ড থেকে নতুন সময় প্রস্তাব করতে পারেন।",
        html: "<p><b>{candidateName}</b> <b>{jobTitle}</b> পদের প্রস্তাবিত কোনো সময়েই উপস্থিত থাকতে পারবেন না।</p>",
        reasonLine: "\nকারণ: {reason}",
        reasonHtml: "<p><b>কারণ:</b> {reason}</p>",
        button: "নতুন সময় প্রস্তাব করুন",
      },
      interviewDetails: {
        format: "ধরন",
        duration: "সময়কাল",
        minutes: "{n} মিনিট",
        meetingLink: "মিটিং লিংক",
        location: "স্থান",
        notes: "মন্তব্য",
        modes: { online: "অনলাইন", onsite: "অফিসে", phone: "ফোনে" },
      },
      ics: {
        title: "ইন্টারভিউ: {jobTitle} ({companyName})",
        meetingLink: "মিটিং লিংক: {link}",
      },
      alertDigest: {
        subject_one: "আপনার অ্যালার্ট \"{alertName}\"-এর জন্য {count}টি নতুন চাকরি",
        subject_other: "আপনার অ্যালার্ট \"{alertName}\"-এর জন্য {count}টি নতুন চাকরি",
        text: "প্রিয় {name},\n\n\"{alertName}\"-এর সাথে মিলে যাওয়া নতুন চাকরি:\n{lines}",
        title: "\"{alertName}\"-এর জন্য নতুন চাকরি",
        intro: "প্রিয় {name}, সবচেয়ে নতুন মিলগুলো এখানে:",
        button: "অ্যালার্ট পরিচালনা করুন",
      },
    },
    notify: {
      emailVerified: { title: "ইমেইল যাচাই হয়েছে", message: "আপনার ইমেইল ঠিকানা যাচাই হয়েছে। এখন আপনি {app}-এর সব সুবিধা পাবেন।" },
      accountRestored: { title: "অ্যাকাউন্ট পুনরুদ্ধার হয়েছে", message: "আপনার {app} অ্যাকাউন্ট আবার সক্রিয় হয়েছে।" },
      jobDeactivated: { title: "একটি চাকরির বিজ্ঞাপন নিষ্ক্রিয় করা হয়েছে", message: "\"{jobTitle}\" একজন মডারেটর নিষ্ক্রিয় করেছেন।" },
      applicationSubmitted: { title: "আবেদন জমা হয়েছে", message: "{companyName}-এর {jobTitle} পদে আপনার আবেদন জমা হয়েছে।" },
      applicationReceived: { title: "নতুন আবেদন এসেছে", message: "{applicantName} {jobTitle} পদে আবেদন করেছেন।" },
      status: {
        reviewed: { title: "আপনার আবেদন পর্যালোচনা করা হচ্ছে", message: "{companyName} {jobTitle} পদে আপনার আবেদন পর্যালোচনা শুরু করেছে।" },
        shortlisted: { title: "আপনি শর্টলিস্টেড হয়েছেন", message: "{companyName} আপনাকে {jobTitle} পদে শর্টলিস্ট করেছে।" },
        interview: { title: "আপনি ইন্টারভিউ ধাপে উঠেছেন", message: "{companyName} {jobTitle} পদে আপনার আবেদন ইন্টারভিউ ধাপে নিয়ে গেছে।" },
        hired: { title: "অভিনন্দন, আপনি নির্বাচিত হয়েছেন!", message: "{companyName} আপনাকে {jobTitle} পদে নির্বাচিত করেছে।" },
        rejected: { title: "আবেদনের হালনাগাদ", message: "{companyName} {jobTitle} পদে আপনার আবেদন এগিয়ে নিতে চায়নি।" },
      },
      newMessage: { title: "{name}-এর কাছ থেকে নতুন বার্তা" },
      review: { title: "কোম্পানির নতুন রিভিউ", message: "আপনার কোম্পানি {rating}-তারকা রিভিউ পেয়েছে: \"{title}\"" },
      interviewInvite: { title: "{companyName}-এর কাছ থেকে ইন্টারভিউয়ের আমন্ত্রণ", message: "আপনার {jobTitle} ইন্টারভিউয়ের জন্য একটি সময় বেছে নিন।" },
      interviewConfirmed: { title: "{name} ইন্টারভিউ নিশ্চিত করেছেন", message: "{jobTitle}: {when}" },
      interviewDeclined: { title: "{name} প্রস্তাবিত সময়গুলোতে উপস্থিত থাকতে পারবেন না", message: "ইন্টারভিউ পৃষ্ঠা থেকে নতুন সময় প্রস্তাব করুন।" },
      interviewCancelled: { title: "ইন্টারভিউ বাতিল হয়েছে", message: "{companyName} {jobTitle} ইন্টারভিউ বাতিল করেছে।" },
      alertDigest_one: { title: "\"{label}\"-এর জন্য {count}টি নতুন চাকরি" },
      alertDigest_other: { title: "\"{label}\"-এর জন্য {count}টি নতুন চাকরি" },
      alertInstant: { title: "\"{label}\"-এর জন্য নতুন চাকরি", message: "{companyName}-এ {jobTitle}" },
      aCompany: "একটি কোম্পানি",
      twoFactorEnabled: { title: "দ্বি-স্তর যাচাইকরণ চালু হয়েছে", message: "সাইন ইন করতে এখন আপনার অথেনটিকেটর অ্যাপের একটি কোড প্রয়োজন হবে।" },
      twoFactorDisabled: { title: "দ্বি-স্তর যাচাইকরণ বন্ধ হয়েছে", message: "সাইন ইন করতে এখন আর দ্বিতীয় ধাপের প্রয়োজন নেই। এটি আপনি না করে থাকলে আবার চালু করুন।" },
      twoFactorBackupCodesRegenerated: { title: "নতুন ব্যাকআপ কোড তৈরি হয়েছে", message: "আপনার পুরনো দ্বি-স্তর ব্যাকআপ কোডগুলো আর কাজ করবে না।" },
    },
  },
};

const lookup = (dictionary, key) =>
  key.split(".").reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), dictionary);

const escapeHtml = (value = "") =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Translates `key` for `lang` (falls back to English, then to the key). {placeholders} are filled from
 * `params`; with `{ html: true }` the values are HTML-escaped so user data can't inject markup.
 */
export const tr = (lang, key, params = {}, { html = false } = {}) => {
  const template = lookup(messages[normalizeLanguage(lang)], key) ?? lookup(messages.en, key);
  if (typeof template !== "string") return key;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in params)) return match;
    return html ? escapeHtml(params[name]) : String(params[name]);
  });
};

export const formatNumberFor = (lang, value) =>
  new Intl.NumberFormat(normalizeLanguage(lang) === "bn" ? "bn-BD" : "en-US").format(value);
