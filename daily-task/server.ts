import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI client lazily or on server boot
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    genAI = new GoogleGenAI({
      apiKey: apiKey || "dummy-key-for-initialization",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// API Endpoint 1: Grade Assignment / Quiz Submission using Gemini AI
app.post("/api/ai/grade-submission", async (req, res) => {
  try {
    const { assignment, submission } = req.body;

    if (!assignment || !submission) {
      return res.status(400).json({ error: "Assignment and submission data are required" });
    }

    const ai = getGenAI();

    const isQuiz = assignment.type === "quiz";

    let prompt = "";
    if (isQuiz) {
      prompt = `You are an expert AI Educator evaluating a student quiz submission.
Assignment Title: ${assignment.title}
Subject ID: ${assignment.subjectId}
Total Points: ${assignment.totalPoints || 100}

Quiz Questions & Correct Answers:
${JSON.stringify(assignment.questions || [], null, 2)}

Student Selected Answers (questionId -> selectedOptionIndex):
${JSON.stringify(submission.quizAnswers || {}, null, 2)}

Evaluate each question carefully. Calculate the score, identify correct/incorrect answers, and provide constructive feedback.`;
    } else {
      prompt = `You are an expert academic evaluator checking a student assignment submission.
Assignment Title: ${assignment.title}
Instructions/Rubric: ${assignment.description || "General academic evaluation"}
Total Points: ${assignment.totalPoints || 100}

Student Written Submission Text:
"""
${submission.textSubmission || "No text provided"}
"""

Evaluate the submission against the instructions. Provide a fair score out of ${assignment.totalPoints || 100}, constructive feedback, key strengths, and specific areas for improvement.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an encouraging, accurate, and fair AI teaching assistant. Provide rigorous yet supportive evaluation.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Evaluated numerical score obtained by student" },
            maxScore: { type: Type.NUMBER, description: "Maximum available points for this assignment" },
            percentage: { type: Type.NUMBER, description: "Calculated percentage score" },
            feedback: { type: Type.STRING, description: "Overall summary feedback for the student" },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of key strengths demonstrated in the submission"
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of constructive areas for improvement"
            },
            questionResults: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionId: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  selectedAnswer: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  isCorrect: { type: Type.BOOLEAN },
                  explanation: { type: Type.STRING }
                },
                required: ["questionId", "isCorrect", "explanation"]
              }
            }
          },
          required: ["score", "maxScore", "percentage", "feedback", "strengths", "improvements"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText);

    return res.json({ success: true, grade: resultJson });
  } catch (error: any) {
    console.error("AI Grading Error:", error);
    return res.status(500).json({ 
      error: "Failed to grade submission using AI Assistant", 
      message: error?.message || "Internal server error" 
    });
  }
});

// API Endpoint 2: AI Teacher & Student Assistant Chat
app.post("/api/ai/assistant-chat", async (req, res) => {
  try {
    const { prompt, context, role } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGenAI();

    const systemInstruction = role === 'teacher'
      ? "You are an AI Curriculum & Exam Assistant helping teachers craft quizzes, write assignment rubrics, and generate feedback."
      : "You are a friendly AI Tutor assisting students with understanding assignment criteria, homework guidance, and study tips.";

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${context ? `Context Data: ${JSON.stringify(context)}\n\n` : ""}${prompt}`,
      config: {
        systemInstruction,
      }
    });

    return res.json({ success: true, reply: response.text });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return res.status(500).json({ error: "Failed to process AI chat request" });
  }
});

// API Endpoint 3: AI Generate Quiz Questions from Topic, Document, or Link
app.post("/api/ai/generate-quiz", async (req, res) => {
  try {
    const { topic, documentText, linkUrl, numQuestions, difficulty } = req.body;
    const ai = getGenAI();

    let contentPrompt = "";
    if (documentText && documentText.trim().length > 0) {
      contentPrompt = `Generate ${numQuestions || 5} multiple-choice quiz questions based strictly on the following uploaded document content:

"""
${documentText.slice(0, 15000)}
"""

Difficulty level: ${difficulty || "medium"}.`;
    } else if (linkUrl && linkUrl.trim().length > 0) {
      contentPrompt = `Generate ${numQuestions || 5} multiple-choice quiz questions based on the reference study article/link: "${linkUrl}". Topic: ${topic || "General Study Material"}. Difficulty level: ${difficulty || "medium"}.`;
    } else {
      contentPrompt = `Generate ${numQuestions || 5} multiple-choice quiz questions on the topic "${topic || "General Knowledge"}" with difficulty "${difficulty || "medium"}".`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contentPrompt,
      config: {
        systemInstruction: "You are an expert AI Educator. Create clear, accurate multiple-choice quiz questions with 4 distinct options, 1 correct option index (0 to 3), and a brief explanation for why the answer is correct.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "Index (0-3) of correct option" },
              explanation: { type: Type.STRING, description: "Explanation of why this answer is correct" },
              points: { type: Type.NUMBER }
            },
            required: ["question", "options", "correctAnswerIndex", "points"]
          }
        }
      }
    });

    const resultText = response.text || "[]";
    const questions = JSON.parse(resultText);

    return res.json({ success: true, questions });
  } catch (error: any) {
    console.error("AI Quiz Generator Error:", error);
    return res.status(500).json({ error: "Failed to generate quiz questions", message: error?.message });
  }
});

async function startServer() {
  // Vite middleware for development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
