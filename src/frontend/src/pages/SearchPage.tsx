import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, MessageCircle, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import AuthorName from "../components/AuthorName";
import { useSearch } from "../hooks/useQueries";

interface SearchPageProps {
  initialQuery: string;
  onBack: () => void;
  onPost: (postId: string) => void;
}

export default function SearchPage({
  initialQuery,
  onBack,
  onPost,
}: SearchPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);

  const { data, isLoading } = useSearch(submittedQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query.trim());
  };

  const posts = data?.posts ?? [];
  const comments = data?.comments ?? [];
  const hasResults = posts.length > 0 || comments.length > 0;

  return (
    <div className="min-h-screen leaf-bg-page flex flex-col">
      <div className="h-1 bg-primary w-full" />

      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button
            data-ocid="search.back.button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground -ml-2 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Tillbaka
          </Button>
          <div className="flex items-center gap-2 shrink-0">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="font-display text-xl text-foreground hidden sm:inline">
              HKLOblogg
            </span>
          </div>
          <form onSubmit={handleSearch} className="flex-1 flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-ocid="search.query.input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök inlägg, kommentarer, författare…"
                className="pl-9 h-9 text-sm"
                autoFocus
              />
            </div>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {submittedQuery && (
          <p className="text-sm text-muted-foreground mb-6">
            Sökresultat för{" "}
            <span className="font-medium text-foreground">
              &ldquo;{submittedQuery}&rdquo;
            </span>
          </p>
        )}

        {isLoading ? (
          <div data-ocid="search.loading_state" className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-5"
              >
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ))}
          </div>
        ) : !submittedQuery ? (
          <div
            data-ocid="search.empty_state"
            className="py-20 text-center text-muted-foreground"
          >
            <Search
              className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40"
              strokeWidth={1}
            />
            <p>Ange en sökfråga ovan för att hitta inlägg och kommentarer.</p>
          </div>
        ) : !hasResults ? (
          <div
            data-ocid="search.empty_state"
            className="py-20 text-center text-muted-foreground"
          >
            <Search
              className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40"
              strokeWidth={1}
            />
            <p>
              Inga resultat för &ldquo;{submittedQuery}&rdquo;. Prova ett annat
              sökord.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Posts results */}
            {posts.length > 0 && (
              <section>
                <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                  <BookOpen
                    className="w-4 h-4 text-primary"
                    strokeWidth={1.5}
                  />
                  Inlägg
                  <span className="text-muted-foreground font-sans text-sm font-normal">
                    ({posts.length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {posts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      data-ocid={`search.post.item.${i + 1}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => onPost(post.id)}
                      className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
                    >
                      <h3 className="font-display text-base text-foreground group-hover:text-primary transition-colors mb-1">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AuthorName principal={post.authorPrincipal} />
                        <span>·</span>
                        <time>
                          {new Date(
                            Number(post.createdAt) / 1_000_000,
                          ).toLocaleDateString("sv-SE")}
                        </time>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Comments results */}
            {comments.length > 0 && (
              <section>
                <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
                  <MessageCircle
                    className="w-4 h-4 text-primary"
                    strokeWidth={1.5}
                  />
                  Kommentarer
                  <span className="text-muted-foreground font-sans text-sm font-normal">
                    ({comments.length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {comments.map((comment, i) => (
                    <motion.div
                      key={comment.id}
                      data-ocid={`search.comment.item.${i + 1}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => onPost(comment.postId)}
                      className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
                    >
                      <p className="text-sm text-foreground line-clamp-2 mb-2">
                        {comment.body}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AuthorName principal={comment.authorPrincipal} />
                        <span>·</span>
                        <time>
                          {new Date(
                            Number(comment.createdAt) / 1_000_000,
                          ).toLocaleDateString("sv-SE")}
                        </time>
                        <span>·</span>
                        <span className="text-primary">Visa inlägg →</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border leaf-bg-footer">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Byggd med ❤ via caffeine.ai
        </a>
      </footer>
    </div>
  );
}
