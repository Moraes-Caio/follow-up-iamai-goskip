import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import {
  useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle,
} from 'react';
import { cn } from '@/lib/utils';
import { User, Users, Calendar, Clock, Building2, Stethoscope, Baby } from 'lucide-react';

// Variable definitions
const VARIABLES = [
  { id: 'nome_paciente', label: 'Nome do paciente', icon: User },
  { id: 'nome_responsavel', label: 'Nome do responsável', icon: Users },
  { id: 'idade', label: 'Idade do paciente', icon: Baby },
  { id: 'procedimento', label: 'Nome do procedimento', icon: Stethoscope },
  { id: 'data', label: 'Data da consulta', icon: Calendar },
  { id: 'horario', label: 'Horário da consulta', icon: Clock },
  { id: 'clinica', label: 'Nome da clínica', icon: Building2 },
];

// Suggestion list component
interface SuggestionListProps {
  items: typeof VARIABLES;
  command: (item: { id: string }) => void;
}

interface SuggestionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const SuggestionList = forwardRef<SuggestionListRef, SuggestionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          if (items[selectedIndex]) command(items[selectedIndex]);
          return true;
        }
        if (event.key === 'Escape') return true;
        return false;
      },
    }));

    if (items.length === 0) return null;

    return (
      <div className="w-80 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95 variable-dropdown overscroll-contain">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
              onClick={() => command(item)}
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{`{${item.id}}`}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }
);
SuggestionList.displayName = 'SuggestionList';

// Convert string with {variables} to TipTap JSON
function stringToContent(text: string): any {
  if (!text) return { type: 'doc', content: [{ type: 'paragraph' }] };

  const lines = text.split('\n');
  const paragraphs = lines.map((line) => {
    if (!line) return { type: 'paragraph' };
    const parts: any[] = [];
    const regex = /\{(\w+)\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', text: line.slice(lastIndex, match.index) });
      }
      const varId = match[1];
      const varDef = VARIABLES.find((v) => v.id === varId);
      if (varDef) {
        parts.push({
          type: 'mention',
          attrs: { id: varId, label: varDef.label },
        });
      } else {
        parts.push({ type: 'text', text: match[0] });
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) {
      parts.push({ type: 'text', text: line.slice(lastIndex) });
    }
    return { type: 'paragraph', content: parts.length > 0 ? parts : undefined };
  });

  return { type: 'doc', content: paragraphs };
}

// Convert TipTap JSON to string with {variables}
function contentToString(doc: any): string {
  if (!doc?.content) return '';
  return doc.content
    .map((node: any) => {
      if (!node.content) return '';
      return node.content
        .map((child: any) => {
          if (child.type === 'mention') return `{${child.attrs.id}}`;
          return child.text || '';
        })
        .join('');
    })
    .join('\n');
}

// Main editor component
interface VariableEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface VariableEditorRef {
  setContent: (text: string) => void;
}

export const VariableEditor = forwardRef<VariableEditorRef, VariableEditorProps>(
  ({ value, onChange, placeholder = 'Digite a mensagem...', className }, ref) => {
    const isInternalUpdate = useRef(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          bulletList: false,
          orderedList: false,
          blockquote: false,
          codeBlock: false,
          code: false,
          horizontalRule: false,
        }),
        Mention.configure({
          HTMLAttributes: {
            class: 'variable-chip',
          },
          suggestion: {
            char: '/',
            items: ({ query }: { query: string }) => {
              const q = query.toLowerCase();
              return VARIABLES.filter(
                (v) =>
                  v.id.toLowerCase().includes(q) ||
                  v.label.toLowerCase().includes(q)
              );
            },
            render: () => {
              let component: ReactRenderer<SuggestionListRef> | null = null;
              let popup: HTMLDivElement | null = null;

              const positionPopup = (props: SuggestionProps) => {
                if (!popup || !wrapperRef.current) return;
                const { clientRect } = props;
                if (!clientRect) return;
                const rect = clientRect();
                if (!rect) return;

                const wrapperRect = wrapperRef.current.getBoundingClientRect();
                const dropdownHeight = 256; // max-h-64

                // Check space relative to the modal dialog, not viewport
                const modal = wrapperRef.current.closest('[role="dialog"]');
                const bottomBound = modal
                  ? modal.getBoundingClientRect().bottom
                  : window.innerHeight;

                const spaceBelow = bottomBound - rect.bottom;
                const showAbove = spaceBelow < dropdownHeight + 20;

                // Position relative to wrapper
                const left = rect.left - wrapperRect.left;

                if (showAbove) {
                  const bottom = wrapperRect.bottom - rect.top + 4;
                  popup.style.top = '';
                  popup.style.bottom = `${bottom}px`;
                } else {
                  const top = rect.bottom - wrapperRect.top + 4;
                  popup.style.bottom = '';
                  popup.style.top = `${top}px`;
                }
                popup.style.left = `${Math.max(0, left)}px`;
              };

              return {
                onStart: (props: SuggestionProps) => {
                  popup = document.createElement('div');
                  popup.style.position = 'absolute';
                  popup.style.zIndex = '9999';

                  // Append inside wrapper so it scrolls with modal content
                  if (wrapperRef.current) {
                    wrapperRef.current.appendChild(popup);
                  }

                  component = new ReactRenderer(SuggestionList, {
                    props: { items: props.items, command: props.command },
                    editor: props.editor,
                  });

                  if (popup && component.element) {
                    popup.appendChild(component.element);
                  }

                  positionPopup(props);
                },
                onUpdate: (props: SuggestionProps) => {
                  component?.updateProps({
                    items: props.items,
                    command: props.command,
                  });
                  positionPopup(props);
                },
                onKeyDown: (props: SuggestionKeyDownProps) => {
                  if (props.event.key === 'Escape') {
                    popup?.remove();
                    component?.destroy();
                    popup = null;
                    component = null;
                    return true;
                  }
                  return component?.ref?.onKeyDown(props) ?? false;
                },
                onExit: () => {
                  popup?.remove();
                  component?.destroy();
                  popup = null;
                  component = null;
                },
              };
            },
          },
          renderHTML({ node }) {
            return [
              'span',
              {
                class: 'variable-chip',
                'data-type': 'mention',
                'data-id': node.attrs.id,
              },
              `{${node.attrs.id}}`,
            ];
          },
        }),
      ],
      content: stringToContent(value),
      onUpdate: ({ editor }) => {
        isInternalUpdate.current = true;
        const text = contentToString(editor.getJSON());
        onChange(text);
      },
      editorProps: {
        attributes: {
          class: cn(
            'h-40 max-h-40 overflow-y-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'prose prose-sm max-w-none [&_p]:my-0.5 resize-none',
            className
          ),
        },
      },
    });

    // Expose setContent method for external updates (AI responses)
    useImperativeHandle(ref, () => ({
      setContent: (text: string) => {
        if (editor) {
          isInternalUpdate.current = true;
          editor.commands.setContent(stringToContent(text));
        }
      },
    }));

    // Sync external value changes (only if not triggered internally)
    useEffect(() => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }
      if (editor && value !== contentToString(editor.getJSON())) {
        editor.commands.setContent(stringToContent(value));
      }
    }, [value, editor]);

    return (
      <div ref={wrapperRef} className="variable-editor-wrapper relative">
        <EditorContent editor={editor} />
        <style>{`
          .variable-chip {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            background-color: hsl(var(--primary) / 0.1);
            color: hsl(var(--primary));
            border: 1px solid hsl(var(--primary) / 0.2);
            border-radius: 4px;
            padding: 1px 6px;
            font-size: 0.8em;
            font-weight: 500;
            white-space: nowrap;
            vertical-align: baseline;
            cursor: default;
            user-select: none;
          }
          .variable-chip:hover {
            background-color: hsl(var(--primary) / 0.15);
          }
          .variable-editor-wrapper .ProseMirror {
            outline: none;
          }
          .variable-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: hsl(var(--muted-foreground));
            pointer-events: none;
            height: 0;
          }
          .variable-dropdown::-webkit-scrollbar {
            width: 6px;
          }
          .variable-dropdown::-webkit-scrollbar-track {
            background: hsl(var(--muted));
            border-radius: 3px;
          }
          .variable-dropdown::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.3);
            border-radius: 3px;
          }
          .variable-dropdown::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5);
          }
        `}</style>
      </div>
    );
  }
);
VariableEditor.displayName = 'VariableEditor';
