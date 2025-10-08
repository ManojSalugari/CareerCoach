"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Create a new portfolio project
export async function createPortfolioProject(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const project = await db.portfolioProject.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
        technologies: data.technologies,
        projectUrl: data.projectUrl,
        githubUrl: data.githubUrl,
        imageUrl: data.imageUrl,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        category: data.category,
        isActive: data.isActive !== false,
      },
    });

    revalidatePath("/portfolio");
    return project;
  } catch (error) {
    console.error("Error creating portfolio project:", error);
    throw new Error("Failed to create portfolio project");
  }
}

// Get user's portfolio projects
export async function getPortfolioProjects() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const projects = await db.portfolioProject.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return projects;
  } catch (error) {
    console.error("Error fetching portfolio projects:", error);
    throw new Error("Failed to fetch portfolio projects");
  }
}

// Get a specific portfolio project
export async function getPortfolioProject(projectId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const project = await db.portfolioProject.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    return project;
  } catch (error) {
    console.error("Error fetching portfolio project:", error);
    throw new Error("Failed to fetch portfolio project");
  }
}

// Update a portfolio project
export async function updatePortfolioProject(projectId, data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const project = await db.portfolioProject.update({
      where: {
        id: projectId,
        userId: user.id,
      },
      data: {
        title: data.title,
        description: data.description,
        technologies: data.technologies,
        projectUrl: data.projectUrl,
        githubUrl: data.githubUrl,
        imageUrl: data.imageUrl,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        category: data.category,
        isActive: data.isActive,
      },
    });

    revalidatePath("/portfolio");
    return project;
  } catch (error) {
    console.error("Error updating portfolio project:", error);
    throw new Error("Failed to update portfolio project");
  }
}

// Delete a portfolio project
export async function deletePortfolioProject(projectId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    await db.portfolioProject.delete({
      where: {
        id: projectId,
        userId: user.id,
      },
    });

    revalidatePath("/portfolio");
    return { success: true };
  } catch (error) {
    console.error("Error deleting portfolio project:", error);
    throw new Error("Failed to delete portfolio project");
  }
}

// Generate AI-optimized project description
export async function generateProjectDescription(projectData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const prompt = `
      Generate a compelling, professional project description for a portfolio project.
      
      Project Details:
      - Title: ${projectData.title}
      - Technologies: ${projectData.technologies?.join(", ")}
      - Category: ${projectData.category}
      - User Industry: ${user.industry}
      - User Experience Level: ${user.experience} years
      
      Current Description: ${projectData.description || "No description provided"}
      
      Requirements:
      1. Write in a professional, engaging tone
      2. Highlight technical achievements and impact
      3. Include quantifiable results where possible
      4. Use industry-relevant terminology
      5. Keep it concise but comprehensive (150-300 words)
      6. Focus on problem-solving and innovation
      7. Include specific technologies and methodologies used
      
      Format the response as a single, well-structured paragraph.
      Do not include any additional text or explanations.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const description = response.text().trim();
    
    return description;
  } catch (error) {
    console.error("Error generating project description:", error);
    throw new Error("Failed to generate project description");
  }
}

// Get portfolio statistics
export async function getPortfolioStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const projects = await db.portfolioProject.findMany({
      where: { userId: user.id },
    });

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.isActive).length,
      categories: {},
      technologies: {},
      recentProjects: projects.slice(0, 3),
    };

    // Count projects by category
    projects.forEach(project => {
      stats.categories[project.category] = (stats.categories[project.category] || 0) + 1;
    });

    // Count technologies used
    projects.forEach(project => {
      project.technologies.forEach(tech => {
        stats.technologies[tech] = (stats.technologies[tech] || 0) + 1;
      });
    });

    return stats;
  } catch (error) {
    console.error("Error fetching portfolio stats:", error);
    throw new Error("Failed to fetch portfolio statistics");
  }
}

// Generate portfolio recommendations
export async function generatePortfolioRecommendations() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  try {
    const projects = await db.portfolioProject.findMany({
      where: { userId: user.id },
    });

    const prompt = `
      Analyze this user's portfolio and provide recommendations for improvement.
      
      User Profile:
      - Industry: ${user.industry}
      - Experience: ${user.experience} years
      - Skills: ${user.skills?.join(", ")}
      
      Current Projects: ${projects.length}
      Project Categories: ${Object.keys(projects.reduce((acc, p) => ({ ...acc, [p.category]: true }), {})).join(", ")}
      
      Industry Insights:
      - Top Skills: ${user.industryInsight?.topSkills?.join(", ")}
      - Recommended Skills: ${user.industryInsight?.recommendedSkills?.join(", ")}
      - Key Trends: ${user.industryInsight?.keyTrends?.join(", ")}
      
      Provide recommendations in this JSON format:
      {
        "missingProjectTypes": ["string"],
        "skillGaps": ["string"],
        "trendingTechnologies": ["string"],
        "projectIdeas": [
          {
            "title": "string",
            "description": "string",
            "technologies": ["string"],
            "difficulty": "beginner" | "intermediate" | "advanced",
            "impact": "string"
          }
        ],
        "portfolioImprovements": [
          {
            "area": "string",
            "suggestion": "string",
            "priority": "high" | "medium" | "low"
          }
        ],
        "industryAlignment": {
          "score": number,
          "strengths": ["string"],
          "improvements": ["string"]
        }
      }
      
      IMPORTANT: Return ONLY the JSON, no additional text.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    
    const recommendations = JSON.parse(cleanedText);
    return recommendations;
  } catch (error) {
    console.error("Error generating portfolio recommendations:", error);
    throw new Error("Failed to generate portfolio recommendations");
  }
}
