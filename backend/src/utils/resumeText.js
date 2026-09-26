import path from "path";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { ApiError } from "./ApiError.js";

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 60000;

export const isSupportedResume = (file) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  return [".pdf", ".docx", ".txt"].includes(ext);
};

/** Extracts plain text from an uploaded resume (PDF, DOCX or TXT). */
export const extractResumeText = async (file) => {
  const ext = path.extname(file.originalname || "").toLowerCase();

  try {
    let text = "";
    if (ext === ".pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(file.buffer));
      text = (await extractText(pdf, { mergePages: true })).text;
    } else if (ext === ".docx") {
      text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
    } else if (ext === ".txt") {
      text = file.buffer.toString("utf8");
    } else if (ext === ".doc") {
      throw new ApiError(400, "Old .doc files are not supported. Please save the resume as PDF or DOCX.");
    } else {
      throw new ApiError(400, "Unsupported file type. Upload a PDF, DOCX or TXT resume.");
    }

    text = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    if (text.length < 40) {
      throw new ApiError(
        422,
        "We couldn't read any text in this file. It may be a scanned image. Try a text-based PDF or DOCX."
      );
    }
    return text.slice(0, MAX_TEXT_CHARS);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(422, "This file could not be read. Make sure it is a valid, unprotected PDF or DOCX.");
  }
};
