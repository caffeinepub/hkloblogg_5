import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { BookOpen, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin, useMyProfile } from "./hooks/useQueries";
import AdminPanel from "./pages/AdminPanel";
import FeedPage from "./pages/FeedPage";
import LoginPage from "./pages/LoginPage";
import PostForm from "./pages/PostForm";
import PostView from "./pages/PostView";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";

type View =
  | { name: "feed" }
  | { name: "post"; postId: string }
  | { name: "create-post" }
  | { name: "edit-post"; postId: string }
  | { name: "admin" }
  | { name: "search"; query: string }
  | { name: "profile" };

const LOADING_TIMEOUT_MS = 15_000;

function AppShell() {
  const { identity, isInitializing, clear } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { isLoading: adminLoading } = useIsAdmin();
  const [view, setView] = useState<View>({ name: "feed" });
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoading =
    isInitializing ||
    actorFetching ||
    (identity && (profileLoading || adminLoading));

  // Start a timeout whenever the loading state begins; clear it when done.
  useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(
        () => setTimedOut(true),
        LOADING_TIMEOUT_MS,
      );
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTimedOut(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading]);

  if (isLoading) {
    if (timedOut) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <div className="h-1 bg-primary w-full" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-xs px-4">
              <BookOpen
                className="w-10 h-10 text-primary mx-auto"
                strokeWidth={1.5}
              />
              <p className="text-sm text-muted-foreground">
                Inläsningen tar längre tid än väntat.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  data-ocid="app.reload_button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Ladda om sidan
                </Button>
                {identity && (
                  <Button
                    data-ocid="app.logout_button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={clear}
                  >
                    Logga ut och försök igen
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-1 bg-primary w-full" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <BookOpen
              className="w-10 h-10 text-primary mx-auto"
              strokeWidth={1.5}
            />
            <div className="space-y-2">
              <Skeleton className="h-3 w-32 mx-auto" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!identity) return <LoginPage />;

  const hasProfile = !!profile;

  if (view.name === "profile") {
    return (
      <ProfilePage
        profile={profile ?? null}
        onBack={() => setView({ name: "feed" })}
        onLogout={clear}
      />
    );
  }

  if (view.name === "admin") {
    return <AdminPanel onBack={() => setView({ name: "feed" })} />;
  }

  if (view.name === "search") {
    return (
      <SearchPage
        initialQuery={view.query}
        onBack={() => setView({ name: "feed" })}
        onPost={(postId) => setView({ name: "post", postId })}
      />
    );
  }

  if (view.name === "post") {
    return (
      <PostView
        postId={view.postId}
        onBack={() => setView({ name: "feed" })}
        onEdit={(id) => setView({ name: "edit-post", postId: id })}
        onAdminPanel={() => setView({ name: "admin" })}
        onSearch={(query) => setView({ name: "search", query })}
      />
    );
  }

  if (view.name === "create-post") {
    return (
      <PostForm
        mode="create"
        onBack={() => setView({ name: "feed" })}
        onSuccess={(postId) =>
          postId ? setView({ name: "post", postId }) : setView({ name: "feed" })
        }
        onAdminPanel={() => setView({ name: "admin" })}
      />
    );
  }

  if (view.name === "edit-post") {
    return (
      <PostForm
        mode="edit"
        postId={view.postId}
        onBack={() => setView({ name: "post", postId: view.postId })}
        onSuccess={(postId) =>
          postId ? setView({ name: "post", postId }) : setView({ name: "feed" })
        }
        onAdminPanel={() => setView({ name: "admin" })}
      />
    );
  }

  return (
    <FeedPage
      hasProfile={hasProfile}
      onPost={(id) => setView({ name: "post", postId: id })}
      onCreatePost={() => setView({ name: "create-post" })}
      onAdminPanel={() => setView({ name: "admin" })}
      onSearch={(query) => setView({ name: "search", query })}
      onProfile={() => setView({ name: "profile" })}
    />
  );
}

export default function App() {
  return (
    <>
      <AppShell />
      <Toaster position="bottom-right" richColors />
    </>
  );
}
