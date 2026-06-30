const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MYSQL CONNECTION
const db = mysql.createConnection({
  host: process.env.MYSQLHOST || "localhost",
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "rapidcare",
  port: process.env.MYSQLPORT || 3306,
});
db.connect((err) => {
  if (err) {
    console.log("❌ DB Error:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// ✅ AUTO CREATE TABLES
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100), email VARCHAR(100) UNIQUE,
    phone VARCHAR(20), password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(100), user_email VARCHAR(100),
    branch VARCHAR(100), booking_date DATE,
    time_slot VARCHAR(20),
    tests JSON, total_amount DECIMAL(10,2),
    token_number INT DEFAULT 1,
    order_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch VARCHAR(100), date DATE,
    current_number INT DEFAULT 1,
    total_tokens INT DEFAULT 0,
    is_active TINYINT DEFAULT 1,
    UNIQUE KEY branch_date (branch, date)
  )
`);

db.query(`
  CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100), address VARCHAR(255),
    phone VARCHAR(30), hours VARCHAR(50),
    days VARCHAR(50), color VARCHAR(20),
    badge VARCHAR(50), services TEXT,
    parking TINYINT DEFAULT 0, ac TINYINT DEFAULT 0,
    wifi TINYINT DEFAULT 0, wait_time VARCHAR(20),
    map_url VARCHAR(255), is_active TINYINT DEFAULT 1
  )
`);

// ✅ TEST ROUTE
app.get("/", (req, res) => res.send("RapidCare API Running 🚀"));

// ─── AUTH ─────────────────────────────────────────────────────────────────────
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
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

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

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
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
      "kuliyapitiya",
      "nikaweratiya",
      "open",
      "time",
      "hour",
    ],
    answer:
      "📍 **RapidCare Branches:**\n\n🏥 Colombo 03 — 6:00 AM – 8:00 PM\n🏥 Nugegoda — 7:00 AM – 7:00 PM\n🏥 Kandy — 7:00 AM – 6:00 PM\n🏥 Kuliyapitiya — 7:00 AM – 5:00 PM\n🏥 Nikaweratiya — 7:30 AM – 4:30 PM\n\n✅ Open Saturday & Sunday (select branches)",
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
  } catch {
    res.status(500).json({ error: "Server error." });
  }
});

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

// ✅ CREATE BOOKING — real sequential token per branch+date
app.post("/bookings", (req, res) => {
  const {
    branchName,
    bookingDate,
    timeSlot,
    tests,
    totalAmount,
    orderId,
    userName,
    userEmail,
  } = req.body;

  // Step 1: Get MAX token_number for this branch+date
  db.query(
    "SELECT MAX(token_number) AS lastToken FROM bookings WHERE branch = ? AND booking_date = ? AND status != 'cancelled'",
    [branchName, bookingDate],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error getting token" });

      const nextToken = (result[0].lastToken || 0) + 1;

      // Step 2: Insert booking with sequential token
      db.query(
        `INSERT INTO bookings (user_name, user_email, branch, booking_date, time_slot, tests, total_amount, token_number, order_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')`,
        [
          userName,
          userEmail,
          branchName,
          bookingDate,
          timeSlot,
          JSON.stringify(tests),
          totalAmount,
          nextToken,
          orderId,
        ],
        (err2, result2) => {
          if (err2)
            return res
              .status(500)
              .json({ error: "Insert error", detail: err2.message });

          // Step 3: Update queue table
          db.query(
            "INSERT INTO queue (branch, date, current_number, total_tokens) VALUES (?, ?, 1, ?) ON DUPLICATE KEY UPDATE total_tokens = ?",
            [branchName, bookingDate, nextToken, nextToken],
            (err3) => {
              if (err3) console.log("Queue update error:", err3);
            },
          );

          res.json({
            bookingId: result2.insertId,
            tokenNumber: nextToken,
            message: "Booking confirmed",
          });
        },
      );
    },
  );
});

// ✅ GET MY BOOKINGS by email
app.get("/bookings/my", (req, res) => {
  const email = req.query.email || "";
  if (!email) return res.status(400).json({ error: "Email required" });

  db.query(
    `SELECT id, user_name, user_email, branch,
     DATE_FORMAT(booking_date, '%Y-%m-%d') as booking_date,
     time_slot, tests, total_amount, token_number,
     order_id, status, created_at
     FROM bookings WHERE user_email = ? ORDER BY created_at DESC`,
    [email],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(result);
    },
  );
});

// ✅ GET ALL BOOKINGS for a branch+date
app.get("/bookings/all", (req, res) => {
  const { branch, date } = req.query;
  db.query(
    "SELECT * FROM bookings WHERE branch = ? AND booking_date = ? AND status != 'cancelled' ORDER BY token_number",
    [branch, date],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(result);
    },
  );
});

// ✅ GET BOOKED SLOTS for branch+date (for time slot availability)
app.get("/bookings/slots", (req, res) => {
  const { branch, date } = req.query;
  db.query(
    "SELECT time_slot, COUNT(*) as count FROM bookings WHERE branch = ? AND booking_date = ? AND status != 'cancelled' GROUP BY time_slot",
    [branch, date],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(result);
    },
  );
});

// ✅ CANCEL BOOKING
app.put("/bookings/:id/cancel", (req, res) => {
  const { id } = req.params;
  db.query(
    "UPDATE bookings SET status = 'cancelled' WHERE id = ? OR order_id = ?",
    [id, id],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ message: "Booking cancelled" });
    },
  );
});

// ✅ UPDATE PAYMENT METHOD
app.put("/bookings/:id/pay", (req, res) => {
  const { id } = req.params;
  const { method, orderId } = req.body;
  db.query(
    "UPDATE bookings SET status = 'upcoming', order_id = COALESCE(?, order_id) WHERE id = ? OR order_id = ?",
    [orderId, id, id],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ message: "Payment updated" });
    },
  );
});

// ─── QUEUE ────────────────────────────────────────────────────────────────────
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

// ─── BRANCHES ─────────────────────────────────────────────────────────────────
app.get("/branches", (req, res) => {
  db.query(
    "SELECT * FROM branches WHERE is_active = 1 ORDER BY id",
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      // If no branches in DB, return static data
      if (result.length === 0) {
        return res.json([
          {
            id: 1,
            name: "Colombo 03",
            address: "No. 45, Galle Road, Colombo 03",
            phone: "+94 11 234 5678",
            hours: "6:00 AM – 8:00 PM",
            days: "Mon – Sun",
            color: "#3B82F6",
            badge: "Main Branch",
            services:
              "CBC,Lipid Profile,Thyroid,Vitamin D,HbA1c,Liver Function,Kidney Function,ESR,Urine Full",
            parking: 1,
            ac: 1,
            wifi: 1,
            wait_time: "~15 mins",
            map_url: "https://maps.google.com/?q=Colombo+03+Sri+Lanka",
          },
          {
            id: 2,
            name: "Nugegoda",
            address: "No. 12, High Level Road, Nugegoda",
            phone: "+94 11 876 5432",
            hours: "7:00 AM – 7:00 PM",
            days: "Mon – Sun",
            color: "#A855F7",
            badge: "South Branch",
            services:
              "CBC,Blood Sugar,Lipid Profile,Thyroid,Liver Function,Kidney Function,Urine Full",
            parking: 1,
            ac: 1,
            wifi: 0,
            wait_time: "~10 mins",
            map_url: "https://maps.google.com/?q=Nugegoda+Sri+Lanka",
          },
          {
            id: 3,
            name: "Kandy",
            address: "No. 78, Peradeniya Road, Kandy",
            phone: "+94 81 222 3344",
            hours: "7:00 AM – 6:00 PM",
            days: "Mon – Sat",
            color: "#10B981",
            badge: "Central Branch",
            services: "CBC,Blood Sugar,Lipid Profile,Thyroid,Urine Full,ESR",
            parking: 0,
            ac: 1,
            wifi: 1,
            wait_time: "~20 mins",
            map_url: "https://maps.google.com/?q=Kandy+Sri+Lanka",
          },
          {
            id: 4,
            name: "Kuliyapitiya",
            address: "No. 23, Colombo Road, Kuliyapitiya",
            phone: "+94 37 228 1234",
            hours: "7:00 AM – 5:00 PM",
            days: "Mon – Sat",
            color: "#F59E0B",
            badge: "North Branch",
            services: "CBC,Blood Sugar,Lipid Profile,Urine Full,ESR",
            parking: 1,
            ac: 1,
            wifi: 0,
            wait_time: "~10 mins",
            map_url: "https://maps.google.com/?q=Kuliyapitiya+Sri+Lanka",
          },
          {
            id: 5,
            name: "Nikaweratiya",
            address: "No. 15, Kurunegala Road, Nikaweratiya",
            phone: "+94 37 226 5678",
            hours: "7:30 AM – 4:30 PM",
            days: "Mon – Fri",
            color: "#EC4899",
            badge: "West Branch",
            services: "CBC,Blood Sugar,Urine Full,ESR",
            parking: 0,
            ac: 0,
            wifi: 0,
            wait_time: "~5 mins",
            map_url: "https://maps.google.com/?q=Nikaweratiya+Sri+Lanka",
          },
        ]);
      }
      res.json(result);
    },
  );
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
