import { useEffect, useRef, useState } from "react";
import { BookOpen, Clock, Tag, X } from "lucide-react";
import { Button } from "../ui/button";
import { useNewsStore } from "../../store/news";

export interface Article {
  id: string;
  category: string;
  title: string;
  summary: string;
  author: string;
  readTime: number;
  publishedAt: string;
}

export const ARTICLES: Article[] = [
  {
    id: "ai-sign-language",
    category: "AI",
    title: "Researchers Develop Real-Time Sign Language Translation Using Computer Vision",
    summary:
      "A team at MIT has built a system that translates American Sign Language into text with 94% accuracy using lightweight neural networks that run entirely on-device.",
    author: "Jordan Kim",
    readTime: 4,
    publishedAt: "2 hours ago",
  },
  {
    id: "open-source-llm",
    category: "Open Source",
    title: "Meta Releases Next-Generation Language Model Under Permissive License",
    summary:
      "The 70-billion parameter model outperforms several proprietary competitors on standard benchmarks and is free to use for commercial applications.",
    author: "Alex Rivera",
    readTime: 6,
    publishedAt: "5 hours ago",
  },
  {
    id: "accessibility-web",
    category: "Accessibility",
    title: "New W3C Guidelines Mandate Richer Semantic Markup for Interactive Elements",
    summary:
      "WCAG 3.0 draft raises the bar for keyboard navigation and screen reader support, giving developers 18 months to comply before enforcement begins.",
    author: "Sam Okonkwo",
    readTime: 3,
    publishedAt: "Yesterday",
  },
  {
    id: "webgpu-gains",
    category: "WebGPU",
    title: "WebGPU Lands in Firefox Stable, Completing Cross-Browser Support",
    summary:
      "With the final major browser adding support, WebGPU-powered 3D applications can now reach virtually all desktop users without a flag or polyfill.",
    author: "Priya Nair",
    readTime: 5,
    publishedAt: "Yesterday",
  },
  {
    id: "voice-ui-comeback",
    category: "UX",
    title: "Voice Interfaces See Renaissance in Accessibility-Focused Products",
    summary:
      "Startup funding for voice-first assistive technology doubled in 2025 as designers pivot away from touch-only paradigms for users with motor impairments.",
    author: "Chris Adler",
    readTime: 7,
    publishedAt: "2 days ago",
  },
  {
    id: "edge-inference",
    category: "AI",
    title: "On-Device Inference Now Feasible for 7B Models on Mid-Range Phones",
    summary:
      "Quantization breakthroughs let 7-billion parameter models run at 12 tokens/second on 2023 flagship chips, opening the door to fully offline AI assistants.",
    author: "Dana Wu",
    readTime: 5,
    publishedAt: "3 days ago",
  },
];

const CATEGORIES = ["All", "AI", "Open Source", "Accessibility", "WebGPU", "UX"];

export function MockNews() {
  const { activeCategory, setActiveCategory, readArticles, markRead, markAllRead } = useNewsStore();
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (activeArticle) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setActiveArticle(null);
        if (e.key === "Tab") {
          const focusable = document.querySelectorAll('#close-article, [id^="mark-read-"]');
          if (focusable.length < 2) return;
          const first = focusable[0] as HTMLElement;
          const last = focusable[focusable.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        lastFocusedRef.current?.focus();
      };
    }
  }, [activeArticle]);

  const filtered =
    activeCategory === "All" ? ARTICLES : ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <div
      data-scene="news"
      className="w-full h-full bg-background text-foreground overflow-y-auto pb-40"
    >
      {/* Hidden LLM-actionable triggers */}
      <button
        id="mark-all-read"
        className="sr-only"
        tabIndex={-1}
        aria-label="Mark all articles as read"
        onClick={() => markAllRead(ARTICLES.map((a) => a.id))}
      />
      <button
        id="filter-ai"
        className="sr-only"
        tabIndex={-1}
        aria-label="Filter articles by AI category"
        onClick={() => setActiveCategory("AI")}
      />
      <button
        id="filter-all"
        className="sr-only"
        tabIndex={-1}
        aria-label="Show all articles"
        onClick={() => setActiveCategory("All")}
      />
      <button
        id="filter-accessibility"
        className="sr-only"
        tabIndex={-1}
        aria-label="Filter articles by Accessibility category"
        onClick={() => setActiveCategory("Accessibility")}
      />

      {/* Site Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <span className="font-bold text-base tracking-tight">TechPulse</span>
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 mt-0.5">
              Daily
            </span>
          </div>

          <nav className="flex items-center gap-1" aria-label="Category filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`filter-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                aria-pressed={activeCategory === cat}
                aria-label={`Filter by ${cat}`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Article Detail Overlay */}
      {activeArticle && (
        <div
          className="absolute inset-0 z-20 bg-background/95 backdrop-blur-md overflow-y-auto p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-detail-title"
        >
          <div className="max-w-[720px] mx-auto pt-4">
            <button
              ref={closeButtonRef}
              onClick={() => setActiveArticle(null)}
              id="close-article"
              aria-label="Close article"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none rounded-sm"
            >
              <X size={14} />
              Back to feed
            </button>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {activeArticle.category}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={11} /> {activeArticle.readTime} min read
              </span>
            </div>
            <h1
              id="article-detail-title"
              className="text-2xl font-bold leading-snug mb-4 text-foreground"
            >
              {activeArticle.title}
            </h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              By {activeArticle.author} · {activeArticle.publishedAt}
            </p>
            <p className="text-base leading-relaxed text-foreground/90">{activeArticle.summary}</p>
            <p className="text-base leading-relaxed text-foreground/80 mt-4">
              Further reporting on this story is ongoing. Check back for updates as more details
              emerge from researchers and industry partners.
            </p>
            <Button
              id={`mark-read-${activeArticle.id}`}
              onClick={() => {
                markRead(activeArticle.id);
                setActiveArticle(null);
              }}
              variant="outline"
              size="sm"
              className="mt-8 text-xs"
              aria-label={`Mark ${activeArticle.title} as read`}
            >
              Mark as read
            </Button>
          </div>
        </div>
      )}

      {/* Feed */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Tag size={14} className="text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {activeCategory === "All" ? "Latest Stories" : activeCategory}
          </h2>
          <span className="text-xs text-muted-foreground">· {filtered.length} articles</span>
        </div>

        <div className="flex flex-col gap-4">
          {filtered.map((article, idx) => (
            <article
              key={article.id}
              id={`article-${article.id}`}
              tabIndex={0}
              aria-label={`${article.title}. ${article.readTime} minute read. ${readArticles.has(article.id) ? "Read." : "Unread."}`}
              className={`group relative bg-card rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md hover:border-primary/20 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                readArticles.has(article.id) ? "border-border opacity-60" : "border-border"
              } ${idx === 0 ? "p-5 md:p-6" : "p-4 md:p-5"}`}
              onClick={() => setActiveArticle(article)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setActiveArticle(article);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {article.category}
                    </span>
                    {readArticles.has(article.id) && (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Read
                      </span>
                    )}
                  </div>
                  <h3
                    className={`font-bold leading-snug text-foreground group-hover:text-primary transition-colors ${
                      idx === 0 ? "text-lg" : "text-base"
                    }`}
                  >
                    {article.title}
                  </h3>
                  {idx === 0 && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                    <span className="font-medium">{article.author}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {article.readTime} min
                    </span>
                    <span>·</span>
                    <span>{article.publishedAt}</span>
                  </div>
                </div>
              </div>

              {/* Hidden per-article agent triggers */}
              <button
                id={`read-${article.id}`}
                className="sr-only"
                tabIndex={-1}
                aria-label={`Open article: ${article.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveArticle(article);
                }}
              />
              <button
                id={`mark-read-${article.id}`}
                className="sr-only"
                tabIndex={-1}
                aria-label={`Mark ${article.title} as read`}
                onClick={(e) => {
                  e.stopPropagation();
                  markRead(article.id);
                }}
              />
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
