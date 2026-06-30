import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import type { Form, FormResponse } from "~/types";

export function useFormsApi() {
  const { apiService } = useAuth();

  // ─── Admin (auth required) ───────────────────

  async function listForms() {
    return await api.get<Form[]>(apiService.value, "/forms");
  }

  async function getForm(id: string) {
    return await api.get<Form>(apiService.value, `/forms/${id}`);
  }

  async function createForm(title: string, schema: object, smsVerification = false) {
    return await api.post<Form>(apiService.value, "/forms", { title, schema, smsVerification });
  }

  async function updateForm(
    id: string,
    data: Partial<{ title: string; schema: object; smsVerification: boolean }>,
  ) {
    return await api.patch<Form>(apiService.value, `/forms/${id}`, data);
  }

  async function deleteForm(id: string) {
    return await api.delete<void>(apiService.value, `/forms/${id}`);
  }

  async function getFormResponses(formId: string) {
    return await api.get<FormResponse[]>(apiService.value, `/forms/responses/form/${formId}`);
  }

  async function deleteResponse(id: string) {
    return await api.delete<void>(apiService.value, `/forms/responses/${id}`);
  }

  // ─── Public (no auth) ────────────────────────

  async function getFormPublic(id: string) {
    const config = useRuntimeConfig();
    const response = await fetch(`${config.public.apiBaseUrl}/forms/${id}`);
    if (!response.ok) throw new Error("Form not found");
    return (await response.json()) as Form;
  }

  async function requestResponseOtp(formId: string, phone: string) {
    const config = useRuntimeConfig();
    const response = await fetch(`${config.public.apiBaseUrl}/forms/responses/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form_id: formId, phone }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to send verification code");
    }
    return (await response.json()) as { message: string };
  }

  async function submitResponse(
    formId: string,
    answers: Record<string, any>,
    verification?: { phone: string; code: string },
  ) {
    const config = useRuntimeConfig();
    const response = await fetch(`${config.public.apiBaseUrl}/forms/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form_id: formId, answers, ...verification }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Submission failed");
    }
    return (await response.json()) as FormResponse;
  }

  return {
    listForms,
    getForm,
    createForm,
    updateForm,
    deleteForm,
    getFormResponses,
    deleteResponse,
    getFormPublic,
    requestResponseOtp,
    submitResponse,
  };
}
