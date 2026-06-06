require("dotenv/config");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

function parseDbUrl(url) {
  const clean = url.replace("mysql://", "");
  const atIdx = clean.lastIndexOf("@");
  const creds = clean.substring(0, atIdx);
  const rest = clean.substring(atIdx + 1);
  const colonIdx = creds.indexOf(":");
  const user = creds.substring(0, colonIdx);
  const password = creds.substring(colonIdx + 1);
  const [hostPort, dbPath] = rest.split("/");
  const [host, portStr] = hostPort.split(":");
  return { host, port: parseInt(portStr), user, password, database: dbPath.split("?")[0] };
}

async function seed() {
  const config = parseDbUrl(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({ ...config, ssl: { rejectUnauthorized: false } });
  console.log("Connected to DB");

  // Seed age groups
  const ageGroups = [
    { name: "Child", minAge: 0, maxAge: 12 },
    { name: "Teenager", minAge: 13, maxAge: 19 },
    { name: "Young Adult", minAge: 20, maxAge: 35 },
    { name: "Adult", minAge: 36, maxAge: 60 },
    { name: "Senior", minAge: 61, maxAge: 120 },
  ];

  for (const ag of ageGroups) {
    await conn.execute(
      "INSERT IGNORE INTO age_groups (name, min_age, max_age, price, sort_order) VALUES (?, ?, ?, 0, ?)",
      [ag.name, ag.minAge, ag.maxAge, ageGroups.indexOf(ag) + 1]
    );
  }
  console.log("Age groups seeded");

  // Get age group IDs
  const [groups] = await conn.query("SELECT id, name FROM age_groups ORDER BY sort_order");
  console.log("Groups:", groups);

  // Seed admin
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync("admin123", salt);
  await conn.execute(
    "INSERT IGNORE INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)",
    ["admin", hash, "admin"]
  );
  console.log("Admin seeded");

  // Clear old questions and seed new MCQ questions with options
  await conn.query("DELETE FROM question_options");
  await conn.query("DELETE FROM question_translations");
  await conn.query("DELETE FROM questions");

  const mcqQuestions = [
    // Child (0-12)
    {
      groupIdx: 0,
      title: "What do you like to do most on weekends?",
      desc: "Pick your favorite weekend activity.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Play video games", "Draw or do crafts", "Play sports outside", "Read books or watch movies"],
    },
    {
      groupIdx: 0,
      title: "What is your favorite subject in school?",
      desc: "Choose the subject you enjoy the most.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Math", "Art or Music", "Science", "Physical Education"],
    },
    {
      groupIdx: 0,
      title: "If you could have any superpower, what would it be?",
      desc: "Imagine having one superpower.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Flying", "Invisibility", "Super strength", "Teleportation"],
    },
    // Teenager (13-19)
    {
      groupIdx: 1,
      title: "How do you usually spend your free time?",
      desc: "Pick what you do most often.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Social media and streaming", "Sports or outdoor activities", "Hanging out with friends", "Learning new skills online"],
    },
    {
      groupIdx: 1,
      title: "What is your biggest concern right now?",
      desc: "Choose what worries you most.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["School grades and exams", "Future career path", "Friendships and relationships", "Mental health and well-being"],
    },
    {
      groupIdx: 1,
      title: "What type of music do you listen to most?",
      desc: "Pick your favorite genre.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Pop or K-Pop", "Hip-hop or Rap", "Rock or Alternative", "Electronic or EDM"],
    },
    // Young Adult (20-35)
    {
      groupIdx: 2,
      title: "What matters most to you in a career?",
      desc: "Choose your top priority.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["High salary and benefits", "Work-life balance", "Growth and learning opportunities", "Making a positive impact"],
    },
    {
      groupIdx: 2,
      title: "How do you prefer to socialize?",
      desc: "Pick your preferred way to connect.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Online messaging and social media", "Small gatherings with close friends", "Large parties and events", "One-on-one deep conversations"],
    },
    {
      groupIdx: 2,
      title: "What is your approach to personal finance?",
      desc: "Choose how you handle money.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Save as much as possible", "Invest in stocks and crypto", "Spend on experiences and travel", "Live paycheck to paycheck"],
    },
    // Adult (36-60)
    {
      groupIdx: 3,
      title: "What is your top priority in life right now?",
      desc: "Choose what matters most.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Family and children's future", "Career advancement", "Health and wellness", "Financial security"],
    },
    {
      groupIdx: 3,
      title: "How do you stay informed about the world?",
      desc: "Pick your main news source.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Traditional TV news", "Online news websites", "Social media feeds", "Podcasts and newsletters"],
    },
    {
      groupIdx: 3,
      title: "What do you value most in friendships?",
      desc: "Choose the most important quality.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Loyalty and trust", "Shared interests and hobbies", "Emotional support", "Intellectual stimulation"],
    },
    // Senior (61+)
    {
      groupIdx: 4,
      title: "What brings you the most joy these days?",
      desc: "Pick what makes you happiest.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Time with family and grandchildren", "Pursuing hobbies and interests", "Helping others in the community", "Quiet reflection and peace"],
    },
    {
      groupIdx: 4,
      title: "What life lesson do you wish you learned earlier?",
      desc: "Choose the most important lesson.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Health is more important than wealth", "Relationships matter more than achievements", "It's okay to ask for help", "Change is the only constant"],
    },
    {
      groupIdx: 4,
      title: "How do you view technology today?",
      desc: "Share your perspective.",
      options: ["A", "B", "C", "D"],
      optionTexts: ["Essential and empowering", "Useful but overwhelming", "A barrier between generations", "Something to use sparingly"],
    },
  ];

  for (const q of mcqQuestions) {
    const group = groups[q.groupIdx];
    if (!group) continue;

    const [result] = await conn.execute(
      "INSERT INTO questions (age_group_id, is_active) VALUES (?, true)",
      [group.id]
    );
    const qId = result.insertId;

    // Insert English translation
    await conn.execute(
      "INSERT INTO question_translations (question_id, language_code, title, description) VALUES (?, 'en', ?, ?)",
      [qId, q.title, q.desc]
    );

    // Insert options
    for (let i = 0; i < q.options.length; i++) {
      await conn.execute(
        "INSERT INTO question_options (question_id, option_key, option_text) VALUES (?, ?, ?)",
        [qId, q.options[i], q.optionTexts[i]]
      );
    }
  }
  console.log(`Seeded ${mcqQuestions.length} MCQ questions with options`);

  await conn.end();
  console.log("Seeding complete!");
}

seed().catch((e) => { console.error(e); process.exit(1); });
