import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotificationCard() {
  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/notifications/read/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Handler for marking a notification as read
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  // Handler for marking all notifications as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Get icon and color based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "claim":
        return {
          icon: "warning",
          bgColor: "bg-red-100",
          iconColor: "text-red-500",
        };
      case "job":
        return {
          icon: "check_circle",
          bgColor: "bg-green-100",
          iconColor: "text-green-500",
        };
      case "schedule":
        return {
          icon: "schedule",
          bgColor: "bg-blue-100",
          iconColor: "text-blue-500",
        };
      case "system":
      default:
        return {
          icon: "notifications",
          bgColor: "bg-purple-100",
          iconColor: "text-purple-500",
        };
    }
  };

  // Get formatted date
  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInDays < 2) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notifications & Alerts</CardTitle>
        {unreadCount > 0 && (
          <Badge variant="outline">{unreadCount} new</Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <span className="loading">Loading notifications...</span>
          </div>
        ) : notifications?.length > 0 ? (
          <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto scrollbar-hide">
            {notifications.map((notification: any) => {
              const { icon, bgColor, iconColor } = getNotificationIcon(notification.type);
              return (
                <li key={notification.id} className={`hover:bg-gray-50 ${!notification.isRead ? "bg-gray-50" : ""}`}>
                  <div className="px-4 py-3 flex">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${iconColor}`}>
                        <span className="material-icons text-sm">{icon}</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{notification.title}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-gray-500">
                          {getFormattedDate(notification.dateCreated)}
                        </span>
                        <div className="ml-2 flex">
                          {notification.relatedId && (
                            <>
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary-600 hover:text-primary-900">
                                View
                              </Button>
                              <span className="mx-1 text-gray-300">|</span>
                            </>
                          )}
                          {!notification.isRead && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="h-auto p-0 text-xs text-gray-500 hover:text-gray-700"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Dismiss
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <span className="material-icons text-4xl mb-2">notifications_off</span>
            <p>No notifications</p>
          </div>
        )}
        <div className="p-4 border-t border-gray-200 bg-gray-50 mt-4">
          <div className="flex justify-between">
            <a href="/notifications" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all notifications
            </a>
            {unreadCount > 0 && (
              <Button 
                variant="link" 
                size="sm" 
                className="text-sm text-gray-500 hover:text-gray-700 p-0 h-auto"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
