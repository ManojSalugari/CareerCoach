import { getResume } from "@/actions/resume";
import ATSOptimizationPanel from "@/components/ats/ats-optimization-panel";

export default async function ATSOptimizationPage() {
  const resume = await getResume();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">ATS Score Optimization</h1>
        <p className="text-gray-600">Optimize your resume for Applicant Tracking Systems</p>
      </div>

      <ATSOptimizationPanel resumeContent={resume?.content || ""} />
    </div>
  );
}
