"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, TrendingUp, Target, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import {
  analyzeResumeATS,
  generateATSOptimizationSuggestions,
  compareResumeToJob,
  getATSAnalysisHistory,
  getLatestATSAnalysis,
} from "@/actions/ats-optimization";

const ScoreCard = ({ title, score, icon: Icon, color }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold" style={{ color }}>
            {score}/100
          </p>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
      <Progress value={score} className="mt-2" />
    </CardContent>
  </Card>
);

const SuggestionCard = ({ suggestion, priority }) => {
  const priorityColors = {
    high: "destructive",
    medium: "default",
    low: "secondary",
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant={priorityColors[priority] || "default"}>
                {priority} priority
              </Badge>
              <span className="text-sm font-medium">{suggestion.category}</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{suggestion.suggestion}</p>
            <p className="text-xs text-gray-500">{suggestion.impact}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ATSOptimizationPanel({ resumeContent }) {
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");

  const {
    loading: analysisLoading,
    fn: analyzeResume,
  } = useFetch(analyzeResumeATS);

  const {
    loading: suggestionsLoading,
    fn: generateSuggestions,
  } = useFetch(generateATSOptimizationSuggestions);

  const {
    loading: comparisonLoading,
    fn: compareResume,
  } = useFetch(compareResumeToJob);

  const {
    loading: historyLoading,
    fn: fetchHistory,
    data: history,
  } = useFetch(getATSAnalysisHistory);

  const {
    loading: latestLoading,
    fn: fetchLatest,
    data: latestAnalysis,
  } = useFetch(getLatestATSAnalysis);

  const handleAnalyze = async () => {
    if (!resumeContent.trim()) {
      toast.error("Please provide resume content to analyze");
      return;
    }

    try {
      const result = await analyzeResume(resumeContent, jobDescription || null);
      setAnalysis(result);
      setActiveTab("analysis");
      toast.success("Resume analysis completed!");
    } catch (error) {
      toast.error("Failed to analyze resume");
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!resumeContent.trim()) {
      toast.error("Please provide resume content");
      return;
    }

    try {
      const result = await generateSuggestions(resumeContent, jobDescription || null);
      setSuggestions(result);
      setActiveTab("suggestions");
      toast.success("Optimization suggestions generated!");
    } catch (error) {
      toast.error("Failed to generate suggestions");
    }
  };

  const handleCompare = async () => {
    if (!resumeContent.trim() || !jobDescription.trim()) {
      toast.error("Please provide both resume content and job description");
      return;
    }

    try {
      const result = await compareResume(resumeContent, jobDescription);
      setComparison(result);
      setActiveTab("comparison");
      toast.success("Resume comparison completed!");
    } catch (error) {
      toast.error("Failed to compare resume with job description");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>ATS Score Optimization</span>
          </CardTitle>
          <CardDescription>
            Analyze and optimize your resume for Applicant Tracking Systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="job-description">Job Description (Optional)</Label>
            <Textarea
              id="job-description"
              placeholder="Paste the job description here for targeted analysis..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleAnalyze}
              disabled={analysisLoading}
              className="flex-1"
            >
              {analysisLoading ? "Analyzing..." : "Analyze Resume"}
            </Button>
            <Button
              onClick={handleGenerateSuggestions}
              disabled={suggestionsLoading}
              variant="outline"
              className="flex-1"
            >
              {suggestionsLoading ? "Generating..." : "Get Suggestions"}
            </Button>
            <Button
              onClick={handleCompare}
              disabled={comparisonLoading}
              variant="outline"
              className="flex-1"
            >
              {comparisonLoading ? "Comparing..." : "Compare with Job"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(analysis || suggestions || comparison) && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="comparison">Job Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            {analysis && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ScoreCard
                    title="Overall Score"
                    score={analysis.overallScore}
                    icon={TrendingUp}
                    color={getScoreColor(analysis.overallScore)}
                  />
                  <ScoreCard
                    title="Keyword Match"
                    score={analysis.keywordMatch}
                    icon={Target}
                    color={getScoreColor(analysis.keywordMatch)}
                  />
                  <ScoreCard
                    title="Format Score"
                    score={analysis.formatScore}
                    icon={CheckCircle}
                    color={getScoreColor(analysis.formatScore)}
                  />
                  <ScoreCard
                    title="Structure Score"
                    score={analysis.structureScore}
                    icon={AlertCircle}
                    color={getScoreColor(analysis.structureScore)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.strengths?.map((strength, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.weaknesses?.map((weakness, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {analysis.suggestions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Optimization Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.suggestions.map((suggestion, index) => (
                        <SuggestionCard
                          key={index}
                          suggestion={suggestion}
                          priority={suggestion.priority}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {suggestions && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Immediate Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {suggestions.immediateActions?.map((action, index) => (
                      <div key={index} className="mb-4 p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{action.action}</h4>
                          <Badge variant="outline">{action.difficulty}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{action.reason}</p>
                        <p className="text-xs text-gray-500">Estimated time: {action.estimatedTime}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Keyword Optimization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Add Keywords</h4>
                        <ul className="space-y-1">
                          {suggestions.keywordOptimization?.addKeywords?.map((keyword, index) => (
                            <li key={index} className="text-sm bg-green-50 p-2 rounded">
                              {keyword}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Remove Keywords</h4>
                        <ul className="space-y-1">
                          {suggestions.keywordOptimization?.removeKeywords?.map((keyword, index) => (
                            <li key={index} className="text-sm bg-red-50 p-2 rounded">
                              {keyword}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2">Replace Keywords</h4>
                        <ul className="space-y-1">
                          {suggestions.keywordOptimization?.replaceKeywords?.map((replacement, index) => (
                            <li key={index} className="text-sm bg-blue-50 p-2 rounded">
                              <span className="line-through">{replacement.old}</span> → {replacement.new}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            {comparison && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Job Match Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {comparison.matchScore}%
                      </div>
                      <p className="text-sm text-gray-600">Overall Match Score</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Skills Match</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Matched Skills</span>
                            <span className="text-green-600">{comparison.requiredSkillsMatch?.percentage}%</span>
                          </div>
                          <Progress value={comparison.requiredSkillsMatch?.percentage} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Keyword Alignment</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Alignment Score</span>
                            <span className="text-blue-600">{comparison.keywordAlignment?.alignmentScore}%</span>
                          </div>
                          <Progress value={comparison.keywordAlignment?.alignmentScore} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {comparison.strengths?.map((strength, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gaps to Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {comparison.gaps?.map((gap, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm">{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
