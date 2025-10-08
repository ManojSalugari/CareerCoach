"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export async function generateQuiz(options = {}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  const difficulty = options.difficulty || "mixed"; // easy | medium | hard | mixed
  const topics = Array.isArray(options.topics) && options.topics.length
    ? options.topics.join(", ")
    : (user.skills?.slice(0, 5).join(", ") || "core fundamentals");

  const prompt = `
    Generate 10 ${difficulty} technical interview questions for a ${user.industry} professional.
    Focus topics: ${topics}.

    Each question should be multiple choice with 4 options.
    Include a concise explanation and a topic tag for spaced repetition.
    
    Return ONLY this JSON (no extra text):
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string",
          "topic": "string"
        }
      ]
    }
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const quiz = JSON.parse(cleanedText);

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
    topic: q.topic || null,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);
  const wrongTopics = Array.from(new Set(wrongAnswers.map((w) => w.topic).filter(Boolean)));

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

      const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
      Also, recommend 3 priority topics from [${wrongTopics.join(", ")}] if available.
    `;

    try {
      const model = getModel();
      const tipResult = await model.generateContent(improvementPrompt);

      improvementTip = tipResult.response.text().trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
        // Store wrong topic summary for spaced repetition UI
        // This remains inside questions JSON; clients can derive as needed
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

// Open-ended HR/TR voice interview support
export async function generateOpenEndedQuestions({ mode = "HR", jobDescription, resumeContent }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const prompt = `
    Create 5 open-ended ${mode === "TR" ? "technical (TR)" : "behavioral (HR)"} interview questions tailored to the candidate, using their resume and the target job description.

    Job Description:\n${jobDescription || "(not provided)"}
    Resume:\n${resumeContent || "(not provided)"}

    Return ONLY this JSON:
    {
      "questions": [
        {
          "question": "string",
          "rubric": ["string", "string", "string"]
        }
      ]
    }
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(text);
    return parsed.questions;
  } catch (error) {
    console.error("Error generating open-ended questions:", error);
    throw new Error("Failed to generate interview questions");
  }
}

export async function evaluateOpenEndedAnswer({ mode = "HR", question, answer, jobDescription, resumeContent }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const prompt = `
    Evaluate the candidate's ${mode === "TR" ? "technical" : "behavioral"} interview answer.

    Question: ${question}
    Answer: ${answer}
    Job Description: ${jobDescription || "(not provided)"}
    Resume: ${resumeContent || "(not provided)"}

    Score dimensions 0-10 each and provide a brief, actionable feedback and one follow-up probing question.
    Return ONLY this JSON:
    {
      "scores": {
        "relevance": number,
        "clarity": number,
        "structure": number,
        "depth": number
      },
      "overall": number,
      "feedback": "string",
      "followUp": "string"
    }
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    console.error("Error evaluating answer:", error);
    throw new Error("Failed to evaluate answer");
  }
}
