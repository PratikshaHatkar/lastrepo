

// 1 search admin by city works sigup work 
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use("/", router);
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Pratiksha@123",
  database: "mini",
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL Connected!");
});

// ✅ Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

// ✅ SIGNUP API
app.post("/signup", async (req, res) => {
  const { role, name, email, password, address, city, phone } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const table = role === "admin" ? "admin" : "users";
  const sql = `INSERT INTO ${table} (name, email, password, address, city, phone) VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [name, email, hashedPassword, address, city, phone], (err) => {
    if (err) {
      console.error("❌ Signup Error:", err);
      return res.status(500).json({ message: "Signup failed" });
    }
    res.json({ message: `${role} registered successfully!` });
  });
});

// ✅ LOGIN API
app.post("/login", (req, res) => {
  const { role, email, password } = req.body;
  const table = role === "admin" ? "admin" : "users";

  db.query(`SELECT * FROM ${table} WHERE email = ?`, [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.length === 0) return res.status(400).json({ message: "User not found" });

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    res.json({
      message: `${role} logged in successfully!`,
      role,
      user: {
        id: user.user_id || user.admin_id,
        name: user.name,
        email: user.email,
      },
    });
  });
});



//search medicines;
app.get("/api/medicines/admin/:adminId", (req, res) => {
  const adminId = req.params.adminId;

  const query = `
    SELECT 
      m.medicine_id,
      m.name AS medicine_name,
      m.usage_info AS use_info,
      GROUP_CONCAT(DISTINCT comp.ingredient ORDER BY comp.ingredient SEPARATOR ', ') AS composition,
      c.company_name,
      am.stock_status AS stock,
      m.image_path
    FROM admin_medicines am
    JOIN medicines m ON am.medicine_id = m.medicine_id
    JOIN company_master c ON m.company_id = c.company_id
    LEFT JOIN composition comp ON m.medicine_id = comp.medicine_id
    WHERE am.admin_id = ?
    GROUP BY m.medicine_id;
  `;

  db.query(query, [adminId], (err, results) => {
    if (err) {
      console.log("🔴 SQL Error:", err);  // <---- ADD THIS
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});






// ✅ Get Admins by User City
app.get("/api/admins/:city", (req, res) => {
  const city = req.params.city;
  const query = `
    SELECT admin_id, name, email, address, city, phone 
    FROM admin 
    WHERE city = ?;
  `;
  db.query(query, [city], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// ✅ Get Medicines for Selected Admin
app.get("/api/medicines/admin/:adminId", (req, res) => {
  const adminId = req.params.adminId;

  const query = `
    SELECT 
      m.medicine_id,
      m.name AS medicine_name,
      m.usage_info AS use_info,
      GROUP_CONCAT(DISTINCT comp.ingredient SEPARATOR ', ') AS composition,
      m.stock,
      c.company_name,
      m.image_path
    FROM medicines m
    JOIN company_master c ON m.company_id = c.company_id
    LEFT JOIN composition comp ON m.medicine_id = comp.medicine_id
    WHERE m.admin_id = ?
    GROUP BY m.medicine_id;
  `;

  db.query(query, [adminId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ Symptom / Medicine Search API
router.get("/api/medicines", async (req, res) => {
  const keyword = req.query.symptom;
  const query = `
    SELECT 
      s.name AS symptom, 
      m.name AS medicine_name, 
      m.usage_info, 
      c.company_name, 
      GROUP_CONCAT(DISTINCT comp.ingredient SEPARATOR ', ') AS ingredients, 
      m.image_path 
    FROM symptoms s 
    JOIN symptoms_medicine sm ON s.symptom_id = sm.symptom_id 
    JOIN medicines m ON sm.medicine_id = m.medicine_id 
    JOIN company_master c ON m.company_id = c.company_id 
    JOIN composition comp ON m.medicine_id = comp.medicine_id 
    WHERE s.name LIKE ? OR m.name LIKE ? OR c.company_name LIKE ? 
    GROUP BY m.medicine_id, s.name;
  `;

  db.query(query, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});


// ===================== ✅ NEWLY ADDED DASHBOARD ROUTES =====================

// ✅ Fetch Admins dynamically (Dashboard)
app.get("/api/dashboard/admins/:city", (req, res) => {
  const city = req.params.city;
  const query = `
    SELECT admin_id, name, email, address, city, phone 
    FROM admin 
    WHERE city = ?;
  `;
  db.query(query, [city], (err, results) => {
    if (err) {
      console.error("Dashboard Admin Fetch Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// ✅ Fetch Medicines dynamically for selected admin (Dashboard)
app.get("/api/dashboard/medicines/admin/:adminId", (req, res) => {
  const adminId = req.params.adminId;

  const query = `
    SELECT 
      m.medicine_id,
      m.name AS medicine_name,
      m.usage_info AS use_info,
      GROUP_CONCAT(DISTINCT comp.ingredient SEPARATOR ', ') AS composition,
      m.stock,
      c.company_name,
      m.image_path
    FROM medicines m
    JOIN company_master c ON m.company_id = c.company_id
    LEFT JOIN composition comp ON m.medicine_id = comp.medicine_id
    WHERE m.admin_id = ?
    GROUP BY m.medicine_id;
  `;

  db.query(query, [adminId], (err, results) => {
    if (err) {
      console.error("Dashboard Medicine Fetch Error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// ✅ Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));




















