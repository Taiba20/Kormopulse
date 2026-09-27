// Bangla versions of the messages the API returns in `error.response.data.message`.
// The API always answers in English; the UI looks the text up here so Bangla users see Bangla.
// Anything not listed falls back to the original English message.
export const bnServerMessages = {
  "A code was sent moments ago. Please wait a minute before requesting another.":
    "কিছুক্ষণ আগেই একটি কোড পাঠানো হয়েছে। নতুন কোড চাওয়ার আগে অনুগ্রহ করে এক মিনিট অপেক্ষা করুন।",
  "Access token expired. Please refresh your token.": "সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।",
  "Administrator accounts cannot be moderated here": "অ্যাডমিন অ্যাকাউন্ট এখানে পরিচালনা করা যায় না",
  "Alert not found": "অ্যালার্ট খুঁজে পাওয়া যায়নি",
  "An interview is already confirmed for this application. Cancel it before scheduling a new one.":
    "এই আবেদনের জন্য ইতিমধ্যে একটি ইন্টারভিউ নিশ্চিত হয়েছে। নতুন ইন্টারভিউ ঠিক করার আগে সেটি বাতিল করুন।",
  "Applicant not found": "আবেদনকারী খুঁজে পাওয়া যায়নি",
  "Application not found": "আবেদন খুঁজে পাওয়া যায়নি",
  "Choose one of the offered time slots": "প্রস্তাবিত সময়গুলোর একটি বেছে নিন",
  "Company not found": "কোম্পানি খুঁজে পাওয়া যায়নি",
  "Company profile not found": "কোম্পানির প্রোফাইল খুঁজে পাওয়া যায়নি",
  "Company profile not found. Please complete your company onboarding first.":
    "কোম্পানির প্রোফাইল খুঁজে পাওয়া যায়নি। আগে কোম্পানির অনবোর্ডিং সম্পন্ন করুন।",
  "Current password and new password are required": "বর্তমান পাসওয়ার্ড ও নতুন পাসওয়ার্ড দুটিই দিতে হবে",
  "Current password is incorrect": "বর্তমান পাসওয়ার্ড সঠিক নয়",
  "Email is required": "ইমেইল দিতে হবে",
  "Error while uploading profile picture to cloud storage": "প্রোফাইল ছবি আপলোড করতে সমস্যা হয়েছে",
  "Interview not found": "ইন্টারভিউ খুঁজে পাওয়া যায়নি",
  "Invalid Access Token": "অবৈধ অ্যাক্সেস টোকেন",
  "Invalid access token": "অবৈধ অ্যাক্সেস টোকেন",
  "Invalid or expired code": "কোডটি ভুল অথবা মেয়াদোত্তীর্ণ",
  "Invalid or expired two-factor code": "কোডটি ভুল অথবা মেয়াদোত্তীর্ণ",
  "Invalid user credentials": "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়",
  "Job is already saved": "চাকরিটি ইতিমধ্যে সংরক্ষিত আছে",
  "Job is not saved": "চাকরিটি সংরক্ষিত নেই",
  "Job not found": "চাকরি খুঁজে পাওয়া যায়নি",
  "Job seeker profile not found": "চাকরিপ্রার্থীর প্রোফাইল খুঁজে পাওয়া যায়নি",
  "Message not found or unauthorized": "বার্তা পাওয়া যায়নি অথবা আপনার অনুমতি নেই",
  "New password must be at least 6 characters long": "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে",
  "Notification not found": "নোটিফিকেশন খুঁজে পাওয়া যায়নি",
  "Old .doc files are not supported. Please save the resume as PDF or DOCX.":
    "পুরনো .doc ফাইল সমর্থিত নয়। অনুগ্রহ করে রিজিউমেটি PDF বা DOCX হিসেবে সংরক্ষণ করুন।",
  "Only confirmed interviews can be completed": "শুধু নিশ্চিত ইন্টারভিউ সম্পন্ন করা যায়",
  "Only confirmed interviews have a calendar file": "শুধু নিশ্চিত ইন্টারভিউয়ের ক্যালেন্ডার ফাইল থাকে",
  "Only employers can access this endpoint": "শুধু নিয়োগকর্তারা এটি ব্যবহার করতে পারেন",
  "Only employers can create job postings": "শুধু নিয়োগকর্তারা চাকরির বিজ্ঞাপন দিতে পারেন",
  "Only job seekers can access this endpoint": "শুধু চাকরিপ্রার্থীরা এটি ব্যবহার করতে পারেন",
  "Only job seekers can apply for jobs": "শুধু চাকরিপ্রার্থীরা আবেদন করতে পারেন",
  "Only job seekers can remove saved jobs": "শুধু চাকরিপ্রার্থীরা সংরক্ষিত চাকরি সরাতে পারেন",
  "Only job seekers can save jobs": "শুধু চাকরিপ্রার্থীরা চাকরি সংরক্ষণ করতে পারেন",
  "Only job seekers can analyze skill gaps": "শুধু চাকরিপ্রার্থীরা দক্ষতার ঘাটতি বিশ্লেষণ করতে পারেন",
  "Only job seekers can get recommendations": "শুধু চাকরিপ্রার্থীরা সুপারিশ পেতে পারেন",
  "Only the candidate can confirm": "শুধু প্রার্থী নিশ্চিত করতে পারেন",
  "Only the candidate can decline": "শুধু প্রার্থী প্রত্যাখ্যান করতে পারেন",
  "Only the employer can cancel": "শুধু নিয়োগকর্তা বাতিল করতে পারেন",
  "Only the employer can complete": "শুধু নিয়োগকর্তা সম্পন্ন করতে পারেন",
  "Original message not found": "মূল বার্তা খুঁজে পাওয়া যায়নি",
  "Password is required": "পাসওয়ার্ড দিতে হবে",
  "Please verify your email address to continue.": "চালিয়ে যেতে অনুগ্রহ করে আপনার ইমেইল ঠিকানা যাচাই করুন।",
  "Profile Picture file is missing": "প্রোফাইল ছবির ফাইল পাওয়া যায়নি",
  "Recipient not found": "প্রাপক খুঁজে পাওয়া যায়নি",
  "Related application not found": "সংশ্লিষ্ট আবেদন খুঁজে পাওয়া যায়নি",
  "Related job not found": "সংশ্লিষ্ট চাকরি খুঁজে পাওয়া যায়নি",
  "Resume is required": "রিজিউমে দিতে হবে",
  "Review not found": "রিভিউ খুঁজে পাওয়া যায়নি",
  "Skill is required": "দক্ষতা দিতে হবে",
  "Something went wrong while registering the user": "নিবন্ধনের সময় কিছু একটা ভুল হয়েছে",
  "Start setup first by requesting a QR code": "প্রথমে QR কোড চেয়ে সেটআপ শুরু করুন",
  "That code didn't match. Check your authenticator app and try again.":
    "কোডটি মেলেনি। আপনার অথেনটিকেটর অ্যাপ দেখে আবার চেষ্টা করুন।",
  "That time slot has already passed": "সেই সময়টি পার হয়ে গেছে",
  "This two-factor session has expired. Please log in again.":
    "এই দ্বি-স্তর সেশনের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার লগইন করুন।",
  "This file could not be read. Make sure it is a valid, unprotected PDF or DOCX.":
    "ফাইলটি পড়া যায়নি। নিশ্চিত করুন এটি সঠিক, পাসওয়ার্ডবিহীন PDF বা DOCX ফাইল।",
  "This job is no longer accepting applications": "এই চাকরিতে আর আবেদন গ্রহণ করা হচ্ছে না",
  "Two-factor authentication is already enabled": "দ্বি-স্তর যাচাইকরণ ইতিমধ্যে চালু আছে",
  "Two-factor authentication is already enabled. Disable it first to set up a new device.":
    "দ্বি-স্তর যাচাইকরণ ইতিমধ্যে চালু আছে। নতুন ডিভাইস সেটআপ করতে আগে এটি বন্ধ করুন।",
  "Two-factor authentication is not enabled": "দ্বি-স্তর যাচাইকরণ চালু নেই",
  "Two-factor authentication is not enabled for this account": "এই অ্যাকাউন্টের জন্য দ্বি-স্তর যাচাইকরণ চালু নেই",
  "Unauthorized or job not found": "অনুমতি নেই অথবা চাকরি খুঁজে পাওয়া যায়নি",
  "Unauthorized request": "অনুমতিবিহীন অনুরোধ",
  "Unauthorized request, only employers are allowed": "অনুমতিবিহীন অনুরোধ, শুধু নিয়োগকর্তারা পারেন",
  "Unauthorized to send chat request for this job": "এই চাকরির জন্য চ্যাট অনুরোধ পাঠানোর অনুমতি নেই",
  "Unsupported file type. Upload a PDF, DOCX or TXT resume.": "ফাইলের ধরন সমর্থিত নয়। PDF, DOCX বা TXT রিজিউমে আপলোড করুন।",
  "Upload a PDF, DOCX or TXT resume": "PDF, DOCX বা TXT রিজিউমে আপলোড করুন",
  "User already exists": "এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে",
  "User not found": "ব্যবহারকারী খুঁজে পাওয়া যায়নি",
  "You are not authorized to perform this action": "এই কাজটি করার অনুমতি আপনার নেই",
  "You are not part of this interview": "আপনি এই ইন্টারভিউয়ের অংশ নন",
  "You can only manage applications for your own job postings": "আপনি শুধু নিজের চাকরির আবেদনগুলো পরিচালনা করতে পারেন",
  "You can only message people you are connected with through an application.":
    "আপনি শুধু আবেদনের মাধ্যমে যুক্ত ব্যক্তিদের বার্তা পাঠাতে পারেন।",
  "You can only respond to messages sent to you": "আপনি শুধু আপনাকে পাঠানো বার্তার উত্তর দিতে পারেন",
  "You can only view applications for your own job postings": "আপনি শুধু নিজের চাকরির আবেদনগুলো দেখতে পারেন",
  "You cannot do this to your own account": "নিজের অ্যাকাউন্টে আপনি এটি করতে পারেন না",
  "You cannot review your own company": "নিজের কোম্পানির রিভিউ আপনি দিতে পারেন না",
  "You have already applied for this job": "আপনি ইতিমধ্যে এই চাকরিতে আবেদন করেছেন",
  "You have already reviewed this company. Edit your existing review instead.":
    "আপনি ইতিমধ্যে এই কোম্পানির রিভিউ দিয়েছেন। বর্তমান রিভিউটি সম্পাদনা করুন।",
  "Your Google email address is not verified": "আপনার গুগল ইমেইল ঠিকানা যাচাই করা নেই",
  "Your account has been suspended. Contact support for help.":
    "আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। সাহায্যের জন্য সাপোর্টের সাথে যোগাযোগ করুন।",
  // Demo content shown on the home page
  "Candidate workflow": "প্রার্থীর কাজের ধারা", "Employer workflow": "নিয়োগকর্তার কাজের ধারা", "Platform workflow": "প্ল্যাটফর্মের কাজের ধারা",
  "Create profile": "প্রোফাইল তৈরি করুন", "Save jobs": "চাকরি সংরক্ষণ করুন", "Track applications": "আবেদন অনুসরণ করুন",
  "Create company profile": "কোম্পানির প্রোফাইল তৈরি করুন", "Post a role": "পদ পোস্ট করুন", "Review applicants": "আবেদনকারী পর্যালোচনা করুন",
  "Discover opportunities": "সুযোগ খুঁজে নিন", "Connect with teams": "দলের সাথে যুক্ত হন", "Move forward": "এগিয়ে যান",
  "Frontend Engineer": "ফ্রন্টএন্ড ইঞ্জিনিয়ার", "Product Designer": "প্রোডাক্ট ডিজাইনার", "Growth Analyst": "গ্রোথ অ্যানালিস্ট",
  "Dhaka, Bangladesh": "ঢাকা, বাংলাদেশ", "Remote": "রিমোট", "Hybrid": "হাইব্রিড", "Full-time": "ফুল-টাইম", "Contract": "চুক্তিভিত্তিক",
  // Validation messages (the API prefixes them with the field name, e.g. "email: Enter a valid email address")
  "Add a short headline": "একটি ছোট শিরোনাম দিন",
  "Choose a rating from 1 to 5": "১ থেকে ৫-এর মধ্যে একটি রেটিং বেছে নিন",
  "Invalid id": "অবৈধ আইডি",
  "Message cannot be empty": "বার্তা খালি রাখা যাবে না",
  "Message is too long": "বার্তাটি অনেক বড়",
  "Offer at least one time slot": "কমপক্ষে একটি সময় প্রস্তাব করুন",
  "Offer at most 5 time slots": "সর্বোচ্চ ৫টি সময় প্রস্তাব করা যাবে",
  "Add at least one search criterion (keyword, location, category, type, mode or salary)":
    "কমপক্ষে একটি অনুসন্ধানের শর্ত দিন (কীওয়ার্ড, অবস্থান, বিভাগ, ধরন, পদ্ধতি বা বেতন)",
  "Code is required": "কোড দিতে হবে",
  "Code must be 6 digits": "কোডটি ৬ সংখ্যার হতে হবে",
  "Confirm your password": "পাসওয়ার্ড নিশ্চিত করুন",
  "Each slot must be a valid date and time": "প্রতিটি সময় সঠিক তারিখ ও সময় হতে হবে",
  "Enter a valid email address": "সঠিক ইমেইল ঠিকানা দিন",
  "Google credential is required": "গুগল ক্রেডেনশিয়াল প্রয়োজন",
  "Language must be en or bn": "ভাষা en বা bn হতে হবে",
  "Name is required": "নাম দিতে হবে",
  "Name is too short": "নামটি খুব ছোট",
  "Password is too long": "পাসওয়ার্ডটি অনেক বড়",
  "Passwords do not match": "পাসওয়ার্ড মিলছে না",
  "Role must be jobSeeker or employer": "ভূমিকা চাকরিপ্রার্থী বা নিয়োগকর্তা হতে হবে",
  "If an account exists for this email, a reset code has been sent.": "এই ইমেইলে অ্যাকাউন্ট থাকলে একটি রিসেট কোড পাঠানো হয়েছে।",
  "Too many requests. Please slow down and try again shortly.": "অনেক বেশি অনুরোধ হয়েছে। অনুগ্রহ করে একটু ধীরে চলুন এবং কিছুক্ষণ পর আবার চেষ্টা করুন।",
  "Too many attempts. Please wait 15 minutes and try again.": "অনেক বেশি চেষ্টা হয়েছে। অনুগ্রহ করে ১৫ মিনিট অপেক্ষা করে আবার চেষ্টা করুন।",
};

// Messages with a variable part: [pattern, builder].
const bnPatterns = [
  [/^This interview is already (\w+)$/, (m) => `এই ইন্টারভিউ ইতিমধ্যে ${m[1]} অবস্থায় আছে`],
  [/^You can have at most (\d+) job alerts\. Delete one to add another\.$/, (m) => `আপনি সর্বোচ্চ ${m[1]}টি জব অ্যালার্ট রাখতে পারেন। নতুন যোগ করতে একটি মুছুন।`],
];

export const localizeServerMessage = (lang, message) => {
  if (lang !== "bn" || typeof message !== "string") return message;
  if (bnServerMessages[message]) return bnServerMessages[message];
  for (const [pattern, build] of bnPatterns) {
    const match = message.match(pattern);
    if (match) return build(match);
  }
  // Validation errors arrive as "field: message"; show just the translated message
  const prefixed = message.match(/^[\w.]+: (.+)$/);
  if (prefixed && bnServerMessages[prefixed[1]]) return bnServerMessages[prefixed[1]];
  return message;
};
