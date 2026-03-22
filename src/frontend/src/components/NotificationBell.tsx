import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { useState } from "react";
import type { Notification, NotificationEvent } from "../backend.d";
import {
  useGetMyNotifications,
  useGetUnreadNotificationCount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../hooks/useQueries";

interface NotificationTranslations {
  notifications: string;
  markAllRead: string;
  noNotifications: string;
  newComment: string;
  newReply: string;
  newMedia: string;
  newEvent: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  postLabel: string;
}

const defaultT: NotificationTranslations = {
  notifications: "Notiser",
  markAllRead: "Markera alla som lästa",
  noNotifications: "Inga notiser ännu",
  newComment: "Ny kommentar",
  newReply: "Nytt svar",
  newMedia: "Ny media",
  newEvent: "Ny händelse",
  justNow: "Just nu",
  minutesAgo: "min sedan",
  hoursAgo: "tim sedan",
  daysAgo: "dag sedan",
  postLabel: "Inlägg:",
};

function eventLabel(
  event: NotificationEvent,
  t: NotificationTranslations,
): string {
  if ("NewComment" in event) return t.newComment;
  if ("NewReply" in event) return t.newReply;
  if ("NewMedia" in event) return t.newMedia;
  return t.newEvent;
}

function timeAgo(createdAt: bigint, t: NotificationTranslations): string {
  const ms = Number(createdAt) / 1_000_000;
  const diffSec = Math.floor((Date.now() - ms) / 1000);
  if (diffSec < 60) return t.justNow;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} ${t.minutesAgo}`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ${t.hoursAgo}`;
  return `${Math.floor(diffSec / 86400)} ${t.daysAgo}`;
}

interface NotificationBellProps {
  onPost?: (id: string) => void;
  t?: NotificationTranslations;
}

export default function NotificationBell({
  onPost,
  t = defaultT,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { data: unreadCount } = useGetUnreadNotificationCount();
  const { data: notifications } = useGetMyNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markOneRead = useMarkNotificationRead();

  const unread = Number(unreadCount ?? BigInt(0));
  const recent = [...(notifications ?? [])]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 10);

  const handleClickNotif = async (notif: Notification) => {
    if (!notif.read) {
      await markOneRead.mutateAsync(notif.id).catch(() => {});
    }
    if (onPost) {
      onPost(notif.postId);
      setOpen(false);
    }
  };

  const handleMarkAll = async () => {
    await markAllRead.mutateAsync().catch(() => {});
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label={t.notifications}
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-medium text-sm">{t.notifications}</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary h-auto py-1 px-2"
              onClick={handleMarkAll}
              disabled={markAllRead.isPending}
            >
              {t.markAllRead}
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t.noNotifications}
            </div>
          ) : (
            recent.map((notif) => (
              <button
                type="button"
                key={notif.id.toString()}
                onClick={() => handleClickNotif(notif)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors ${!notif.read ? "bg-blue-50/50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {eventLabel(notif.event, t)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.postLabel} {notif.postId}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground/70 shrink-0">
                    {timeAgo(notif.createdAt, t)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
