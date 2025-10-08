"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

// Analyze resume for ATS optimization
export async function analyzeResumeATS(resumeContent, jobDescription = null) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  try {
    const prompt = `
      Analyze this resume for ATS (Applicant Tracking System) optimization and provide a comprehensive score breakdown.
      
      Resume Content:
      ${resumeContent}
      
      ${jobDescription ? `Target Job Description: ${jobDescription}` : ''}
      
      User Industry: ${user.industry}
      User Skills: ${user.skills?.join(", ")}
      
      Please analyze and return ONLY a JSON response in this exact format:
      {
        "overallScore": number (0-100),
        "keywordMatch": number (0-100),
        "formatScore": number (0-100),
        "structureScore": number (0-100),
        "suggestions": [
          {
            "category": "string",
            "priority": "high" | "medium" | "low",
            "suggestion": "string",
            "impact": "string"
          }
        ],
        "strengths": ["string"],
        "weaknesses": ["string"],
        "keywordAnalysis": {
          "missingKeywords": ["string"],
          "overusedKeywords": ["string"],
          "recommendedKeywords": ["string"]
        },
        "formatIssues": ["string"],
        "structureIssues": ["string"]
      }
      
      Focus on:
      1. Keyword optimization for ${user.industry} industry
      2. ATS-friendly formatting
      3. Structure and organization
      4. Industry-specific requirements
      5. Quantifiable achievements
      6. Action verbs usage
      
      IMPORTANT: Return ONLY the JSON, no additional text or explanations.
    `;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    
    const analysis = JSON.parse(cleanedText);

    // Save analysis to database
    const atsAnalysis = await db.aTSAnalysis.create({
      data: {
        userId: user.id,
        score: analysis.overallScore,
        keywordMatch: analysis.keywordMatch,
        formatScore: analysis.formatScore,
        structureScore: analysis.structureScore,
        suggestions: analysis.suggestions,
        jobDescription: jobDescription,
      },
    });

    revalidatePath("/resume");
    return { ...analysis, id: atsAnalysis.id };
  } catch (error) {
    console.error("Error analyzing resume ATS:", error);
    throw new Error("Failed to analyze resume for ATS optimization");
  }
}

// Get ATS analysis history
export async function getATSAnalysisHistory() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const analyses = await db.aTSAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { analyzedAt: "desc" },
      take: 10,
    });

    return analyses;
  } catch (error) {
    console.error("Error fetching ATS analysis history:", error);
    throw new Error("Failed to fetch ATS analysis history");
  }
}

// Get latest ATS analysis
export async function getLatestATSAnalysis() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const analysis = await db.aTSAnalysis.findFirst({
      where: { userId: user.id },
      orderBy: { analyzedAt: "desc" },
    });

    return analysis;
  } catch (error) {
    console.error("Error fetching latest ATS analysis:", error);
    throw new Error("Failed to fetch latest ATS analysis");
  }
}

// Generate ATS-optimized resume suggestions
export async function generateATSOptimizationSuggestions(resumeContent, jobDescription = null) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  try {
    const prompt = `
      Provide specific, actionable suggestions to optimize this resume for ATS systems and improve its effectiveness.
      
      Resume Content:
      ${resumeContent}
      
      ${jobDescription ? `Target Job Description: ${jobDescription}` : ''}
      
      User Industry: ${user.industry}
      User Skills: ${user.skills?.join(", ")}
      
      Please provide specific suggestions in this JSON format:
      {
        "immediateActions": [
          {
            "action": "string",
            "reason": "string",
            "difficulty": "easy" | "medium" | "hard",
            "estimatedTime": "string"
          }
        ],
        "keywordOptimization": {
          "addKeywords": ["string"],
          "removeKeywords": ["string"],
          "replaceKeywords": [
            {
              "old": "string",
              "new": "string",
              "reason": "string"
            }
          ]
        },
        "formatImprovements": [
          {
            "section": "string",
            "currentIssue": "string",
            "suggestedFix": "string",
            "priority": "high" | "medium" | "low"
          }
        ],
        "contentEnhancements": [
          {
            "section": "string",
            "suggestion": "string",
            "example": "string",
            "impact": "string"
          }
        ],
        "industrySpecificTips": ["string"],
        "atsComplianceCheck": {
          "passes": ["string"],
          "fails": ["string"],
          "warnings": ["string"]
        }
      }
      
      Focus on:
      1. Industry-specific keyword optimization
      2. ATS-friendly formatting
      3. Quantifiable achievements
      4. Action verb usage
      5. Structure improvements
      
      IMPORTANT: Return ONLY the JSON, no additional text.
    `;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    
    const suggestions = JSON.parse(cleanedText);
    return suggestions;
  } catch (error) {
    console.error("Error generating ATS optimization suggestions:", error);
    throw new Error("Failed to generate ATS optimization suggestions");
  }
}

// Compare resume against job description
export async function compareResumeToJob(resumeContent, jobDescription) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const prompt = `
      Compare this resume against the job description and provide a detailed match analysis.
      
      Resume Content:
      ${resumeContent}
      
      Job Description:
      ${jobDescription}
      
      User Industry: ${user.industry}
      User Skills: ${user.skills?.join(", ")}
      
      Return analysis in this JSON format:
      {
        "matchScore": number (0-100),
        "requiredSkillsMatch": {
          "matched": ["string"],
          "missing": ["string"],
          "percentage": number
        },
        "experienceMatch": {
          "level": "overqualified" | "perfect" | "underqualified",
          "reason": "string",
          "suggestions": ["string"]
        },
        "keywordAlignment": {
          "jobKeywords": ["string"],
          "resumeKeywords": ["string"],
          "missingKeywords": ["string"],
          "alignmentScore": number
        },
        "recommendations": [
          {
            "category": "skills" | "experience" | "keywords" | "format",
            "priority": "high" | "medium" | "low",
            "recommendation": "string",
            "impact": "string"
          }
        ],
        "strengths": ["string"],
        "gaps": ["string"],
        "customizationSuggestions": ["string"]
      }
      
      IMPORTANT: Return ONLY the JSON, no additional text.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    
    const comparison = JSON.parse(cleanedText);
    return comparison;
  } catch (error) {
    console.error("Error comparing resume to job:", error);
    throw new Error("Failed to compare resume to job description");
  }
}
