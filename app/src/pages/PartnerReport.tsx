import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { paymentApi } from "@/services/api";
import { firePurchaseEvent, getFbc, getFbp } from "@/services/facebookPixel";

const ALLOWED_REPORT_ORIGIN = "http://39.97.224.240:8842";

function parseAllowedReportUrl(raw: string): string {
  if (!raw) return "";
  try {
    const decoded = decodeURIComponent(raw);
    const url = new URL(decoded);
    if (url.origin !== ALLOWED_REPORT_ORIGIN) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export default function PartnerReport() {
  const handledReturn = useRef(false);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [reportUrl, setReportUrl] = useState(() => parseAllowedReportUrl(params.get("url") || ""));
  const [message, setMessage] = useState(reportUrl ? "" : "正在确认支付...");
  const [loading, setLoading] = useState(!reportUrl);

  useEffect(() => {
    if (reportUrl || handledReturn.current) return;
    const paypalReturn = params.get("paypalReturn");
    if (!paypalReturn) {
      setLoading(false);
      setMessage("报告链接无效，请重新完成支付。");
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
      setMessage("支付已取消，请返回重新发起支付。");
      return;
    }

    const paypalOrderId = params.get("token") || sessionStorage.getItem("pendingPayPalOrderId") || "";
    if (!tradeNo || !paypalOrderId) {
      setLoading(false);
      setMessage("支付信息缺失，请重新完成支付。");
      return;
    }

    paymentApi.complete({ tradeNo, paypalOrderId, fbc: getFbc(), fbp: getFbp() })
      .then((completed) => {
        sessionStorage.removeItem("pendingPayPalTradeNo");
        sessionStorage.removeItem("pendingPayPalOrderId");
        const amount = parseFloat(sessionStorage.getItem("fbPurchaseAmount") || "0");
        const currency = sessionStorage.getItem("fbPurchaseCurrency") || "USD";
        if (amount > 0) firePurchaseEvent(amount, currency);
        const nextReportUrl = parseAllowedReportUrl(completed.frontendUrl);
        if (!nextReportUrl) {
          setMessage("报告平台未返回有效链接。");
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
        const text = err instanceof Error ? err.message : "支付确认失败，请重试。";
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

  // Redirect to the partner report site directly (cannot use iframe due to SPA API path conflicts)
  window.location.href = reportUrl;
  return null;
}
