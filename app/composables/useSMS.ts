import { api } from "~/lib/api";
import { useAuth } from "./useAuth";

export interface SMSMessage {
  mobile_phone: string;
  message: string;
}

export interface SMSVerification {
  mobile_phone: string;
  code: string;
}

export interface SMSTemplate {
  id?: string;
  name: string;
  message: string;
}

export interface SMSReportRequest {
  start_date: string;
  to_date: string;
  status?: string;
  is_ad?: string;
}

export interface SMSUserMessagesRequest {
  start_date: string;
  end_date: string;
  status?: string;
}

export interface SMSBulkMessage {
  user_sms_id: string;
  mobile_phone: string;
  message: string;
}

export interface SMSBulkRequest {
  messages: SMSBulkMessage[];
}

export interface SMSBalance {
  balance: number;
  currency: string;
}

export interface SMSReport {
  total_count: number;
  delivered_count: number;
  failed_count: number;
  pending_count: number;
  cost: number;
}

export interface PaymentAction {
  payment_id: string;
  manager_id: string;
  stage: "upcoming" | "debitor";
  action_type: "sms" | "phone" | "telegram" | "in_person";
  message: string;
  next_action_date: string;
}

export const useSMS = () => {
  const { apiService } = useAuth();

  /**
   * Send SMS message
   */
  const sendSMS = async (smsData: SMSMessage) => {
    const response = await api.post<any>(
      apiService.value,
      "/sms/send",
      smsData
    );
    return response;
  };

  /**
   * Send verification SMS
   */
  const sendVerificationSMS = async (verificationData: SMSVerification) => {
    const response = await api.post<any>(
      apiService.value,
      "/sms/send-verification",
      verificationData
    );
    return response;
  };

  /**
   * Get SMS balance
   */
  const getSMSBalance = async (): Promise<SMSBalance> => {
    const response = await api.get<SMSBalance>(
      apiService.value,
      "/sms/balance"
    );
    return response;
  };

  /**
   * Get SMS templates
   */
  const getSMSTemplates = async (): Promise<SMSTemplate[]> => {
    const response = await api.get<SMSTemplate[]>(
      apiService.value,
      "/sms/templates"
    );
    return response;
  };

  /**
   * Create SMS template
   */
  const createSMSTemplate = async (templateData: { template: string }) => {
    const response = await api.post<any>(
      apiService.value,
      "/sms/templates",
      templateData
    );
    return response;
  };

  /**
   * Get SMS report by date range
   */
  const getSMSReport = async (
    reportRequest: SMSReportRequest
  ): Promise<SMSReport> => {
    const response = await api.post<SMSReport>(
      apiService.value,
      "/sms/report/total-by-range",
      reportRequest
    );
    return response;
  };

  /**
   * Create payment action
   */
  const createPaymentAction = async (actionData: PaymentAction) => {
    const response = await api.post<any>(
      apiService.value,
      "/payment-actions",
      actionData
    );
    return response;
  };

  /**
   * Update payment action
   */
  const updatePaymentAction = async (
    actionId: string,
    actionData: PaymentAction
  ) => {
    const response = await api.patch<any>(
      apiService.value,
      `/payment-actions/${actionId}`,
      actionData
    );
    return response;
  };

  /**
   * Check if payment has been contacted
   */
  const checkPaymentContact = async (paymentId: string) => {
    const response = await api.get<any[]>(
      apiService.value,
      `/payment-actions/by-payment/${paymentId}`
    );
    return response;
  };

  /**
   * Send bulk SMS messages
   */
  const sendBulkSMS = async (requestData: SMSBulkRequest) => {
    const response = await api.post<any>(
      apiService.value,
      "/sms/send-bulk",
      requestData
    );
    return response;
  };

  /**
   * Get user SMS messages
   */
  const getUserMessages = async (requestData: SMSUserMessagesRequest) => {
    const response = await api.post<any>(
      apiService.value,
      "/sms/messages/get-user-messages",
      requestData
    );
    return response;
  };

  return {
    sendSMS,
    sendVerificationSMS,
    getSMSBalance,
    getSMSTemplates,
    createSMSTemplate,
    getSMSReport,
    sendBulkSMS,
    getUserMessages,
    createPaymentAction,
    updatePaymentAction,
    checkPaymentContact,
  };
};
