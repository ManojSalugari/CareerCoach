"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, AlertCircle, Info, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
} from "@/actions/notifications";

const NotificationIcon = ({ type, priority }) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (type) {
    case "job_alert":
      return <AlertCircle {...iconProps} className="text-blue-500" />;
    case "interview_reminder":
      return <CheckCircle {...iconProps} className="text-green-500" />;
    case "skill_suggestion":
      return <Star {...iconProps} className="text-yellow-500" />;
    case "achievement":
      return <CheckCircle {...iconProps} className="text-purple-500" />;
    default:
      return <Info {...iconProps} className="text-gray-500" />;
  }
};

const PriorityBadge = ({ priority }) => {
  const variants = {
    urgent: "destructive",
    high: "destructive",
    medium: "default",
    low: "secondary",
  };

  return (
    <Badge variant={variants[priority] || "default"} className="text-xs">
      {priority}
    </Badge>
  );
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const {
    loading: notificationsLoading,
    fn: fetchNotifications,
  } = useFetch(getNotifications);

  const {
    loading: unreadLoading,
    fn: fetchUnreadCount,
  } = useFetch(getUnreadNotificationCount);

  const {
    loading: markReadLoading,
    fn: markAsRead,
  } = useFetch(markNotificationAsRead);

  const {
    loading: markAllReadLoading,
    fn: markAllAsRead,
  } = useFetch(markAllNotificationsAsRead);

  const {
    loading: deleteLoading,
    fn: deleteNotif,
  } = useFetch(deleteNotification);

  useEffect(() => {
    fetchUnreadCount().then(setUnreadCount);
  }, []);

  const handleOpenChange = async (open) => {
    setIsOpen(open);
    if (open) {
      const fetchedNotifications = await fetchNotifications(20, 0);
      setNotifications(fetchedNotifications || []);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotif(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllReadLoading}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {notificationsLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b hover:bg-gray-50 ${
                  !notification.isRead ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <NotificationIcon
                    type={notification.type}
                    priority={notification.priority}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <PriorityBadge priority={notification.priority} />
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markReadLoading}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        disabled={deleteLoading}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                      {notification.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = notification.actionUrl}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
