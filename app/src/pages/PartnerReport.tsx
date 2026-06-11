import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { paymentApi } from "@/services/api";
import { firePurchaseEvent, getFbc, getFbp } from "@/services/facebookPixel";

function parseAllowedReportUrl(raw: string): string {
  if (!raw) return "";
  try {
    const decoded = decodeURIComponent(raw);
    const url = new URL(decoded);
    const hash = url.hash.replace(/^#\/?\??/, "");
    const hashParams = new URLSearchParams(hash);
    const orderId = hashParams.get("orderId");
    const token = hashParams.get("token");
    if (!orderId || !token) return "";
    return "/report/#/?orderId=" + orderId + "&token=" + token;
  } catch {
    return "";
  }
}

export default function PartnerReport() {
  const handledReturn = useRef(false);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [reportUrl, setReportUrl] = useState(() => parseAllowedReportUrl(params.get("url") || ""));
  const [message, setMessage] = useState(reportUrl ? "" : "Confirming payment...");
  const [loading, setLoading] = useState(!reportUrl);

  useEffect(() => {
    if (reportUrl || handledReturn.current) return;
    const paypalReturn = params.get("paypalReturn");
    if (!paypalReturn) {
      setLoading(false);
      setMessage("Invalid report link. Please complete payment again.");
      return;
    }

    handledReturn.current = true;
    const tradeNo = params.get("tradeNo") || sessionStorage.getItem("pendingPayPalTradeNo") || "";
    if (paypalReturn === "cancel") {
      if (tradeNo) {
        paymentApi.cancel({ tradeNo }).catch(() => undefined);
      }
      sessionStorage.removeItem("pendingPayPalTradeNo");
      sessionStorage.removeItem("pendingPayPalOrderId");
      setLoading(false);
      setMessage("Payment was cancelled.");
      return;
    }

    const paypalOrderId = params.get("token") || sessionStorage.getItem("pendingPayPalOrderId") || "";
    if (!tradeNo || !paypalOrderId) {
      setLoading(false);
      setMessage("Payment information missing.");
      return;
    }

    paymentApi.complete({ tradeNo, paypalOrderId, fbc: getFbc(), fbp: getFbp(), eventSourceUrl: window.location.href })
      .then((completed) => {
        sessionStorage.removeItem("pendingPayPalTradeNo");
        sessionStorage.removeItem("pendingPayPalOrderId");
        const amount = parseFloat(sessionStorage.getItem("fbPurchaseAmount") || "0");
        const currency = sessionStorage.getItem("fbPurchaseCurrency") || "USD";
        if (amount > 0) firePurchaseEvent(amount, currency);
        const nextReportUrl = parseAllowedReportUrl(completed.frontendUrl);
        if (!nextReportUrl) {
          setMessage("Report platform did not return a valid link.");
          setLoading(false);
          return;
        }
        setReportUrl(nextReportUrl);
        setLoading(false);
        window.history.replaceState(
          {},
          "",
          `/partner-report?url=${encodeURIComponent(nextReportUrl)}`
        );
      })
      .catch((err) => {
        const text = err instanceof Error ? err.message : "Payment confirmation failed. Please try again.";
        setMessage(text);
        setLoading(false);
      });
  }, [params, reportUrl]);

  if (!reportUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6 text-center text-sm text-[#6B6560]">
        <div>
          {loading && <Loader2 size={34} className="mx-auto mb-4 animate-spin text-[#E8C547]" />}
          <p>{message}</p>
        </div>
      </div>
    );
  }

  window.location.href = reportUrl;
  return null;
}
