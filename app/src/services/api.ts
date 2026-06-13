import axios, { AxiosError } from "axios";
import type {
  ApiResponse,
  AgeGroup,
  QuestionDTO,
  AdminQuestionDTO,
  AnswerDTO,
  AdminPaymentDTO,
  PageDTO,
  LoginRequest,
  LoginResponse,
  SubmitAnswerRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentCompleteRequest,
  PaymentCancelRequest,
  PaymentCompleteResponse,
  PaymentConfig,
  PublicSettings,
  AdminSettings,
  UpdateSettingsRequest,
} from "@/types/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor - attach admin token when available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Response interceptor - extract data
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
    }
    return Promise.reject(
      new Error(error.response?.data?.message || error.message || "Request failed")
    );
  }
);

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>(url, { params });
  return res.data.data;
}

async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.post<ApiResponse<T>>(url, data);
  if (!res.data.success) {
    throw new Error(res.data.message || "Request failed");
  }
  return res.data.data;
}

async function put<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.put<ApiResponse<T>>(url, data);
  if (!res.data.success) {
    throw new Error(res.data.message || "Request failed");
  }
  return res.data.data;
}

async function del<T>(url: string): Promise<T> {
  const res = await apiClient.delete<ApiResponse<T>>(url);
  return res.data.data;
}

// ======== Auth API ========
export const authApi = {
  login: (req: LoginRequest) => post<LoginResponse>("/admin/login", req),
  me: () => get<string>("/admin/me"),
};

// ======== Age Group API ========
export const ageGroupApi = {
  list: () => get<AgeGroup[]>("/age-groups"),
  setUnifiedPrice: (price: number) =>
    put<void>("/age-groups/admin/price", { price }),
};

// ======== Settings API ========
export const settingsApi = {
  getPublic: () => get<PublicSettings>("/settings/public"),
};

export const adminSettingsApi = {
  get: () => get<AdminSettings>("/admin/settings"),
  update: (req: UpdateSettingsRequest) => put<AdminSettings>("/admin/settings", req),
};

// ======== Question API ========
export const questionApi = {
  list: (ageGroupId: number, language: string) =>
    get<QuestionDTO[]>("/questions", { ageGroupId, language }),
  submitAnswer: (req: SubmitAnswerRequest) =>
    post<number>("/questions/answer", req),
};

// ======== Admin Question API ========
export const adminQuestionApi = {
  list: () => get<AdminQuestionDTO[]>("/admin/questions"),
  create: (req: CreateQuestionRequest) =>
    post<number>("/admin/questions", req),
  update: (id: number, req: CreateQuestionRequest) =>
    put<void>(`/admin/questions/${id}`, req),
  delete: (id: number) => del<void>(`/admin/questions/${id}`),
};

// ======== Answer API ========
export const answerApi = {
  adminList: (page: number = 1, pageSize: number = 20) =>
    get<PageDTO<AnswerDTO>>("/admin/answers", { page, pageSize }),
};

export const adminPaymentApi = {
  list: (
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    keyword?: string
  ) =>
    get<PageDTO<AdminPaymentDTO>>("/admin/payments", {
      page,
      pageSize,
      ...(status ? { status } : {}),
      ...(keyword ? { keyword } : {}),
    }),
};

// ======== Payment API (server-side mock/live) ========
export const domainConfigApi = {
  list: () => get<DomainConfig[]>("/admin/domain-configs"),
  create: (req: { domain: string; price: number; paypalMode?: string }) =>
    post<DomainConfig>("/admin/domain-configs", req),
  update: (id: number, req: { price?: number; paypalMode?: string }) =>
    put<DomainConfig>(`/admin/domain-configs/${id}`, req),
  delete: (id: number) => del<void>(`/admin/domain-configs/${id}`),
};

export const paymentApi = {
  config: () => get<PaymentConfig>("/payments/config"),
  create: (req: PaymentCreateRequest) =>
    post<PaymentCreateResponse>("/payments/create", req),
  cancel: (req: PaymentCancelRequest) =>
    post<void>("/payments/cancel", req),
  complete: (req: PaymentCompleteRequest) =>
    post<PaymentCompleteResponse>("/payments/complete", req),
};

export default apiClient;
