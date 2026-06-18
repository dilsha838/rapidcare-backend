const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MYSQL CONNECTION
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "rapidcare",
});
db.connect((err) => {
  if (err) {
    console.log("❌ DB Error:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// ✅ TEST ROUTE
app.get("/", (req, res) => res.send("RapidCare API Running 🚀"));

// ✅ SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ message: "All fields required" });

    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length > 0)
          return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
          "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
          [name, email, phone, hashedPassword],
          (err) => {
            if (err) return res.status(500).json({ message: "Signup failed" });
            res.json({ message: "User registered successfully" });
          },
        );
      },
    );
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.length === 0)
        return res.status(401).json({ message: "User not found" });

      const user = result[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid password" });

      res.json({
        message: "Login success",
        user: { id: user.id, name: user.name, email: user.email },
      });
    },
  );
});

// ✅ AI CHAT
const KNOWLEDGE = [
  {
    keywords: [
      "fast",
      "fasting",
      "eat",
      "food",
      "drink",
      "water",
      "before test",
      "hours",
    ],
    answer:
      "🍽️ **Fasting Guidelines:**\n\n• CBC, CRP — No fasting needed\n• Blood Sugar (FBS) — 8 hours fasting\n• Lipid Profile — 12 hours fasting\n• Liver Function (LFT) — 8 hours fasting\n\n✅ Plain water is allowed during fasting.\n⚠️ Avoid tea, coffee, juice.",
  },
  {
    keywords: [
      "cbc",
      "complete blood",
      "blood count",
      "hemoglobin",
      "white blood",
      "red blood",
      "platelets",
    ],
    answer:
      "🩸 **CBC (Complete Blood Count):**\n\nMeasures:\n• Red blood cells — carry oxygen\n• White blood cells — fight infection\n• Hemoglobin — oxygen level\n• Platelets — blood clotting\n\n💰 Price: Rs. 850\n✅ No fasting required\n📋 Results in 24 hours",
  },
  {
    keywords: [
      "sugar",
      "glucose",
      "fbs",
      "diabetes",
      "blood sugar",
      "hba1c",
      "diabetic",
    ],
    answer:
      "📊 **Blood Sugar:**\n\n• Normal FBS: 70–100 mg/dL ✅\n• Pre-diabetes: 100–125 mg/dL ⚠️\n• Diabetes: 126+ mg/dL 🔴\n\n💰 FBS: Rs. 450 | HbA1c: Rs. 1,100\n⏰ 8 hours fasting required",
  },
  {
    keywords: ["lipid", "cholesterol", "triglyceride", "hdl", "ldl", "heart"],
    answer:
      "❤️ **Lipid Profile:**\n\n• Total Cholesterol: Below 200 mg/dL ✅\n• LDL (bad): Below 100 mg/dL ✅\n• HDL (good): Above 60 mg/dL ✅\n• Triglycerides: Below 150 mg/dL ✅\n\n💰 Rs. 1,200 | ⏰ 12 hours fasting",
  },
  {
    keywords: ["thyroid", "tsh", "t3", "t4", "hypothyroid", "hyperthyroid"],
    answer:
      "🦋 **Thyroid TSH Test:**\n\n• Normal: 0.4–4.0 mIU/L ✅\n• High TSH = Hypothyroidism\n• Low TSH = Hyperthyroidism\n\n💰 Rs. 1,800 | ✅ No fasting required",
  },
  {
    keywords: [
      "vitamin d",
      "vit d",
      "vitamin",
      "calcium",
      "bone",
      "deficiency",
    ],
    answer:
      "☀️ **Vitamin D Test:**\n\n• Deficient: Below 20 ng/mL 🔴\n• Insufficient: 20–29 ng/mL ⚠️\n• Normal: 30–100 ng/mL ✅\n\nSymptoms: Fatigue, bone pain, frequent illness\n\n💰 Rs. 2,500 | ✅ No fasting",
  },
  {
    keywords: [
      "liver",
      "lft",
      "liver function",
      "sgpt",
      "alt",
      "ast",
      "bilirubin",
      "jaundice",
    ],
    answer:
      "🫀 **Liver Function Test (LFT):**\n\n• ALT/SGPT normal: 7–56 U/L\n• Bilirubin normal: 0.1–1.2 mg/dL\n\nSigns of problems: Yellowing eyes, dark urine\n\n💰 Rs. 1,500 | ⏰ 8 hours fasting",
  },
  {
    keywords: ["kidney", "rft", "renal", "creatinine", "urea", "uric acid"],
    answer:
      "🫘 **Kidney Function Test (RFT):**\n\n• Creatinine normal: 0.7–1.3 mg/dL\n• Urea normal: 7–20 mg/dL\n\nWarning: Swollen feet, reduced urination\n\n💰 Rs. 1,400 | ✅ No fasting needed",
  },
  {
    keywords: [
      "branch",
      "location",
      "where",
      "address",
      "colombo",
      "nugegoda",
      "kandy",
      "open",
      "time",
      "hour",
    ],
    answer:
      "📍 **RapidCare Branches:**\n\n🏥 Colombo 03 — 6:00 AM – 8:00 PM\n🏥 Nugegoda — 7:00 AM – 7:00 PM\n🏥 Kandy — 7:00 AM – 6:00 PM\n\n✅ Open Saturday & Sunday",
  },
  {
    keywords: ["price", "cost", "how much", "rs", "rupee", "fee", "charge"],
    answer:
      "💰 **Test Prices (LKR):**\n\n🩸 CBC — Rs. 850\n🍬 Blood Sugar — Rs. 450\n❤️ Lipid Profile — Rs. 1,200\n🫀 Liver (LFT) — Rs. 1,500\n🫘 Kidney (RFT) — Rs. 1,400\n🦋 Thyroid (TSH) — Rs. 1,800\n📊 HbA1c — Rs. 1,100\n☀️ Vitamin D — Rs. 2,500\n🔬 ESR — Rs. 300\n🧪 Urine Full — Rs. 350",
  },
  {
    keywords: [
      "result",
      "report",
      "understand",
      "read",
      "interpret",
      "normal range",
      "high",
      "low",
    ],
    answer:
      "📋 **Reading Lab Reports:**\n\n• H (High) / L (Low) = outside normal range\n• Reference Range = normal column\n• One abnormal value ≠ disease\n\n⚠️ Always discuss results with your doctor!\n🔴 Critical values need immediate attention.",
  },
  {
    keywords: ["prepare", "preparation", "what to do", "ready", "bring"],
    answer:
      "✅ **Test Day Tips:**\n\n📋 Bring: NIC / photo ID\n⏰ Arrive 10 minutes early\n📱 Show your RapidCare token\n🍽️ Fasting: plain water OK\n🏃 Avoid heavy exercise before tests",
  },
  {
    keywords: ["esr", "crp", "inflammation", "infection", "fever"],
    answer:
      "🔬 **ESR / CRP Tests:**\n\n• ESR normal: Men 0–15 | Women 0–20 mm/hr\n• CRP normal: Below 10 mg/L\n\nHigh values = possible infection/inflammation\n\n💰 ESR: Rs. 300 | ✅ No fasting",
  },
  {
    keywords: ["urine", "uft", "urine test", "urine full", "urinary"],
    answer:
      "🧪 **Urine Full Report:**\n\nChecks protein, glucose, blood, bacteria\n\nCollection: Use midstream urine, first morning best\n\n💰 Rs. 350 | ✅ No fasting | ⏱️ Results in 4 hours",
  },
  {
    keywords: ["book", "booking", "appointment", "schedule", "how to book"],
    answer:
      "📅 **How to Book:**\n\n1️⃣ Tap Blood Test Booking\n2️⃣ Select tests\n3️⃣ Choose branch & time\n4️⃣ Pay (PayHere or Cash)\n5️⃣ Get Queue Token\n6️⃣ Show token at lab — skip queue! ✅",
  },
];

function getSmartAnswer(question) {
  const q = question.toLowerCase().trim();
  let bestMatch = null,
    bestScore = 0;
  for (const topic of KNOWLEDGE) {
    let score = 0;
    for (const keyword of topic.keywords) {
      if (q.includes(keyword.toLowerCase())) score += keyword.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = topic;
    }
  }
  if (bestMatch && bestScore > 0) return bestMatch.answer;
  if (q.match(/^(hi|hello|hey|ayubowan|good morning|good evening)/))
    return "👋 Hello! I'm RapidCare AI.\n\nI can help you with:\n• Lab test information\n• Fasting requirements\n• Prices & preparation\n• Branch locations\n• Understanding results\n\nWhat would you like to know?";
  if (q.match(/(thank|thanks|ok|okay|great)/))
    return "😊 You're welcome! Feel free to ask anything about lab tests.\n\n💡 Always consult your doctor for diagnosis!";
  return "🤔 I can help with:\n\n• 🩸 Blood tests (CBC, Sugar, Lipid, Thyroid)\n• ⏰ Fasting rules\n• 💰 Test prices\n• 📍 Branch locations\n• 📋 Reading results\n\nPlease ask a specific question!";
}

app.post("/ai/chat", (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: "Messages required." });
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user")
      return res.status(400).json({ error: "User message required." });
    const reply = getSmartAnswer(lastMessage.content);
    setTimeout(() => res.json({ reply }), 600);
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ✅ QUEUE ENDPOINTS
app.get("/queue/status", (req, res) => {
  const branch = req.query.branch || "Colombo 03";
  const date = req.query.date || new Date().toISOString().split("T")[0];
  db.query(
    "SELECT * FROM queue WHERE branch = ? AND date = ? AND is_active = 1",
    [branch, date],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result.length === 0)
        return res.json({ currentNumber: 1, totalTokens: 0, branch, date });
      const q = result[0];
      res.json({
        currentNumber: q.current_number,
        totalTokens: q.total_tokens,
        branch: q.branch,
        date: q.date,
      });
    },
  );
});

app.post("/queue/get-token", (req, res) => {
  const { branch, date } = req.body;
  db.query(
    "SELECT * FROM queue WHERE branch = ? AND date = ?",
    [branch, date],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result.length === 0) {
        db.query(
          "INSERT INTO queue (branch, date, current_number, total_tokens) VALUES (?, ?, 1, 1)",
          [branch, date],
          (err2) => {
            if (err2) return res.status(500).json({ error: "Insert error" });
            res.json({ tokenNumber: 1 });
          },
        );
      } else {
        const newToken = result[0].total_tokens + 1;
        db.query(
          "UPDATE queue SET total_tokens = ? WHERE branch = ? AND date = ?",
          [newToken, branch, date],
          (err2) => {
            if (err2) return res.status(500).json({ error: "Update error" });
            res.json({ tokenNumber: newToken });
          },
        );
      }
    },
  );
});

app.put("/queue/next", (req, res) => {
  const { branch, date } = req.body;
  db.query(
    "UPDATE queue SET current_number = current_number + 1 WHERE branch = ? AND date = ?",
    [branch, date],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({
        message: "Next patient called",
        affectedRows: result.affectedRows,
      });
    },
  );
});

app.put("/queue/set", (req, res) => {
  const { branch, date, number } = req.body;
  db.query(
    "UPDATE queue SET current_number = ? WHERE branch = ? AND date = ?",
    [number, branch, date],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ message: "Queue updated" });
    },
  );
});

app.get("/queue/all", (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];
  db.query(
    "SELECT * FROM queue WHERE date = ? AND is_active = 1 ORDER BY branch",
    [date],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(result);
    },
  );
});

// ✅ START SERVER
app.listen(5000, "0.0.0.0", () => {
  console.log("🚀 Server running on port 5000");
});
