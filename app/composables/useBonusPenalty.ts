import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

// Mirrors the backend `bonus-penalty` module:
//   - /bonus-penalty-transaction  (bonus | jarima | referal)
//   - /bonus-penalty-wallet
//   - /bonus-penalty-categories
export type BonusPenaltyType = "bonus" | "jarima" | "referal";

export interface BonusPenaltyUserRef {
  user_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface BonusPenaltyCategory {
  id: string;
  name: string;
  type: BonusPenaltyType | null;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BonusPenaltyTransaction {
  id: string;
  teacher_id: string;
  student_id: string | null;
  lead_id: string | null;
  branch_id: string | null;
  category_id: string | null;
  amount: number;
  type: BonusPenaltyType;
  description: string | null;
  created_at: string;
  teacher?: BonusPenaltyUserRef;
  student?: BonusPenaltyUserRef;
  category?: Pick<BonusPenaltyCategory, "id" | "name" | "type">;
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    status: string;
  } | null;
}

export interface BonusPenaltyWallet {
  id: string;
  teacher_id: string;
  amount: number;
  created_at?: string;
  updated_at?: string;
  teacher?: BonusPenaltyUserRef;
}

export interface TransactionQuery {
  page?: number;
  limit?: number;
  type?: BonusPenaltyType;
  teacher_id?: string;
  student_id?: string;
  category_id?: string;
  branch_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface PaginatedTransactions {
  data: BonusPenaltyTransaction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  totalAmount: number;
}

export interface CreateTransactionPayload {
  teacher_id: string;
  amount: number;
  type: BonusPenaltyType;
  category_id?: string | null;
  student_id?: string | null;
  lead_id?: string | null;
  branch_id?: string | null;
  description?: string | null;
}

export const BONUS_PENALTY_TYPE_LABELS: Record<BonusPenaltyType, string> = {
  bonus: "Bonus",
  jarima: "Jarima",
  referal: "Referal",
};

export const useBonusPenalty = () => {
  const { apiService } = useAuth();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount || 0) + " so'm";

  // Credits (bonus/referal) display as +, penalties (jarima) as -.
  const isCredit = (type: BonusPenaltyType) => type !== "jarima";
  const signedAmount = (t: { type: BonusPenaltyType; amount: number }) =>
    `${isCredit(t.type) ? "+" : "-"} ${formatCurrency(t.amount)}`;

  const typeColor = (type: BonusPenaltyType): "success" | "error" | "info" =>
    type === "jarima" ? "error" : type === "referal" ? "info" : "success";

  // --- Transactions -------------------------------------------------------
  const listTransactions = (query: TransactionQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
    });
    const qs = params.toString();
    return api.get<PaginatedTransactions>(
      apiService.value,
      `/bonus-penalty-transaction${qs ? `?${qs}` : ""}`,
    );
  };

  const createTransaction = (payload: CreateTransactionPayload) =>
    api.post<BonusPenaltyTransaction>(
      apiService.value,
      "/bonus-penalty-transaction",
      payload,
    );

  const deleteTransaction = (id: string) =>
    api.delete(apiService.value, `/bonus-penalty-transaction/${id}`);

  // --- Wallets ------------------------------------------------------------
  const listWallets = () =>
    api.get<BonusPenaltyWallet[]>(apiService.value, "/bonus-penalty-wallet");

  const getWalletByTeacher = (teacherId: string) =>
    api.get<BonusPenaltyWallet>(
      apiService.value,
      `/bonus-penalty-wallet/teacher/${teacherId}`,
    );

  const adjustWalletAmount = (walletId: string, amount: number) =>
    api.patch<BonusPenaltyWallet>(
      apiService.value,
      `/bonus-penalty-wallet/${walletId}/amount`,
      { amount },
    );

  // Settle (reset) a wallet after its balance has been paid out.
  const settleWallet = (walletId: string) =>
    api.patch<{ id: string; teacher_id: string; paid_amount: number }>(
      apiService.value,
      `/bonus-penalty-wallet/${walletId}/settle`,
      {},
    );

  const settleAllWallets = () =>
    api.post<{ count: number; total_paid: number }>(
      apiService.value,
      "/bonus-penalty-wallet/settle-all",
      {},
    );

  // --- Categories ---------------------------------------------------------
  const listCategories = (type?: BonusPenaltyType) =>
    api.get<BonusPenaltyCategory[]>(
      apiService.value,
      `/bonus-penalty-categories${type ? `?type=${type}` : ""}`,
    );

  const createCategory = (payload: {
    name: string;
    type?: BonusPenaltyType | null;
    description?: string | null;
  }) =>
    api.post<BonusPenaltyCategory>(
      apiService.value,
      "/bonus-penalty-categories",
      payload,
    );

  const updateCategory = (
    id: string,
    payload: { name?: string; type?: BonusPenaltyType | null; description?: string | null },
  ) =>
    api.patch<BonusPenaltyCategory>(
      apiService.value,
      `/bonus-penalty-categories/${id}`,
      payload,
    );

  const deleteCategory = (id: string) =>
    api.delete(apiService.value, `/bonus-penalty-categories/${id}`);

  return {
    formatCurrency,
    isCredit,
    signedAmount,
    typeColor,
    listTransactions,
    createTransaction,
    deleteTransaction,
    listWallets,
    getWalletByTeacher,
    adjustWalletAmount,
    settleWallet,
    settleAllWallets,
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
