/** The label with the part matching the menu search marked (case-insensitive). */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return text;

  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-sm bg-warn-soft px-px font-semibold text-foreground">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}
