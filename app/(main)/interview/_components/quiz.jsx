"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateQuiz, saveQuizResult } from "@/actions/interview";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [difficulty, setDifficulty] = useState("mixed");
  const [topics, setTopics] = useState("");
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const [voiceMode, setVoiceMode] = useState(false);
  const recognitionRef = useRef(null);

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
  } = useFetch(generateQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveQuizResult);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
      // 60 seconds per question default
      setTimeLeft(quizData.length * 60);
    }
  }, [quizData]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      finishQuiz();
      return;
    }
    const id = setInterval(() => setTimeLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    try {
      await saveQuizResultFn(quizData, answers, score);
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    }
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowExplanation(false);
    generateQuizFn({ difficulty, topics: topics.split(",").map((t) => t.trim()).filter(Boolean) });
    setResultData(null);
  };

  const speak = (text) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  const speakCurrentQuestion = () => {
    if (!quizData) return;
    const q = quizData[currentQuestion];
    const text = `Question ${currentQuestion + 1}. ${q.question}. Options: ${q.options
      .map((o, i) => `${String.fromCharCode(65 + i)}: ${o}`)
      .join(". ")}.`;
    speak(text);
  };

  useEffect(() => {
    if (voiceMode && quizData) {
      speakCurrentQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode, currentQuestion, quizData]);

  const startListening = () => {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error("Speech recognition not supported in this browser");
        return;
      }
      const rec = new SpeechRecognition();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript.toLowerCase();
        const map = { a: 0, b: 1, c: 2, d: 3 };
        let picked = null;
        Object.keys(map).forEach((k) => {
          if (transcript.includes(k)) picked = map[k];
        });
        if (picked === null) {
          // try to match by option text snippet
          const q = quizData[currentQuestion];
          const hitIdx = q.options.findIndex((o) => transcript.includes(o.toLowerCase().split(" ")[0]));
          if (hitIdx >= 0) picked = hitIdx;
        }
        if (picked !== null) {
          handleAnswer(quizData[currentQuestion].options[picked]);
          toast.success(`Heard option ${String.fromCharCode(65 + picked)}`);
        } else {
          toast.error("Couldn't understand. Say A, B, C, or D.");
        }
      };
      rec.onerror = () => {};
      rec.start();
      recognitionRef.current = rec;
    } catch {}
  };

  if (generatingQuiz) {
    return <BarLoader className="mt-4" width={"100%"} color="gray" />;
  }

  // Show results if quiz is completed
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  if (!quizData) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Ready to test your knowledge?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This quiz contains 10 questions specific to your industry and
            skills. Take your time and choose the best answer for each question.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">Difficulty</Label>
              <select className="w-full border rounded p-2" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm">Topics (comma separated)</Label>
              <input className="w-full border rounded p-2" placeholder="e.g., React, SQL, System Design" value={topics} onChange={(e) => setTopics(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={startNewQuiz} className="w-full">
            Start Interview
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const question = quizData[currentQuestion];

  return (
    <Card className="mx-2">
      <CardHeader>
        <CardTitle>
          Question {currentQuestion + 1} of {quizData.length}
        </CardTitle>
        {timeLeft !== null && (
          <div className="text-sm text-muted-foreground">Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Label className="text-sm">Voice mode</Label>
            <input type="checkbox" checked={voiceMode} onChange={(e) => setVoiceMode(e.target.checked)} />
            {voiceMode && (
              <>
                <Button type="button" size="sm" variant="outline" onClick={speakCurrentQuestion}>Speak</Button>
                <Button type="button" size="sm" variant="outline" onClick={startListening}>Listen</Button>
              </>
            )}
          </div>
        </div>
        <p className="text-lg font-medium">{question.question}</p>
        <RadioGroup
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
          className="space-y-2"
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>

        {showExplanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">Explanation:</p>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!showExplanation && (
          <Button
            onClick={() => setShowExplanation(true)}
            variant="outline"
            disabled={!answers[currentQuestion]}
          >
            Show Explanation
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
          className="ml-auto"
        >
          {savingResult && (
            <BarLoader className="mt-4" width={"100%"} color="gray" />
          )}
          {currentQuestion < quizData.length - 1
            ? "Next Question"
            : "Finish Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
}
