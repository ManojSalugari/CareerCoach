import { getIndustryInsights } from "@/actions/dashboard";
import { getATSAnalysisHistory } from "@/actions/ats-optimization";
import { db } from "@/lib/prisma";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { isOnboarded, userId } = await getUserOnboardingStatus();

  // If not onboarded, redirect to onboarding page
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  // If no userId from auth, redirect to sign-in
  if (!userId) {
    redirect("/sign-in");
  }

  const insights = await getIndustryInsights();
  const atsHistory = await getATSAnalysisHistory();
  
  // Resolve the DB user safely using clerk userId
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    redirect("/onboarding");
  }
  const assessments = await db.assessment.findMany({ where: { userId: user.id } });
  const topicToStats = new Map();
  for (const a of assessments) {
    for (const q of a.questions) {
      const topic = q.topic || "General";
      const s = topicToStats.get(topic) || { correct: 0, total: 0 };
      s.total += 1;
      if (q.isCorrect) s.correct += 1;
      topicToStats.set(topic, s);
    }
  }
  const assessmentsByTopic = Array.from(topicToStats.entries()).map(([topic, s]) => ({ topic, accuracy: Math.round((s.correct / s.total) * 100) }));

  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} atsHistory={atsHistory} assessmentsByTopic={assessmentsByTopic} />
    </div>
  );
}
