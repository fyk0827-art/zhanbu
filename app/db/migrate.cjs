require("dotenv/config");
const mysql = require("mysql2/promise");

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

async function migrate() {
  const config = parseDbUrl(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({ ...config, ssl: { rejectUnauthorized: false } });

  console.log("Connected to DB");

  const [tables] = await conn.query("SHOW TABLES");
  const tableNames = tables.map((t) => Object.values(t)[0]);

  // Create question_options
  if (!tableNames.includes("question_options")) {
    await conn.query(`
      CREATE TABLE question_options (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        question_id BIGINT UNSIGNED NOT NULL,
        option_key CHAR(1) NOT NULL,
        option_text VARCHAR(255) NOT NULL,
        UNIQUE KEY idx_qo_question_key (question_id, option_key)
      )
    `);
    console.log("Created question_options table");
  } else {
    console.log("question_options already exists");
  }

  // Check answers columns
  const [cols] = await conn.query("DESCRIBE answers");
  const colNames = cols.map((c) => c.Field);
  console.log("Answers columns:", colNames);

  // Drop old columns
  for (const col of ["respondent_name", "respondent_email", "content", "payment_token"]) {
    if (colNames.includes(col)) {
      await conn.query(`ALTER TABLE answers DROP COLUMN ${col}`);
      console.log(`Dropped: ${col}`);
    }
  }

  // Add selected_option
  if (!colNames.includes("selected_option")) {
    await conn.query(`ALTER TABLE answers ADD COLUMN selected_option CHAR(1) NOT NULL DEFAULT 'A'`);
    console.log("Added: selected_option");
  }

  // Truncate old answers
  await conn.query("TRUNCATE TABLE answers");
  console.log("Truncated old answers");

  await conn.end();
  console.log("Migration complete!");
}

migrate().catch((e) => { console.error(e); process.exit(1); });
