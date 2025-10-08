"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { generateOpenEndedQuestions, evaluateOpenEndedAnswer } from "@/actions/interview";

export default function OpenVoiceInterview() {
  const [mode, setMode] = useState("HR");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeContent, setResumeContent] = useState("");
  const [questions, setQuestions] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [voice, setVoice] = useState(false);
  const recognitionRef = useRef(null);

  const { loading: loadingQs, fn: genQs } = useFetch(generateOpenEndedQuestions);
  const { loading: loadingEval, fn: evalAns } = useFetch(evaluateOpenEndedAnswer);

  const speak = (text) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const speakCurrent = () => {
    if (!questions) return;
    const q = questions[idx];
    speak(q.question);
  };

  const listen = () => {
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        toast.error("Speech recognition not supported");
        return;
      }
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.onresult = (e) => {
        const txt = e.results[0][0].transcript;
        setAnswer(txt);
        toast.success("Captured answer");
      };
      rec.start();
      recognitionRef.current = rec;
    } catch {}
  };

  useEffect(() => {
    if (voice && questions) speakCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice, idx, questions]);

  const start = async () => {
    try {
      const qs = await genQs({ mode, jobDescription, resumeContent });
      setQuestions(qs);
      setIdx(0);
      setAnswer("");
      setEvaluation(null);
    } catch (e) {
      toast.error(e.message || "Failed to start interview");
    }
  };

  const evaluate = async () => {
    try {
      const res = await evalAns({ mode, question: questions[idx].question, answer, jobDescription, resumeContent });
      setEvaluation(res);
    } catch (e) {
      toast.error(e.message || "Failed to evaluate");
    }
  };

  return (
    <Card className="mx-2">
      <CardHeader>
        <CardTitle>Open-ended Voice Interview (HR/TR)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!questions && (
          <>
            <div className="flex items-center gap-3">
              <Label>Mode</Label>
              <select className="border rounded p-2" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="HR">HR (behavioral)</option>
                <option value="TR">TR (technical)</option>
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <Label className="text-sm">Voice</Label>
                <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Job Description (optional)</Label>
                <textarea className="w-full border rounded p-2 h-28" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm">Resume (optional)</Label>
                <textarea className="w-full border rounded p-2 h-28" value={resumeContent} onChange={(e) => setResumeContent(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {questions && (
          <>
            <div className="flex items-center justify-between">
              <div className="font-medium">Question {idx + 1} of {questions.length}</div>
              {voice && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={speakCurrent}>Speak</Button>
                  <Button size="sm" variant="outline" onClick={listen}>Listen</Button>
                </div>
              )}
            </div>
            <p className="text-lg font-medium">{questions[idx].question}</p>
            <div className="space-y-2">
              <Label className="text-sm">Your Answer</Label>
              <textarea className="w-full border rounded p-2 h-36" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            </div>
            {evaluation && (
              <div className="p-3 border rounded text-sm">
                <div>Overall: {evaluation.overall}/10</div>
                <div className="text-gray-700">{evaluation.feedback}</div>
                <div className="mt-1">Follow-up: {evaluation.followUp}</div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!questions ? (
          <Button onClick={start} disabled={loadingQs} className="ml-auto">{loadingQs ? "Starting..." : "Start Open-ended Interview"}</Button>
        ) : (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={evaluate} disabled={loadingEval}>Evaluate</Button>
            <Button onClick={() => {
              if (idx < questions.length - 1) {
                setIdx(idx + 1); setAnswer(""); setEvaluation(null);
              } else {
                setQuestions(null); setIdx(0); setAnswer(""); setEvaluation(null);
              }
            }}>{idx < questions.length - 1 ? "Next" : "Finish"}</Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}


