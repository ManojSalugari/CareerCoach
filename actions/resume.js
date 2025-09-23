"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function saveResume(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content,
      },
      create: {
        userId: user.id,
        content,
      },
    });

    // Save a new version snapshot
    try {
      await db.resumeVersion.create({
        data: {
          resumeId: resume.id,
          content,
          note: "Autosaved",
        },
      });
    } catch (e) {
      console.error("Error saving resume version:", e);
    }

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error("Failed to save resume");
  }
}

export async function getResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.resume.findUnique({
    where: {
      userId: user.id,
    },
  });
}

export async function getResumeVersions() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const resume = await db.resume.findUnique({ where: { userId: user.id } });
  if (!resume) return [];

  return await db.resumeVersion.findMany({
    where: { resumeId: resume.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function improveWithAI({ current, type }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords
    
    Format the response as a single paragraph without any additional text or explanations.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();
    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}

// Parse unstructured resume text into structured resume fields
export async function parseResumeToFields(resumeText) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
    throw new Error("Provide a valid resume text");
  }

  const prompt = `
    You are an expert resume parser. Extract the following fields from the resume below.
    Return ONLY strict JSON matching this TypeScript type with sensible defaults when missing:
    type Resume = {
      contactInfo: { email?: string; mobile?: string; linkedin?: string; twitter?: string };
      summary: string;
      skills: string; // a comma-separated list
      experience: Array<{ title: string; organization: string; startDate?: string; endDate?: string; current?: boolean; description?: string }>;
      education: Array<{ title: string; organization: string; startDate?: string; endDate?: string; current?: boolean; description?: string }>;
      projects: Array<{ title: string; organization?: string; startDate?: string; endDate?: string; current?: boolean; description?: string }>;
    };

    Resume Text:
    ${resumeText}

    IMPORTANT:
    - Fill arrays with 0-6 items as available.
    - Dates can be free text if uncertain (e.g., "2022", "Present").
    - Do not include any additional commentary.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (e) {
    console.error("Error parsing resume text:", e);
    throw new Error("Failed to parse resume text");
  }
}
