import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

function parseDbUrl(url: string) {
  const cleanUrl = url.replace("mysql://", "");
  const atIndex = cleanUrl.lastIndexOf("@");
  const credentials = cleanUrl.substring(0, atIndex);
  const rest = cleanUrl.substring(atIndex + 1);
  const colonIndex = credentials.indexOf(":");
  const user = credentials.substring(0, colonIndex);
  const password = credentials.substring(colonIndex + 1);
  const [hostPort, database] = rest.split("/");
  const [host, portStr] = hostPort.split(":");
  return { host, port: parseInt(portStr), user, password, database: database.split("?")[0] };
}

const dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl) {
  console.error("DATABASE_URL is not set!");
  process.exit(1);
}

const config2 = parseDbUrl(dbUrl);

const pool = mysql.createPool({
  host: config2.host,
  port: config2.port,
  user: config2.user,
  password: config2.password,
  database: config2.database,
  ssl: { rejectUnauthorized: false },
  connectTimeout: 15000,
  waitForConnections: true,
  connectionLimit: 5,
});

const db = drizzle(pool, { schema, mode: "planetscale" });

async function seed() {
  console.log("Seeding database...");

  const unifiedPrice = "9.99";
  const ageGroupsData = [
    { name: "Child", minAge: 0, maxAge: 12, price: unifiedPrice, sortOrder: 1 },
    { name: "Teenager", minAge: 13, maxAge: 19, price: unifiedPrice, sortOrder: 2 },
    { name: "Young Adult", minAge: 20, maxAge: 35, price: unifiedPrice, sortOrder: 3 },
    { name: "Adult", minAge: 36, maxAge: 60, price: unifiedPrice, sortOrder: 4 },
    { name: "Senior", minAge: 61, maxAge: 120, price: unifiedPrice, sortOrder: 5 },
  ];

  for (const ag of ageGroupsData) {
    await db.insert(schema.ageGroups).values(ag).onDuplicateKeyUpdate({
      set: { price: ag.price, sortOrder: ag.sortOrder },
    });
  }
  console.log("Age groups seeded.");

  const groups = await db.select().from(schema.ageGroups).orderBy(schema.ageGroups.sortOrder);
  if (groups.length === 0) {
    console.log("No age groups found!");
    await pool.end();
    return;
  }
  console.log(`Found ${groups.length} age groups.`);

  const questionsData = [
    {
      ageGroupId: groups[0].id,
      translations: [
        { languageCode: "en", title: "What is your favorite hobby?", description: "Tell us about the activities you enjoy doing in your free time. Do you like drawing, playing sports, reading books, or something else?" },
        { languageCode: "zh", title: "你最喜欢的爱好是什么？", description: "告诉我们你在空闲时间喜欢做什么活动。你喜欢画画、运动、读书还是其他什么？" },
        { languageCode: "es", title: "¿Cuál es tu pasatiempo favorito?", description: "Cuéntanos sobre las actividades que disfrutas hacer en tu tiempo libre." },
        { languageCode: "fr", title: "Quel est ton passe-temps préféré ?", description: "Parle-nous des activités que tu aimes faire pendant ton temps libre." },
      ],
    },
    {
      ageGroupId: groups[0].id,
      translations: [
        { languageCode: "en", title: "What do you want to be when you grow up?", description: "Share your dream job or career. Why does it excite you?" },
        { languageCode: "zh", title: "你长大后想成为什么？", description: "分享你梦想的工作或职业。为什么它让你感到兴奋？" },
        { languageCode: "es", title: "¿Qué quieres ser cuando seas grande?", description: "Comparte tu trabajo o carrera soñados. ¿Por qué te emociona?" },
        { languageCode: "fr", title: "Que veux-tu faire quand tu seras grand ?", description: "Partage ton métier ou carrière de rêve. Pourquoi t'enthousiasme-t-il ?" },
      ],
    },
    {
      ageGroupId: groups[1].id,
      translations: [
        { languageCode: "en", title: "What challenges do teenagers face today?", description: "Share your thoughts on the biggest challenges that young people deal with in the modern world." },
        { languageCode: "zh", title: "当今青少年面临哪些挑战？", description: "分享你对年轻人在现代社会中面临的最大挑战的看法。" },
        { languageCode: "es", title: "¿Qué desafíos enfrentan los adolescentes hoy?", description: "Comparte tus pensamores sobre los mayores desafíos que enfrentan los jóvenes." },
        { languageCode: "fr", title: "Quels défis les adolescents affrontent-ils aujourd'hui ?", description: "Partage tes réflexions sur les plus grands défis auxquels les jeunes sont confrontés." },
      ],
    },
    {
      ageGroupId: groups[1].id,
      translations: [
        { languageCode: "en", title: "How do you manage school stress?", description: "Describe your strategies for handling academic pressure and maintaining balance in life." },
        { languageCode: "zh", title: "你如何管理学业压力？", description: "描述你应对学业压力和保持生活平衡的策略。" },
        { languageCode: "es", title: "¿Cómo manejas el estrés escolar?", description: "Describe tus estrategias para manejar la presión académica y mantener el equilibrio." },
        { languageCode: "fr", title: "Comment gères-tu le stress scolaire ?", description: "Décris tes stratégies pour gérer la pression académique et maintenir l'équilibre." },
      ],
    },
    {
      ageGroupId: groups[2].id,
      translations: [
        { languageCode: "en", title: "What skills are essential for career success?", description: "Share the skills and habits you believe are most important for building a successful career." },
        { languageCode: "zh", title: "哪些技能对职业成功至关重要？", description: "分享你认为对建立成功职业最重要的技能和习惯。" },
        { languageCode: "es", title: "¿Qué habilidades son esenciales para el éxito profesional?", description: "Comparte las habilidades y hábitos que crees más importantes para una carrera exitosa." },
        { languageCode: "fr", title: "Quelles compétences sont essentielles pour réussir sa carrière ?", description: "Partage les compétences et habitudes que tu juges les plus importantes." },
      ],
    },
    {
      ageGroupId: groups[2].id,
      translations: [
        { languageCode: "en", title: "How do you maintain work-life balance?", description: "Describe how you balance professional responsibilities with personal life and relationships." },
        { languageCode: "zh", title: "你如何保持工作与生活的平衡？", description: "描述你如何平衡职业责任与个人生活和关系。" },
        { languageCode: "es", title: "¿Cómo mantienes el equilibrio trabajo-vida?", description: "Describe cómo equilibras las responsabilidades profesionales con la vida personal." },
        { languageCode: "fr", title: "Comment maintiens-tu l'équilibre travail-vie ?", description: "Décris comment tu équilibres responsabilités professionnelles et vie personnelle." },
      ],
    },
    {
      ageGroupId: groups[3].id,
      translations: [
        { languageCode: "en", title: "What financial advice would you give to younger people?", description: "Share your wisdom about money management, savings, investments, and financial planning." },
        { languageCode: "zh", title: "你会给年轻人什么财务建议？", description: "分享你关于理财、储蓄、投资和财务规划的智慧。" },
        { languageCode: "es", title: "¿Qué consejo financiero darías a los jóvenes?", description: "Comparte tu sabiduría sobre gestión del dinero, ahorro, inversiones y planificación financiera." },
        { languageCode: "fr", title: "Quels conseils financiers donnerais-tu aux jeunes ?", description: "Partage ta sagesse sur la gestion de l'argent, l'épargne, les investissements." },
      ],
    },
    {
      ageGroupId: groups[3].id,
      translations: [
        { languageCode: "en", title: "How has technology changed your life?", description: "Reflect on how digital transformation has impacted your work, relationships, and daily routines." },
        { languageCode: "zh", title: "科技如何改变了你的生活？", description: "反思数字化转型如何影响你的工作、关系和日常生活。" },
        { languageCode: "es", title: "¿Cómo ha cambiado la tecnología tu vida?", description: "Reflexiona sobre cómo la transformación digital ha impactado tu trabajo y relaciones." },
        { languageCode: "fr", title: "Comment la technologie a-t-elle changé ta vie ?", description: "Réfléchis à l'impact de la transformation numérique sur ton travail et tes relations." },
      ],
    },
    {
      ageGroupId: groups[4].id,
      translations: [
        { languageCode: "en", title: "What life lesson do you value most?", description: "Share the most important wisdom or lesson you have learned throughout your life journey." },
        { languageCode: "zh", title: "你最珍视的人生教训是什么？", description: "分享你在人生旅途中学到的最重要的智慧或教训。" },
        { languageCode: "es", title: "¿Qué lección de vida valoras más?", description: "Comparte la sabiduría o lección más importante que has aprendido en tu vida." },
        { languageCode: "fr", title: "Quelle leçon de vie apprécies-tu le plus ?", description: "Partage la sagesse ou leçon la plus importante que tu as apprise au cours de ta vie." },
      ],
    },
    {
      ageGroupId: groups[4].id,
      translations: [
        { languageCode: "en", title: "What changes in the world have surprised you most?", description: "Describe the societal, technological, or cultural changes that have amazed or surprised you." },
        { languageCode: "zh", title: "世界上哪些变化最让你惊讶？", description: "描述那些让你感到惊奇或惊讶的社会、技术或文化变化。" },
        { languageCode: "es", title: "¿Qué cambios en el mundo te han sorprendido más?", description: "Describe los cambios sociales, tecnológicos o culturales que te han asombrado." },
        { languageCode: "fr", title: "Quels changements dans le monde t'ont le plus surpris ?", description: "Décris les changements sociétaux, technologiques ou culturels qui t'ont étonné." },
      ],
    },
  ];

  for (const q of questionsData) {
    const [inserted] = await db.insert(schema.questions).values({
      ageGroupId: q.ageGroupId,
      isActive: true,
    });

    for (const trans of q.translations) {
      await db.insert(schema.questionTranslations).values({
        questionId: Number(inserted.insertId),
        languageCode: trans.languageCode,
        title: trans.title,
        description: trans.description,
      });
    }
  }
  console.log("Questions seeded.");

  await pool.end();
  console.log("Seeding complete!");
}

seed().catch(console.error);
