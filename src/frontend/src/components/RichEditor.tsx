import { useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import EmojiPicker from "./EmojiPicker";

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLBAR_MODULES = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const FORMATS = ["bold", "italic", "underline", "list", "bullet", "link"];

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
      // Fallback: strip trailing </p> and append emoji
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
      <div className="rich-editor-emoji-btn">
        <EmojiPicker onSelect={insertEmoji} />
      </div>
    </div>
  );
}
