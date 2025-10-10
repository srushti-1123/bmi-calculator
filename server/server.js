import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // your React app
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---- API Route ----
app.post("/api/advice", async (req, res) => {
  const { bmi, category } = req.body;
  console.log("✅ Request received:", { bmi, category });

  if (!bmi || !category) {
    return res.status(400).json({ error: "BMI or category missing" });
  }

  const prompt = `
You are a certified yoga and wellness coach.
Give a short personalized guidance for a person with:
- BMI: ${bmi}
- Category: ${category}
Include yoga poses, diet tip, and a motivational quote. Keep it short.
`;

  try {
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      });

      const reply =
        completion.choices?.[0]?.message?.content ||
        "Could not generate advice right now.";
      console.log("🧠 OpenAI reply:", reply);
      return res.json({ advice: reply });
    } else {
      throw new Error("Missing API key");
    }
  } catch (err) {
    console.error("❌ OpenAI Error or Fallback Triggered:", err.message);

    const mockAdvice = `
  ✨ Yoga Poses: Tadasana, Surya Namaskar, chandra namskar
  🥗 Diet Tip: Eat fiber-rich foods and stay hydrated.
  💬 Motivation: "Discipline and patience lead to transformation."
    `;
    return res.json({ advice: mockAdvice });
  }
});

// ---- Start Server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
