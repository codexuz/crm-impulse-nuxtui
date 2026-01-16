import { api } from "~/lib/api";

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success" | "error";
}

export const useNotifications = () => {
  const { apiService } = useAuth();

  // Store notifications
  const notifications = useState<Notification[]>("notifications", () => []);
  const unreadCount = computed(
    () => notifications.value.filter((n) => !n.read).length
  );

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await api.get<Notification[]>(
        apiService.value,
        "/notifications"
      );
      notifications.value = response;
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      await api.put(apiService.value, `/notifications/${id}/read`, {});

      // Update local state
      const notif = notifications.value.find((n) => n.id === id);
      if (notif) {
        notif.read = true;
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put(apiService.value, "/notifications/read-all", {});

      // Update local state
      notifications.value = notifications.value.map((n) => ({
        ...n,
        read: true,
      }));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Demo notifications for development
  const loadDemoNotifications = () => {
    notifications.value = [
      {
        id: "1",
        title: "New student registered",
        description: "John Doe has enrolled in Advanced English course",
        time: "2 hours ago",
        read: false,
        type: "info",
      },
      {
        id: "2",
        title: "Homework submission",
        description: "5 students completed Grammar Exercises",
        time: "Yesterday",
        read: false,
        type: "success",
      },
      {
        id: "3",
        title: "Payment reminder",
        description: "Monthly payment for Group B is due tomorrow",
        time: "Yesterday",
        read: true,
        type: "warning",
      },
    ];
  };

  // Initialize notifications on client-side
  onMounted(() => {
    // For development, load demo notifications
    // In production, use fetchNotifications() instead
    loadDemoNotifications();
  });

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    loadDemoNotifications,
  };
};
