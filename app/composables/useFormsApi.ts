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

  async function createForm(title: string, schema: object) {
    return await api.post<Form>(apiService.value, "/forms", { title, schema });
  }

  async function updateForm(id: string, data: Partial<{ title: string; schema: object }>) {
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

  async function submitResponse(formId: string, answers: Record<string, any>) {
    const config = useRuntimeConfig();
    const response = await fetch(`${config.public.apiBaseUrl}/forms/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form_id: formId, answers }),
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
    submitResponse,
  };
}
