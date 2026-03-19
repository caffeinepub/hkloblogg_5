import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Category } from "../backend.d";

const MotionDialog = motion.create("dialog");

interface CategoryBottomSheetProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  activeCatId: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryBottomSheet({
  open,
  onClose,
  categories,
  activeCatId,
  onSelect,
}: CategoryBottomSheetProps) {
  const sheetRef = useRef<HTMLDialogElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef<number>(0);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const el = sheetRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    first?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Swipe down to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy < 0) return;
    dragCurrentY.current = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      sheetRef.current.style.transform = "";
    }
    if (dragCurrentY.current > 80) {
      onClose();
    }
    dragStartY.current = null;
    dragCurrentY.current = 0;
  };

  const handleSelect = (id: string | null) => {
    onSelect(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            data-ocid="category_sheet.backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <MotionDialog
            ref={sheetRef}
            open
            data-ocid="category_sheet.panel"
            aria-label="V\u00e4lj kategori"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-card rounded-t-2xl shadow-2xl border-t border-border m-0 p-0 max-w-none w-full"
            style={{ maxHeight: "70vh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-border">
              <h2 className="font-display text-base font-semibold text-foreground">
                Kategorier
              </h2>
              <button
                type="button"
                data-ocid="category_sheet.close_button"
                onClick={onClose}
                aria-label="St\u00e4ng kategoripanel"
                className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category list */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-1">
              <button
                type="button"
                data-ocid="category_sheet.all.button"
                onClick={() => handleSelect(null)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 min-h-[48px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  activeCatId === null
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                Alla inl\u00e4gg
              </button>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  data-ocid="category_sheet.category.button"
                  onClick={() => handleSelect(cat.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 min-h-[48px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    activeCatId === cat.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Safe area spacer */}
            <div className="shrink-0 pb-4" />
          </MotionDialog>
        </>
      )}
    </AnimatePresence>
  );
}
