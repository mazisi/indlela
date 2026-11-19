import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

export interface RichTextEditorHandle {
  /** Inserts text at the cursor (or the end), e.g. a {{placeholder}}. */
  insert: (text: string) => void;
}

interface Props {
  id: string;
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  /** Labels the editing area for screen readers. */
  label: string;
  invalid?: boolean;
  describedBy?: string;
  ref?: Ref<RichTextEditorHandle>;
}

const MODULES = {
  toolbar: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']],
};

/** Rich text (HTML) with a compact toolbar, as in bee-compliance; styled by `.rich-text` in index.css. */
export function RichTextEditor({ id, value, onChange, readOnly = false, label, invalid, describedBy, ref }: Props) {
  const quill = useRef<ReactQuill>(null);

  useImperativeHandle(ref, () => ({
    insert: (text: string) => {
      const editor = quill.current?.getEditor();
      if (!editor) return;
      const at = editor.getSelection(true)?.index ?? editor.getLength() - 1;
      editor.insertText(at, text, 'user');
      editor.setSelection(at + text.length, 0, 'user');
    },
  }));

  // Quill owns its editing area: label it there for screen readers.
  useEffect(() => {
    const root = quill.current?.getEditor().root;
    if (!root) return;
    root.setAttribute('aria-label', label);
    root.setAttribute('aria-multiline', 'true');
    root.setAttribute('role', 'textbox');
    if (describedBy) root.setAttribute('aria-describedby', describedBy);
    else root.removeAttribute('aria-describedby');
    root.toggleAttribute('aria-invalid', Boolean(invalid));
  }, [label, describedBy, invalid]);

  return (
    <div id={id} className="rich-text" data-invalid={invalid || undefined}>
      <ReactQuill
        ref={quill}
        theme="snow"
        value={value}
        onChange={(html, _delta, source) => source === 'user' && onChange(html)}
        readOnly={readOnly}
        modules={MODULES}
      />
    </div>
  );
}
