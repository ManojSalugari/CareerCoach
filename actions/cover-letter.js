"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy initialize model to avoid module-scope crashes when env is missing
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const tone = data.tone || "professional"; // professional | enthusiastic | confident | friendly
  const style = data.templateStyle || "classic"; // classic | modern | concise
  const accomplishments = Array.isArray(data.accomplishments)
    ? data.accomplishments
    : (data.accomplishments ? String(data.accomplishments).split(/\n+/).map((s) => s.trim()).filter(Boolean) : []);

  // Optional company personalization
  let companySummary = "";
  try {
    if (data.personalize) {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          data.companyName
        )}`,
        { next: { revalidate: 60 * 60 * 24 } }
      );
      if (res.ok) {
        const wiki = await res.json();
        companySummary = wiki.extract || "";
      }
    }
  } catch {}

  const prompt = `
    Write a ${tone} cover letter for a ${data.jobTitle} position at ${data.companyName}.

    Candidate profile:
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience}
    - Skills: ${user.skills?.join(", ")}
    - Professional Background: ${user.bio}
    - Notable Accomplishments: ${accomplishments.join("; ") || "(none provided)"}

    Job Description:
    ${data.jobDescription}

    Company Context (if provided):
    ${companySummary}

    Style guidelines:
    - Template Style: ${style} (${style === "classic" ? "business letter format with clear paragraphs" : style === "modern" ? "short paragraphs, skimmable bullets, bold highlights for impact" : "very concise, focused on alignment and value"})
    - Length: max 400 words
    - Use proper business letter formatting in markdown
    - Emphasize alignment with company needs and concrete outcomes
    - Include specific examples with metrics when possible

    Output: Markdown cover letter only.
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        // Persist generation context for future edits
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error.message);
    throw new Error("Failed to generate cover letter");
  }
}

export async function listCoverLetterTemplates() {
  return [
    { id: "classic", name: "Classic Business" },
    { id: "modern", name: "Modern Impact" },
    { id: "concise", name: "Concise Alignment" },
  ];
}

export async function generateCoverLetterVariations(base) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const tones = Array.isArray(base.tones) && base.tones.length ? base.tones : ["professional", "confident", "enthusiastic"];
  const results = [];
  for (const t of tones) {
    const letter = await generateCoverLetter({ ...base, tone: t });
    results.push(letter);
  }
  return results;
}

export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}
