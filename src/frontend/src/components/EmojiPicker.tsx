import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { useState } from "react";

const EMOJIS = [
  "😀",
  "😄",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🥰",
  "😍",
  "😘",
  "😋",
  "😎",
  "🤩",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "😢",
  "😭",
  "😤",
  "😠",
  "🤬",
  "🤯",
  "😱",
  "🤔",
  "🤗",
  "🤭",
  "🤫",
  "🤥",
  "😶",
  "😐",
  "🙄",
  "😬",
  "🥴",
  "😴",
  "🥱",
  "🤧",
  "🤒",
  "🤕",
  "👍",
  "👎",
  "👏",
  "🙌",
  "🤝",
  "🙏",
  "💪",
  "✌️",
  "🤞",
  "👋",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "💔",
  "💯",
  "🎉",
  "🎊",
  "🎈",
  "🎁",
  "🏆",
  "🥇",
  "⭐",
  "✨",
  "💫",
  "🌟",
  "🔥",
  "💥",
  "❄️",
  "🌈",
  "☀️",
  "🌙",
  "⚡",
  "💧",
  "🌊",
  "🌸",
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-ocid="emoji.open_modal_button"
          title="Välj emoji"
          className="inline-flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <SmilePlus className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-ocid="emoji.popover"
        className="w-64 p-2"
        align="start"
        side="top"
      >
        <div className="grid grid-cols-10 gap-0.5">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="flex items-center justify-center w-6 h-6 text-sm rounded hover:bg-muted transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
