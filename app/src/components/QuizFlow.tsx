import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, ArrowRight, Check, Sparkles, Loader2, Lock, CreditCard } from "lucide-react";
import { questionApi, paymentApi, settingsApi } from "@/services/api";
import type { QuestionDTO, SubmitAnswerRequest } from "@/types/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { normalizeLanguage } from "@/i18n";
import { firePurchaseEvent, getFbc, getFbp } from "@/services/facebookPixel";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: Record<string, string>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (err: unknown) => void;
      }) => { render: (selector: string) => Promise<void> };
    };
  }
}

interface AgeGroup {
  id: number;
  name: string;
  minAge: number;
  maxAge: number;
  price: number;
}

interface QuizFlowProps {
  ageGroups: AgeGroup[];
  onClose: () => void;
}

type QuizStep = "intro" | "age" | "answering" | "result" | "paying";

const OPT_COLORS: Record<string, { bg: string; active: string }> = {
  A: { bg: "bg-[#E07A5F]/10", active: "bg-[#E07A5F] text-white border-[#E07A5F]" },
  B: { bg: "bg-[#81B29A]/10", active: "bg-[#81B29A] text-white border-[#81B29A]" },
  C: { bg: "bg-[#3D8DA8]/10", active: "bg-[#3D8DA8] text-white border-[#3D8DA8]" },
  D: { bg: "bg-[#E8C547]/10", active: "bg-[#E8C547] text-white border-[#E8C547]" },
};

const QUIZ_COPY: Record<string, Record<string, string>> = {
  en: {
    quizWelcomeTitle: "Welcome to the Q&A Test!",
    quizWelcomeDesc: "We'll ask your age first, then give you questions matched to your age group.",
    quizQuestionCountHint: "You will answer {{count}} questions matched to your age group.",
    unlockFee: "Unlock full results for a small fee after completing",
    startTest: "Start Test",
    quizSkip: "Skip and browse all questions",
    howOldAreYou: "How old are you?",
    ageHelpText: "Enter your age so we can match the right questions.",
    enterAge: "Enter age",
    continue: "Continue",
    invalidAge: "Please enter a valid age between 0 and 120",
    noAgeGroupMatch: "Could not determine age group",
    questionProgress: "Question {{current}} of {{total}}",
    previous: "Previous",
    next: "Next",
    viewResults: "View Results",
    noQuestionsAvailable: "No questions available for this age group.",
    goBack: "Go back",
    answersSaved: "All Answers Saved!",
    resultPreviewDesc: "You answered {{count}} questions. Unlock your full report to see detailed insights.",
    yourSelections: "Your Selections",
    unlockFullReport: "Unlock Full Report",
    paypalPaymentHint: "PayPal payment is captured securely before opening the report page.",
    paypalNotConfigured: "PayPal client id is not configured.",
    redirectingToReport: "Redirecting to report page...",
    paymentFailed: "Payment failed. Please try again.",
    partnerConfirmFailed: "Failed to confirm payment with report platform. Please try again.",
  },
  zh: {
    quizWelcomeTitle: "欢迎来到问答测试！",
    quizWelcomeDesc: "我们先询问你的年龄，然后为你匹配适合的问题。",
    quizQuestionCountHint: "你将回答 {{count}} 道与年龄段匹配的题目。",
    unlockFee: "完成后支付少量费用即可解锁完整结果",
    startTest: "开始测试",
    quizSkip: "跳过，浏览所有问题",
    howOldAreYou: "你今年几岁？",
    ageHelpText: "输入年龄，我们会匹配适合的问题。",
    enterAge: "输入年龄",
    continue: "继续",
    invalidAge: "请输入 0 到 120 之间的有效年龄",
    noAgeGroupMatch: "无法确定年龄组",
    questionProgress: "问题 {{current}} / {{total}}",
    previous: "上一题",
    next: "下一题",
    viewResults: "查看结果",
    noQuestionsAvailable: "该年龄段暂无问题。",
    goBack: "返回",
    answersSaved: "答案已保存！",
    resultPreviewDesc: "你回答了 {{count}} 道题。解锁完整报告查看详细分析。",
    yourSelections: "你的选择",
    unlockFullReport: "解锁完整报告",
    paypalPaymentHint: "PayPal 支付完成后将安全打开报告页面。",
    paypalNotConfigured: "PayPal Client ID 尚未配置。",
    redirectingToReport: "正在跳转到报告页面...",
    paymentFailed: "支付失败，请重试。",
    partnerConfirmFailed: "报告平台确认支付失败，请重试。",
  },
  es: {
    quizWelcomeTitle: "¡Bienvenido al test de preguntas!",
    quizWelcomeDesc: "Primero preguntaremos tu edad y luego te daremos preguntas para tu grupo.",
    quizQuestionCountHint: "Responderás {{count}} preguntas para tu grupo de edad.",
    unlockFee: "Desbloquea el informe completo por una pequeña tarifa al terminar",
    startTest: "Comenzar test",
    quizSkip: "Saltar y explorar preguntas",
    howOldAreYou: "¿Cuántos años tienes?",
    ageHelpText: "Introduce tu edad para asignarte las preguntas correctas.",
    enterAge: "Introduce la edad",
    continue: "Continuar",
    invalidAge: "Introduce una edad válida entre 0 y 120",
    noAgeGroupMatch: "No se pudo determinar el grupo de edad",
    questionProgress: "Pregunta {{current}} de {{total}}",
    previous: "Anterior",
    next: "Siguiente",
    viewResults: "Ver resultados",
    noQuestionsAvailable: "No hay preguntas para este grupo de edad.",
    goBack: "Volver",
    answersSaved: "¡Respuestas guardadas!",
    resultPreviewDesc: "Respondiste {{count}} preguntas. Desbloquea el informe completo para ver el análisis.",
    yourSelections: "Tus elecciones",
    unlockFullReport: "Desbloquear informe completo",
    paypalPaymentHint: "El pago con PayPal se confirma de forma segura antes de abrir el informe.",
    paypalNotConfigured: "El Client ID de PayPal no está configurado.",
    redirectingToReport: "Redirigiendo al informe...",
    paymentFailed: "El pago falló. Inténtalo de nuevo.",
    partnerConfirmFailed: "No se pudo confirmar el pago con la plataforma de informes.",
  },
  fr: {
    quizWelcomeTitle: "Bienvenue dans le test Q&R !",
    quizWelcomeDesc: "Nous demandons d'abord ton âge, puis nous proposons des questions adaptées.",
    quizQuestionCountHint: "Tu répondras à {{count}} questions adaptées à ton âge.",
    unlockFee: "Débloque le rapport complet pour une petite somme après avoir terminé",
    startTest: "Commencer le test",
    quizSkip: "Passer et parcourir",
    howOldAreYou: "Quel âge as-tu ?",
    ageHelpText: "Indique ton âge pour recevoir les bonnes questions.",
    enterAge: "Indique l'âge",
    continue: "Continuer",
    invalidAge: "Veuillez saisir un âge valide entre 0 et 120",
    noAgeGroupMatch: "Impossible de déterminer le groupe d'âge",
    questionProgress: "Question {{current}} sur {{total}}",
    previous: "Précédent",
    next: "Suivant",
    viewResults: "Voir les résultats",
    noQuestionsAvailable: "Aucune question disponible pour ce groupe d'âge.",
    goBack: "Retour",
    answersSaved: "Réponses enregistrées !",
    resultPreviewDesc: "Tu as répondu à {{count}} questions. Débloque le rapport complet pour voir l'analyse.",
    yourSelections: "Tes choix",
    unlockFullReport: "Débloquer le rapport complet",
    paypalPaymentHint: "Le paiement PayPal est confirmé en toute sécurité avant l'ouverture du rapport.",
    paypalNotConfigured: "Le Client ID PayPal n'est pas configuré.",
    redirectingToReport: "Redirection vers le rapport...",
    paymentFailed: "Le paiement a échoué. Réessaie.",
    partnerConfirmFailed: "La confirmation du paiement auprès de la plateforme de rapport a échoué.",
  },
  de: {
    quizWelcomeTitle: "Willkommen beim Q&A-Test!",
    quizWelcomeDesc: "Wir fragen zuerst nach deinem Alter und zeigen passende Fragen.",
    quizQuestionCountHint: "Du beantwortest {{count}} Fragen passend zu deiner Altersgruppe.",
    unlockFee: "Schalte den vollständigen Bericht nach Abschluss gegen eine kleine Gebühr frei",
    startTest: "Test starten",
    quizSkip: "Überspringen und Fragen ansehen",
    howOldAreYou: "Wie alt bist du?",
    ageHelpText: "Gib dein Alter ein, damit wir passende Fragen auswählen.",
    enterAge: "Alter eingeben",
    continue: "Weiter",
    invalidAge: "Bitte gib ein gültiges Alter zwischen 0 und 120 ein",
    noAgeGroupMatch: "Altersgruppe konnte nicht bestimmt werden",
    questionProgress: "Frage {{current}} von {{total}}",
    previous: "Zurück",
    next: "Weiter",
    viewResults: "Ergebnisse ansehen",
    noQuestionsAvailable: "Für diese Altersgruppe sind keine Fragen verfügbar.",
    goBack: "Zurück",
    answersSaved: "Antworten gespeichert!",
    resultPreviewDesc: "Du hast {{count}} Fragen beantwortet. Schalte den vollständigen Bericht für Details frei.",
    yourSelections: "Deine Auswahl",
    unlockFullReport: "Vollständigen Bericht freischalten",
    paypalPaymentHint: "Die PayPal-Zahlung wird sicher bestätigt, bevor der Bericht geöffnet wird.",
    paypalNotConfigured: "PayPal Client ID ist nicht konfiguriert.",
    redirectingToReport: "Weiterleitung zum Bericht...",
    paymentFailed: "Zahlung fehlgeschlagen. Bitte erneut versuchen.",
    partnerConfirmFailed: "Zahlung konnte bei der Berichtplattform nicht bestätigt werden.",
  },
  ja: {
    quizWelcomeTitle: "Q&Aテストへようこそ！",
    quizWelcomeDesc: "まず年齢を伺い、年齢層に合った質問を表示します。",
    quizQuestionCountHint: "年齢層に合った {{count}} 問に答えます。",
    unlockFee: "完了後、少額の料金で完全な結果を解放できます",
    startTest: "テスト開始",
    quizSkip: "スキップして閲覧",
    howOldAreYou: "何歳ですか？",
    ageHelpText: "年齢を入力すると適切な質問を選びます。",
    enterAge: "年齢を入力",
    continue: "続ける",
    invalidAge: "0〜120の有効な年齢を入力してください",
    noAgeGroupMatch: "年齢層を判定できませんでした",
    questionProgress: "質問 {{current}} / {{total}}",
    previous: "前へ",
    next: "次へ",
    viewResults: "結果を見る",
    noQuestionsAvailable: "この年齢層の質問はありません。",
    goBack: "戻る",
    answersSaved: "回答を保存しました！",
    resultPreviewDesc: "{{count}} 問に回答しました。完全なレポートを解放して詳細を確認できます。",
    yourSelections: "あなたの選択",
    unlockFullReport: "完全なレポートを解放",
    paypalPaymentHint: "PayPal決済を安全に確認してからレポートを開きます。",
    paypalNotConfigured: "PayPal Client ID が設定されていません。",
    redirectingToReport: "レポートページへ移動中...",
    paymentFailed: "支払いに失敗しました。もう一度お試しください。",
    partnerConfirmFailed: "レポート平台で支払いを確認できませんでした。",
  },
  ko: {
    quizWelcomeTitle: "Q&A 테스트에 오신 것을 환영합니다!",
    quizWelcomeDesc: "먼저 나이를 묻고, 연령대에 맞는 질문을 보여드립니다.",
    quizQuestionCountHint: "연령대에 맞는 질문 {{count}}개에 답합니다.",
    unlockFee: "완료 후 소액 결제로 전체 결과를 열 수 있습니다",
    startTest: "테스트 시작",
    quizSkip: "건너뛰고 둘러보기",
    howOldAreYou: "몇 살인가요?",
    ageHelpText: "나이를 입력하면 맞는 질문을 골라드립니다.",
    enterAge: "나이 입력",
    continue: "계속",
    invalidAge: "0부터 120 사이의 올바른 나이를 입력하세요",
    noAgeGroupMatch: "연령대를 확인할 수 없습니다",
    questionProgress: "질문 {{current}} / {{total}}",
    previous: "이전",
    next: "다음",
    viewResults: "결과 보기",
    noQuestionsAvailable: "이 연령대에는 질문이 없습니다.",
    goBack: "돌아가기",
    answersSaved: "답변이 저장되었습니다!",
    resultPreviewDesc: "{{count}}개 질문에 답했습니다. 전체 보고서를 열어 자세한 분석을 확인하세요.",
    yourSelections: "선택한 답변",
    unlockFullReport: "전체 보고서 열기",
    paypalPaymentHint: "PayPal 결제를 안전하게 확인한 뒤 보고서 페이지를 엽니다.",
    paypalNotConfigured: "PayPal Client ID가 설정되지 않았습니다.",
    redirectingToReport: "보고서 페이지로 이동 중...",
    paymentFailed: "결제에 실패했습니다. 다시 시도하세요.",
    partnerConfirmFailed: "보고서 플랫폼에서 결제를 확인하지 못했습니다.",
  },
  pt: {
    quizWelcomeTitle: "Bem-vindo ao teste de perguntas!",
    quizWelcomeDesc: "Primeiro perguntamos sua idade e depois mostramos perguntas adequadas.",
    quizQuestionCountHint: "Você responderá {{count}} perguntas para sua faixa etária.",
    unlockFee: "Desbloqueie o relatório completo por uma pequena taxa ao terminar",
    startTest: "Iniciar teste",
    quizSkip: "Pular e explorar",
    howOldAreYou: "Quantos anos você tem?",
    ageHelpText: "Digite sua idade para receber as perguntas certas.",
    enterAge: "Digite a idade",
    continue: "Continuar",
    invalidAge: "Digite uma idade válida entre 0 e 120",
    noAgeGroupMatch: "Não foi possível determinar a faixa etária",
    questionProgress: "Pergunta {{current}} de {{total}}",
    previous: "Anterior",
    next: "Próxima",
    viewResults: "Ver resultados",
    noQuestionsAvailable: "Não há perguntas para esta faixa etária.",
    goBack: "Voltar",
    answersSaved: "Respostas salvas!",
    resultPreviewDesc: "Você respondeu {{count}} perguntas. Desbloqueie o relatório completo para ver a análise.",
    yourSelections: "Suas escolhas",
    unlockFullReport: "Desbloquear relatório completo",
    paypalPaymentHint: "O pagamento PayPal é confirmado com segurança antes de abrir o relatório.",
    paypalNotConfigured: "O Client ID do PayPal não está configurado.",
    redirectingToReport: "Redirecionando para o relatório...",
    paymentFailed: "O pagamento falhou. Tente novamente.",
    partnerConfirmFailed: "Falha ao confirmar o pagamento com a plataforma de relatório.",
  },
  ru: {
    quizWelcomeTitle: "Добро пожаловать в Q&A-тест!",
    quizWelcomeDesc: "Сначала мы спросим ваш возраст, затем покажем подходящие вопросы.",
    quizQuestionCountHint: "Вы ответите на {{count}} вопросов для вашей возрастной группы.",
    unlockFee: "После завершения откройте полный отчет за небольшую плату",
    startTest: "Начать тест",
    quizSkip: "Пропустить и просмотреть",
    howOldAreYou: "Сколько вам лет?",
    ageHelpText: "Введите возраст, чтобы мы подобрали вопросы.",
    enterAge: "Введите возраст",
    continue: "Продолжить",
    invalidAge: "Введите корректный возраст от 0 до 120",
    noAgeGroupMatch: "Не удалось определить возрастную группу",
    questionProgress: "Вопрос {{current}} из {{total}}",
    previous: "Назад",
    next: "Далее",
    viewResults: "Показать результаты",
    noQuestionsAvailable: "Для этой возрастной группы нет вопросов.",
    goBack: "Назад",
    answersSaved: "Ответы сохранены!",
    resultPreviewDesc: "Вы ответили на {{count}} вопросов. Откройте полный отчет для подробного анализа.",
    yourSelections: "Ваш выбор",
    unlockFullReport: "Открыть полный отчет",
    paypalPaymentHint: "Оплата PayPal безопасно подтверждается перед открытием отчета.",
    paypalNotConfigured: "PayPal Client ID не настроен.",
    redirectingToReport: "Переход к отчету...",
    paymentFailed: "Оплата не удалась. Повторите попытку.",
    partnerConfirmFailed: "Не удалось подтвердить оплату на платформе отчетов.",
  },
  ar: {
    quizWelcomeTitle: "مرحباً بك في اختبار الأسئلة!",
    quizWelcomeDesc: "سنسأل عن عمرك أولاً، ثم نعرض أسئلة مناسبة لفئتك العمرية.",
    quizQuestionCountHint: "ستجيب عن {{count}} أسئلة مناسبة لفئتك العمرية.",
    unlockFee: "افتح التقرير الكامل مقابل رسوم صغيرة بعد الانتهاء",
    startTest: "ابدأ الاختبار",
    quizSkip: "تخطي وتصفح الأسئلة",
    howOldAreYou: "كم عمرك؟",
    ageHelpText: "أدخل عمرك لنختار الأسئلة المناسبة.",
    enterAge: "أدخل العمر",
    continue: "متابعة",
    invalidAge: "يرجى إدخال عمر صالح بين 0 و120",
    noAgeGroupMatch: "تعذر تحديد الفئة العمرية",
    questionProgress: "السؤال {{current}} من {{total}}",
    previous: "السابق",
    next: "التالي",
    viewResults: "عرض النتائج",
    noQuestionsAvailable: "لا توجد أسئلة لهذه الفئة العمرية.",
    goBack: "رجوع",
    answersSaved: "تم حفظ الإجابات!",
    resultPreviewDesc: "أجبت عن {{count}} أسئلة. افتح التقرير الكامل لمشاهدة التحليل.",
    yourSelections: "اختياراتك",
    unlockFullReport: "فتح التقرير الكامل",
    paypalPaymentHint: "يتم تأكيد دفع PayPal بأمان قبل فتح صفحة التقرير.",
    paypalNotConfigured: "لم يتم إعداد PayPal Client ID.",
    redirectingToReport: "جارٍ الانتقال إلى التقرير...",
    paymentFailed: "فشل الدفع. يرجى المحاولة مرة أخرى.",
    partnerConfirmFailed: "فشل تأكيد الدفع مع منصة التقرير.",
  },
};

export default function QuizFlow({ ageGroups, onClose }: QuizFlowProps) {
  const { i18n } = useTranslation();
  const lang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const qc = (key: string, values?: Record<string, string | number>) => {
    let text = QUIZ_COPY[lang]?.[key] || QUIZ_COPY.en[key] || key;
    Object.entries(values || {}).forEach(([name, value]) => {
      text = text.replaceAll(`{{${name}}}`, String(value));
    });
    return text;
  };
  const ageGroupName = (group?: AgeGroup | null) => {
    if (!group) return "";
    const key = `${group.minAge}-${group.maxAge}`;
    const names: Record<string, Record<string, string>> = {
      "3-12": { en: "Children", zh: "儿童", es: "Niños", fr: "Enfants", ja: "子ども", de: "Kinder", ko: "어린이", pt: "Crianças", ru: "Дети", ar: "الأطفال" },
      "13-17": { en: "Teenagers", zh: "青少年", es: "Adolescentes", fr: "Adolescents", ja: "10代", de: "Teenager", ko: "청소년", pt: "Adolescentes", ru: "Подростки", ar: "المراهقون" },
      "18-25": { en: "Young Adults", zh: "青年", es: "Jóvenes adultos", fr: "Jeunes adultes", ja: "若年成人", de: "Junge Erwachsene", ko: "청년", pt: "Jovens adultos", ru: "Молодые взрослые", ar: "الشباب" },
      "26-40": { en: "Adults", zh: "成年人", es: "Adultos", fr: "Adultes", ja: "成人", de: "Erwachsene", ko: "성인", pt: "Adultos", ru: "Взрослые", ar: "البالغون" },
      "41-60": { en: "Middle-aged", zh: "中年", es: "Mediana edad", fr: "Âge moyen", ja: "中年", de: "Mittleres Alter", ko: "중년", pt: "Meia-idade", ru: "Средний возраст", ar: "منتصف العمر" },
      "60-120": { en: "Seniors", zh: "老年", es: "Mayores", fr: "Seniors", ja: "シニア", de: "Senioren", ko: "노년", pt: "Idosos", ru: "Пожилые", ar: "كبار السن" },
    };
    const label = names[key]?.[lang] || names[key]?.en || group.name;
    return `${label} (${group.minAge}-${group.maxAge})`;
  };
  const [step, setStep] = useState<QuizStep>("intro");
  const [userAge, setUserAge] = useState("");
  const [ageError, setAgeError] = useState("");
  const [matchedGroup, setMatchedGroup] = useState<AgeGroup | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [paymentError, setPaymentError] = useState("");
  const [startingPayment, setStartingPayment] = useState(false);
  const [completingPayment, setCompletingPayment] = useState(false);
  const paypalTradeNoRef = useRef("");

  const { data: publicSettings } = useQuery({
    queryKey: ["publicSettings"],
    queryFn: settingsApi.getPublic,
  });

  const { data: paymentConfig } = useQuery({
    queryKey: ["paymentConfig"],
    queryFn: paymentApi.config,
  });

  const questionCount = publicSettings?.quizQuestionCount ?? 5;

  const { data: fetchedQuestions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions", matchedGroup?.id, lang, questionCount],
    queryFn: () =>
      matchedGroup
        ? questionApi.list(matchedGroup.id, lang)
        : Promise.resolve([] as QuestionDTO[]),
    enabled: !!matchedGroup && step === "answering",
  });

  const submitAnswerMutation = useMutation({
    mutationFn: (req: SubmitAnswerRequest) => questionApi.submitAnswer(req),
  });

  const determineAgeGroup = (age: number): AgeGroup | null => {
    const g = ageGroups.find((g) => age >= g.minAge && age <= g.maxAge);
    return g || null;
  };

  const handleAgeSubmit = () => {
    const age = parseInt(userAge);
    if (isNaN(age) || age < 0 || age > 120) { setAgeError(qc("invalidAge")); return; }
    setAgeError("");
    const group = determineAgeGroup(age);
    if (!group) { setAgeError(qc("noAgeGroupMatch")); return; }
    setMatchedGroup(group);
    setStep("answering");
    setCurrentQIndex(0);
  };

  const handleSelectOption = (qId: number, key: string) => {
    setSelections((prev) => ({ ...prev, [qId]: key }));
  };

  const handleNext = () => {
    if (currentQIndex < (fetchedQuestions?.length || 0) - 1) setCurrentQIndex((p) => p + 1);
  };
  const handlePrev = () => {
    if (currentQIndex > 0) setCurrentQIndex((p) => p - 1);
  };

  const saveAnswers = async () => {
    if (!matchedGroup || !fetchedQuestions) return;
    const age = parseInt(userAge);
    for (const q of fetchedQuestions) {
      const sel = selections[q.id];
      if (sel) {
        await submitAnswerMutation.mutateAsync({ questionId: q.id, respondentAge: age, selectedOption: sel });
      }
    }
  };

  useEffect(() => {
    if (step !== "result" || !paymentConfig?.paypalClientId || !fetchedQuestions) return;
    const firstQ = fetchedQuestions.find((q) => selections[q.id]);
    if (!firstQ) return;

    let cancelled = false;

    const renderButtons = async () => {
      const container = document.getElementById("paypal-button-container");
      if (!container) return;
      container.innerHTML = "";

      if (!window.paypal) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.getElementById("paypal-sdk");
          if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", reject, { once: true });
            return;
          }
          const script = document.createElement("script");
          script.id = "paypal-sdk";
          script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paymentConfig.paypalClientId)}&currency=${encodeURIComponent(paymentConfig.currency || "USD")}&intent=capture`;
          script.onload = () => resolve();
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      if (cancelled || !window.paypal) return;
      await window.paypal.Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal" },
        createOrder: async () => {
          setPaymentError("");
          const created = await paymentApi.create({ questionId: firstQ.id });
          paypalTradeNoRef.current = created.tradeNo;
          sessionStorage.setItem("fbPurchaseAmount", String(displayAmount));
          sessionStorage.setItem("fbPurchaseCurrency", paymentConfig?.currency || "USD");
          return created.paypalOrderId;
        },
        onApprove: async (data) => {
          setPaymentError("");
          setCompletingPayment(true);
          try {
            const completed = await paymentApi.complete({
              tradeNo: paypalTradeNoRef.current,
              paypalOrderId: data.orderID,
              fbc: getFbc(),
              fbp: getFbp(),
              eventSourceUrl: window.location.href,
            });
            if (completed.frontendUrl) {
              const amount = parseFloat(sessionStorage.getItem("fbPurchaseAmount") || "0");
              const currency = sessionStorage.getItem("fbPurchaseCurrency") || "USD";
              firePurchaseEvent(amount, currency);
              window.location.href = `/partner-report?url=${encodeURIComponent(completed.frontendUrl)}`;
              return;
            }
            setPaymentError(qc("partnerConfirmFailed"));
          } catch (err) {
            const message = err instanceof Error ? err.message : qc("paymentFailed");
            setPaymentError(message);
          } finally {
            setCompletingPayment(false);
          }
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : qc("paymentFailed");
          setPaymentError(message);
          setCompletingPayment(false);
        },
      }).render("#paypal-button-container");
    };

    renderButtons().catch((err) => {
      const message = err instanceof Error ? err.message : qc("paymentFailed");
      setPaymentError(message);
    });

    return () => {
      cancelled = true;
    };
  }, [fetchedQuestions, paymentConfig, selections, step, lang]);

  const handleFinishAnswering = async () => {
    setStep("result");
    await saveAnswers();
  };

  const handlePayPalRedirect = async () => {
    const firstQ = fetchedQuestions?.find((q) => selections[q.id]);
    if (!firstQ) {
      setPaymentError(qc("paymentFailed"));
      return;
    }
    setPaymentError("");
    setStartingPayment(true);
    try {
      const baseUrl = `${window.location.origin}/partner-report`;
      const created = await paymentApi.create({
        questionId: firstQ.id,
        returnUrl: baseUrl,
        cancelUrl: baseUrl,
      });
      sessionStorage.setItem("pendingPayPalTradeNo", created.tradeNo);
      sessionStorage.setItem("pendingPayPalOrderId", created.paypalOrderId);
      sessionStorage.setItem("fbPurchaseAmount", String(displayAmount));
      sessionStorage.setItem("fbPurchaseCurrency", created.currency || "USD");
      window.location.href = created.approveUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : qc("paymentFailed");
      setPaymentError(message);
      setStartingPayment(false);
    }
  };

  const qList = fetchedQuestions || [];
  const currentQ = qList[currentQIndex];
  const answeredCount = qList.filter((q) => selections[q.id]).length;
  const allAnswered = qList.length > 0 && answeredCount === qList.length;
  const displayAmount = matchedGroup?.price ?? ((paymentConfig?.amountCents ?? 0) / 100);
  const price = displayAmount.toFixed(2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2D2A26]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8">
        <div className="absolute right-4 top-4 flex items-center gap-1">
          <LanguageSwitcher variant="compact" />
          <button onClick={onClose} className="rounded-full p-1 text-[#6B6560] transition-all hover:rotate-90 hover:text-[#2D2A26]">
            <X size={20} />
          </button>
        </div>

        {step === "answering" && qList.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-xs text-[#6B6560]">
              <span>{qc("questionProgress", { current: currentQIndex + 1, total: qList.length })}</span>
              <span>{answeredCount}/{qList.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E8E4DC]">
              <div className="h-full rounded-full bg-[#E8C547] transition-all" style={{ width: `${((currentQIndex + 1) / qList.length) * 100}%` }} />
            </div>
            <div className="mt-2 flex gap-1.5">
              {qList.map((q, idx) => (
                <button key={q.id} onClick={() => setCurrentQIndex(idx)}
                  className={`h-2 flex-1 rounded-full transition-all ${idx === currentQIndex ? "bg-[#E8C547]" : selections[q.id] ? "bg-[#81B29A]" : "bg-[#E8E4DC]"}`} />
              ))}
            </div>
          </div>
        )}

        {step === "intro" && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#E8C547]/20">
              <Sparkles size={36} className="text-[#E8C547]" />
            </div>
            <h2 className="mb-3 font-['Fredoka'] text-2xl text-[#2D2A26]">{qc("quizWelcomeTitle")}</h2>
            <p className="mx-auto mb-2 max-w-sm text-[#6B6560]">{qc("quizWelcomeDesc")}</p>
            <p className="mb-2 text-xs text-[#6B6560]">{qc("quizQuestionCountHint", { count: questionCount })}</p>
            <p className="mb-8 text-xs text-[#E07A5F]">{qc("unlockFee")}</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setStep("age")} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E8C547] px-10 py-4 font-['Fredoka'] text-lg font-medium text-[#2D2A26] shadow-md transition-all hover:scale-[1.03]">
                {qc("startTest")} <ArrowRight size={20} />
              </button>
              <button onClick={onClose} className="text-sm text-[#6B6560] hover:text-[#E8C547]">{qc("quizSkip")}</button>
            </div>
          </div>
        )}

        {step === "age" && (
          <div className="py-4">
            <h2 className="font-['Fredoka'] text-2xl text-[#2D2A26]">{qc("howOldAreYou")}</h2>
            <p className="mt-1 text-sm text-[#6B6560]">{qc("ageHelpText")}</p>
            <input type="number" value={userAge} onChange={(e) => { setUserAge(e.target.value); setAgeError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleAgeSubmit()} placeholder={qc("enterAge")} min={0} max={120} autoFocus
              className="mb-4 mt-4 w-full rounded-lg border border-[#E8E4DC] bg-white px-4 py-4 text-center text-2xl font-['Fredoka'] text-[#2D2A26] outline-none focus:border-[#E8C547]" />
            {ageError && <p className="mb-4 text-sm text-[#E07A5F]">{ageError}</p>}
            <button onClick={handleAgeSubmit} disabled={!userAge.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E8C547] px-6 py-3.5 font-['Fredoka'] font-medium text-[#2D2A26] transition-transform hover:scale-[1.02] disabled:opacity-60">
              {qc("continue")} <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === "answering" && matchedGroup && (
          <div className="py-2">
            {questionsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-[#E8C547]" />
              </div>
            ) : currentQ ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-[#81B29A]/15 px-3 py-1 text-xs font-medium text-[#81B29A]">{ageGroupName(matchedGroup)}</span>
                  <span className="text-xs text-[#6B6560]">{answeredCount}/{qList.length}</span>
                </div>
                <div className="mb-5 rounded-xl border border-[#E8E4DC] bg-[#FFFDF5] p-5">
                  <h3 className="font-['Fredoka'] text-lg text-[#2D2A26]">{currentQ.title}</h3>
                  {currentQ.description && <p className="mt-1 text-sm text-[#6B6560]">{currentQ.description}</p>}
                </div>
                <div className="mb-5 space-y-2.5">
                  {currentQ.options.map((opt) => {
                    const colors = OPT_COLORS[opt.key] || OPT_COLORS.A;
                    const isSelected = selections[currentQ.id] === opt.key;
                    return (
                      <button key={opt.key} onClick={() => handleSelectOption(currentQ.id, opt.key)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                          isSelected ? `${colors.active} shadow-md` : `border-[#E8E4DC] bg-white hover:border-[#E8C547]/40`
                        }`}>
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isSelected ? "bg-white/30" : colors.bg}`}>
                          {opt.key}
                        </span>
                        <span className={`text-sm ${isSelected ? "text-white font-medium" : "text-[#2D2A26]"}`}>{opt.text}</span>
                        {isSelected && <Check size={16} className="ml-auto" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3">
                  {currentQIndex > 0 && (
                    <button onClick={handlePrev} className="rounded-full border border-[#E8E4DC] px-5 py-2.5 text-sm text-[#6B6560] hover:bg-[#FFFDF5]">{qc("previous")}</button>
                  )}
                  {currentQIndex < qList.length - 1 ? (
                    <button onClick={handleNext} className="ml-auto flex items-center gap-2 rounded-full bg-[#E8C547] px-6 py-2.5 font-['Fredoka'] font-medium text-[#2D2A26] hover:scale-[1.02]">
                      {qc("next")} <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button onClick={handleFinishAnswering} disabled={!allAnswered}
                      className={`ml-auto flex items-center gap-2 rounded-full px-6 py-2.5 font-['Fredoka'] font-medium transition-transform hover:scale-[1.02] disabled:opacity-50 ${allAnswered ? "bg-[#81B29A] text-white" : "bg-[#E8E4DC] text-[#6B6560]"}`}>
                      <Check size={16} /> {qc("viewResults")}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-[#6B6560]">
                <p>{qc("noQuestionsAvailable")}</p>
                <button onClick={() => setStep("age")} className="mt-4 rounded-full bg-[#E8C547] px-6 py-2 text-sm font-medium text-[#2D2A26]">
                  {qc("goBack")}
                </button>
              </div>
            )}
          </div>
        )}

        {step === "result" && matchedGroup && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8C547]/20">
              <Check size={28} className="text-[#E8C547]" />
            </div>
            <h2 className="mb-1 font-['Fredoka'] text-2xl text-[#2D2A26]">{qc("answersSaved")}</h2>
            <p className="mb-6 text-sm text-[#6B6560]">{qc("resultPreviewDesc", { count: answeredCount })}</p>
            {paymentError && <p className="mb-4 text-sm text-[#E07A5F]">{paymentError}</p>}

            <div className="mb-6 rounded-xl border border-[#E8E4DC] bg-[#FFFDF5] p-4 text-left">
              <h4 className="mb-3 text-sm font-medium text-[#2D2A26]">{qc("yourSelections")}</h4>
              <div className="space-y-2">
                {qList.map((q, idx) => {
                  const sel = selections[q.id];
                  return (
                    <div key={q.id} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-xs text-[#6B6560]">{idx + 1}.</span>
                      <span className="flex-1 truncate text-[#6B6560]">{q.title}</span>
                      {sel ? (
                        <span className="shrink-0 rounded-full bg-[#81B29A]/15 px-2 py-0.5 text-xs font-bold text-[#81B29A]">{sel}</span>
                      ) : (
                        <span className="shrink-0 text-xs text-[#E07A5F]">-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#E8C547]/30 bg-[#E8C547]/10 p-4">
              <div className="mb-3 flex items-center justify-center gap-2">
                <Lock size={16} className="text-[#E07A5F]" />
                <span className="text-sm font-medium text-[#2D2A26]">{qc("unlockFullReport")}</span>
              </div>
              <p className="mb-3 text-xs text-[#6B6560]">{qc("paypalPaymentHint")}</p>
              {paymentConfig?.paypalClientId ? (
                <button
                  onClick={handlePayPalRedirect}
                  disabled={startingPayment || completingPayment}
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-[#F7C948] px-6 py-4 font-['Fredoka'] text-lg font-semibold text-[#123D75] shadow-md transition-all hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-70"
                >
                  {startingPayment ? <Loader2 size={22} className="animate-spin" /> : <CreditCard size={24} />}
                  PayPal
                </button>
              ) : (
                <p className="text-sm text-[#E07A5F]">{qc("paypalNotConfigured")}</p>
              )}
            </div>
          </div>
        )}

        {step === "paying" && (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8C547]/20">
              <CreditCard size={28} className="text-[#E8C547]" />
            </div>
            <p className="mb-2 font-['Fredoka'] text-lg text-[#2D2A26]">{qc("redirectingToReport")}</p>
            <p className="mb-4 text-sm text-[#6B6560]">${price}</p>
            <Loader2 size={36} className="mx-auto animate-spin text-[#E8C547]" />
          </div>
        )}
      </div>
    </div>
  );
}
