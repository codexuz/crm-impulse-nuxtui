import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

// Mirrors the backend `shop` module:
//   - /shop/items                (admin-managed catalog)
//   - /shop/purchases            (student buy requests admins review)
//   - /shop/exchange             (student-only: points/streaks -> coins)
// The CRM is the admin panel, so it only deals with items and purchases.
export type PurchaseStatus = "pending" | "approved" | "rejected" | "delivered";

export interface ShopUserRef {
  user_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
}

export interface ShopItem {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number; // in coins
  stock?: number | null; // null = unlimited
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopPurchase {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  total_price: number; // coins charged
  status: PurchaseStatus;
  reviewed_by?: string | null;
  admin_note?: string | null;
  createdAt: string;
  updatedAt?: string;
  item?: ShopItem;
  user?: ShopUserRef;
}

export interface CreateShopItemPayload {
  name: string;
  description?: string | null;
  image_url?: string | null;
  price: number;
  stock?: number | null;
  is_active?: boolean;
}

export type UpdateShopItemPayload = Partial<CreateShopItemPayload>;

export interface ReviewPurchasePayload {
  status: Exclude<PurchaseStatus, "pending">;
  admin_note?: string | null;
}

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
  delivered: "Yetkazilgan",
};

export const useShop = () => {
  const { apiService } = useAuth();

  const formatCoins = (amount: number) =>
    new Intl.NumberFormat("uz-UZ", { style: "decimal" }).format(amount || 0) +
    " coin";

  const statusColor = (
    status: PurchaseStatus,
  ): "warning" | "success" | "error" | "info" =>
    status === "pending"
      ? "warning"
      : status === "rejected"
        ? "error"
        : status === "delivered"
          ? "info"
          : "success";

  // --- Items --------------------------------------------------------------
  const listItems = (includeInactive = false) =>
    api.get<ShopItem[]>(
      apiService.value,
      `/shop/items${includeInactive ? "?includeInactive=true" : ""}`,
    );

  const getItem = (id: string) =>
    api.get<ShopItem>(apiService.value, `/shop/items/${id}`);

  const createItem = (payload: CreateShopItemPayload) =>
    api.post<ShopItem>(apiService.value, "/shop/items", payload);

  const updateItem = (id: string, payload: UpdateShopItemPayload) =>
    api.patch<ShopItem>(apiService.value, `/shop/items/${id}`, payload);

  const deleteItem = (id: string) =>
    api.delete(apiService.value, `/shop/items/${id}`);

  // --- Purchases ----------------------------------------------------------
  const listPurchases = (status?: PurchaseStatus) =>
    api.get<ShopPurchase[]>(
      apiService.value,
      `/shop/purchases${status ? `?status=${status}` : ""}`,
    );

  const getPurchase = (id: string) =>
    api.get<ShopPurchase>(apiService.value, `/shop/purchases/${id}`);

  // Approve / reject / mark delivered. Rejecting refunds the student's coins.
  const reviewPurchase = (id: string, payload: ReviewPurchasePayload) =>
    api.patch<ShopPurchase>(
      apiService.value,
      `/shop/purchases/${id}/review`,
      payload,
    );

  return {
    formatCoins,
    statusColor,
    listItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    listPurchases,
    getPurchase,
    reviewPurchase,
  };
};
