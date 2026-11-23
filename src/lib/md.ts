/** Tiny inline Markdown for frontmatter strings: [text](url), **bold**, *em*. Escapes HTML first. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function mdInline(src: string): string {
  return esc(src)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, href: string) => {
      const ext = /^https?:\/\//.test(href);
      return `<a href="${href}"${ext ? ' rel="noopener noreferrer"' : ''}>${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}
