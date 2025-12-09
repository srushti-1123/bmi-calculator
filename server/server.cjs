// ------------------------
// IMPORTS
// ------------------------
const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

// Load .env
dotenv.config();

// ------------------------
// EXPRESS APP
// ------------------------
const app = express();
app.use(cors());
app.use(express.json());

// ------------------------
// STATIC FRONTEND (React build)
// ------------------------
app.use(express.static(path.join(__dirname, "build")));

// ------------------------
// BMI CALCULATOR API
// ------------------------
app.post("/api/bmi", (req, res) => {
  const { weight, height } = req.body;

  if (!weight || !height) {
    return res.status(400).json({ error: "Missing weight or height" });
  }

  const bmi = weight / ((height / 100) ** 2);
  res.json({ bmi: bmi.toFixed(2) });
});

// ------------------------
// OPENAI SETUP
// ------------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ------------------------
// ADVICE API
// ------------------------
app.post("/api/advice", async (req, res) => {
  const { bmi, category } = req.body;

  if (!bmi || !category) {
    return res.status(400).json({ error: "BMI or category missing" });
  }

  const prompt = `
You are a certified yoga and wellness coach.
Give short personalized advice for:
- BMI: ${bmi}
- Category: ${category}
Include:
• 2 yoga poses  
• 1 diet tip  
• 1 motivational quote  
Keep it short.
`;

  try {
    if (process.env.OPENAI_API_KEY) {
      const result = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      });

      const reply =
        result.choices?.[0]?.message?.content ||
        "Could not generate advice.";

      return res.json({ advice: reply });
    } else {
      throw new Error("Missing API key");
    }
  } catch (err) {
    console.error("OpenAI Error:", err.message);

    const fallback = `
✨ Yoga Poses: Tadasana, Surya Namaskar  
🥗 Diet Tip: Eat fiber-rich food & stay hydrated  
💬 Motivation: “Small steps daily create big results.”  
`;
    return res.json({ advice: fallback });
  }
});

// ------------------------
// CATCH-ALL → SERVE REACT APP (Express v5 FIX)
// ------------------------
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
})

// ------------------------
// START SERVER
// ------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
