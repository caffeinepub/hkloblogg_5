import { useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen } from "lucide-react";
import EmojiPicker from "./EmojiPicker";

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLBAR_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }],
    ["link", "clean"],
  ],
};

const FORMATS = [
  "bold",
  "italic",
  "underline",
  "strike",
  "header",
  "list",
  "bullet",
  "blockquote",
  "code-block",
  "indent",
  "align",
  "link",
];

const LOOKUP_LINKS = [
  {
    label: "Synonymer (SV)",
    url: (word: string) =>
      `https://www.synonymer.se/?sok=${encodeURIComponent(word)}`,
  },
  {
    label: "Synonymer (EN)",
    url: (word: string) =>
      `https://www.thesaurus.com/browse/${encodeURIComponent(word)}`,
  },
  {
    label: "Definition (SV)",
    url: (word: string) =>
      `https://svenska.se/tri/f_saol.php?sok=${encodeURIComponent(word)}`,
  },
  {
    label: "Definition (EN)",
    url: (word: string) =>
      `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`,
  },
];

function WordLookupButton() {
  const [open, setOpen] = useState(false);

  const getSelectedWord = () => window.getSelection()?.toString().trim() || "";
  const selectedWord = open ? getSelectedWord() : "";

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const word = getSelectedWord();
      if (!word) return;
    }
    setOpen(next);
  };

  const hasSelection = () => !!window.getSelection()?.toString().trim();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger
              data-ocid="rich_editor.word_lookup_button"
              className="inline-flex items-center justify-center rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={(e) => {
                if (!hasSelection()) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <BookOpen className="h-4 w-4" />
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Markera ett ord först</p>
          </TooltipContent>
          <DropdownMenuContent align="start" className="w-44">
            {LOOKUP_LINKS.map((item) => (
              <DropdownMenuItem
                key={item.label}
                onSelect={() => {
                  window.open(
                    item.url(selectedWord),
                    "_blank",
                    "noopener,noreferrer",
                  );
                  setOpen(false);
                }}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function RichEditor({
  value,
  onChange,
  placeholder = "Skriv här...",
  minHeight = 160,
}: RichEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  const insertEmoji = (emoji: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection(true);
      quill.insertText(range ? range.index : quill.getLength() - 1, emoji);
      onChange(quill.root.innerHTML);
    } else {
      onChange(value + emoji);
    }
  };

  return (
    <div
      data-ocid="rich_editor.editor"
      className="rich-editor-wrapper relative"
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={TOOLBAR_MODULES}
        formats={FORMATS}
        style={{ minHeight }}
      />
      <div className="rich-editor-emoji-btn flex items-center gap-1">
        <WordLookupButton />
        <EmojiPicker onSelect={insertEmoji} />
      </div>
    </div>
  );
}
