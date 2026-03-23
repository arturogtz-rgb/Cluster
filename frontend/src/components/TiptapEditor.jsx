import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Quote,
  Minus,
  Code,
} from "lucide-react";

const MenuButton = ({ onClick, isActive, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg transition-colors ${
      isActive
        ? "bg-forest/10 text-forest"
        : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
    }`}
  >
    {children}
  </button>
);

const TiptapEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-forest underline" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg my-4 max-w-full" },
      }),
      Placeholder.configure({
        placeholder: "Escribe el contenido del artículo aquí...",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-stone prose-sm max-w-none min-h-[320px] p-5 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = prompt("URL del enlace:");
    if (!url) return;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  const addImage = () => {
    const url = prompt("URL de la imagen:");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div
      className="border border-stone-200 rounded-xl overflow-hidden bg-white"
      data-testid="tiptap-editor"
    >
      {/* Toolbar */}
      <div className="bg-stone-50 p-2 border-b border-stone-200 flex flex-wrap gap-0.5">
        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title="Encabezado H2"
        >
          <Heading2 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          title="Encabezado H3"
        >
          <Heading3 className="w-4 h-4" />
        </MenuButton>

        <div className="w-px bg-stone-300 mx-1 self-stretch" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Negrita"
        >
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Cursiva"
        >
          <Italic className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Código"
        >
          <Code className="w-4 h-4" />
        </MenuButton>

        <div className="w-px bg-stone-300 mx-1 self-stretch" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Lista con viñetas"
        >
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Cita"
        >
          <Quote className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Línea horizontal"
        >
          <Minus className="w-4 h-4" />
        </MenuButton>

        <div className="w-px bg-stone-300 mx-1 self-stretch" />

        <MenuButton onClick={addLink} isActive={editor.isActive("link")} title="Enlace">
          <LinkIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton onClick={addImage} title="Insertar imagen">
          <ImageIcon className="w-4 h-4" />
        </MenuButton>

        <div className="w-px bg-stone-300 mx-1 self-stretch" />

        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Deshacer"
        >
          <Undo2 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Rehacer"
        >
          <Redo2 className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
