import { getNotifications, getUnreadNotificationCount } from "@/actions/notifications";
import NotificationBell from "@/components/notifications/notification-bell";

export default async function NotificationsPage() {
  const notifications = await getNotifications(50, 0);
  const unreadCount = await getUnreadNotificationCount();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-600">Stay updated with your career progress</p>
        </div>
        <NotificationBell />
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No notifications yet</h3>
            <p className="text-gray-500">We'll notify you about important updates and opportunities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${
                  !notification.isRead ? "bg-blue-50 border-blue-200" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    {notification.priority === "high" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        High Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
