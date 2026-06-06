import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, PenLine, Send } from "lucide-react";
import { ageGroupApi, paymentApi } from "@/services/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuizFlow from "@/components/QuizFlow";
import gsap from "gsap";

gsap.registerPlugin();

export default function Home() {
  const { t } = useTranslation();
  const [showQuiz, setShowQuiz] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const paypalReturnHandled = useRef(false);

  const { data: ageGroups } = useQuery({
    queryKey: ["ageGroups"],
    queryFn: ageGroupApi.list,
  });

  // Show quiz on first visit
  useEffect(() => {
    const hasTaken = sessionStorage.getItem("qaTestTaken");
    if (!hasTaken) {
      const timer = setTimeout(() => setShowQuiz(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (paypalReturnHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const paypalReturn = params.get("paypalReturn");
    if (!paypalReturn) return;

    paypalReturnHandled.current = true;
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;

    if (paypalReturn === "cancel") {
      sessionStorage.removeItem("pendingPayPalTradeNo");
      sessionStorage.removeItem("pendingPayPalOrderId");
      window.history.replaceState({}, "", cleanUrl);
      toast.error(t("paymentCancelled", "Payment was cancelled."));
      setShowQuiz(true);
      return;
    }

    const tradeNo = params.get("tradeNo") || sessionStorage.getItem("pendingPayPalTradeNo") || "";
    const paypalOrderId = params.get("token") || sessionStorage.getItem("pendingPayPalOrderId") || "";
    if (!tradeNo || !paypalOrderId) {
      window.history.replaceState({}, "", cleanUrl);
      toast.error(t("paymentFailed", "Payment failed. Please try again."));
      return;
    }

    toast.loading(t("confirmingPayment", "Confirming payment..."));
    paymentApi.complete({ tradeNo, paypalOrderId })
      .then((completed) => {
        sessionStorage.removeItem("pendingPayPalTradeNo");
        sessionStorage.removeItem("pendingPayPalOrderId");
        if (completed.frontendUrl) {
          window.location.href = `/partner-report?url=${encodeURIComponent(completed.frontendUrl)}`;
          return;
        }
        window.history.replaceState({}, "", cleanUrl);
        toast.error(t("partnerConfirmFailed", "Failed to confirm payment with report platform. Please try again."));
      })
      .catch((err) => {
        window.history.replaceState({}, "", cleanUrl);
        const message = err instanceof Error ? err.message : t("paymentFailed", "Payment failed. Please try again.");
        toast.error(message);
        setShowQuiz(true);
      });
  }, [t]);

  // Entrance animation
  useEffect(() => {
    if (heroRef.current) {
      const els = heroRef.current.querySelectorAll(".hero-animate");
      gsap.fromTo(
        els,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out" }
      );
    }
  }, [showQuiz]);

  const handleQuizClose = () => {
    setShowQuiz(false);
    sessionStorage.setItem("qaTestTaken", "true");
  };

  const steps = [
    { icon: Search, num: "01", title: t("step1NewTitle", "Tell Us Your Age"), desc: t("step1NewDesc", "Answer one simple question about your age so we can match you to the right questions.") },
    { icon: PenLine, num: "02", title: t("step2NewTitle", "Answer Questions"), desc: t("step2NewDesc", "We'll randomly select questions tailored to your age group. Answer them one by one at your own pace.") },
    { icon: Send, num: "03", title: t("step3NewTitle", "Submit & Share"), desc: t("step3NewDesc", "Submit your answers to share your wisdom with the world. It's completely free!") },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <Header />

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden px-6 pb-20 pt-32 text-center">
        {/* Decorative circles */}
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#E07A5F]/5" />
        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#81B29A]/5" />
        <div className="absolute right-1/4 top-20 h-24 w-24 rounded-full bg-[#E8C547]/5" />

        <div className="relative mx-auto max-w-2xl">
          <div className="hero-animate mb-6 inline-flex items-center gap-2 rounded-full border border-[#E8C547]/30 bg-[#E8C547]/15 px-4 py-2 text-sm font-medium text-[#2D2A26]">
            {t("heroBadge")}
          </div>
          <h1 className="hero-animate mb-6 font-['Fredoka'] text-5xl font-semibold leading-tight text-[#2D2A26] md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="hero-animate mx-auto mb-8 max-w-xl text-lg leading-relaxed text-[#6B6560]">
            {t("heroSubtitleNew", "Take our fun age-matched Q&A test. Share your unique perspective with the world — it's completely free!")}
          </p>

          <div className="hero-animate">
            <button
              onClick={() => setShowQuiz(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#E8C547] px-10 py-4 font-['Fredoka'] text-lg font-medium text-[#2D2A26] shadow-lg transition-all hover:scale-[1.03] hover:shadow-xl"
            >
              {t("startTest", "Start Test")}
              <PenLine size={20} />
            </button>
          </div>

          {/* Age group preview */}
          <div className="hero-animate mt-10 flex flex-wrap justify-center gap-2">
            {ageGroups?.map((g) => (
              <span
                key={g.id}
                className="rounded-full border border-[#E8E4DC] bg-white px-4 py-2 text-xs font-medium text-[#6B6560] shadow-sm"
              >
                {g.name} <span className="text-[#E07A5F]">${g.price.toFixed(2)}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-[1000px]">
          <div className="mb-4 text-center">
            <h2 className="mb-3 font-['Fredoka'] text-3xl text-[#2D2A26]">{t("howItWorks")}</h2>
            <p className="text-lg text-[#6B6560]">{t("howItWorksSubtitle", "Three simple steps to share your answers")}</p>
          </div>
          <div className="grid gap-10 pt-10 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#E8C547]/20">
                  <step.icon size={28} className="text-[#E8C547]" />
                </div>
                <span className="mb-2 inline-block font-['Fredoka'] text-sm text-[#E8C547]">
                  {step.num}
                </span>
                <h3 className="mb-3 font-['Fredoka'] text-xl text-[#2D2A26]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[#6B6560]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#E8E4DC] bg-white p-10 text-center shadow-lg">
          <h2 className="mb-3 font-['Fredoka'] text-2xl text-[#2D2A26]">
            {t("readyToStart", "Ready to Get Started?")}
          </h2>
          <p className="mb-6 text-sm text-[#6B6560]">
            {t("readyDesc", "Take the test now and discover questions curated just for your age group.")}
          </p>
          <button
            onClick={() => setShowQuiz(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#E8C547] px-8 py-4 font-['Fredoka'] text-lg font-medium text-[#2D2A26] shadow-md transition-all hover:scale-[1.03]"
          >
            {t("startTestNow", "Start Test Now")}
          </button>
        </div>
      </section>

      <Footer />

      {/* Quiz Flow Modal */}
      {showQuiz && ageGroups && (
        <QuizFlow ageGroups={ageGroups} onClose={handleQuizClose} />
      )}
    </div>
  );
}
