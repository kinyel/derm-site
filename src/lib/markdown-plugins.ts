/**
 * Small remark/rehype plugins (no dependencies).
 *  - remarkFacts:    fills {{tokens}} from clinic.ts in text, links and raw HTML
 *  - remarkCallouts: turns "> [!DERM] Title" blockquotes into <aside class="callout …">
 *  - rehypePolish:   wraps tables for small screens, marks external links
 */
import { fill } from './facts.ts';

type Node = { type: string; value?: string; url?: string; children?: Node[]; data?: Record<string, unknown>; [k: string]: unknown };

function walk(node: Node, fn: (n: Node, parent: Node | null, index: number) => void, parent: Node | null = null, index = 0) {
  fn(node, parent, index);
  if (node.children) node.children.forEach((c, i) => walk(c, fn, node, i));
}

export function remarkFacts() {
  return (tree: unknown) => {
    walk(tree as Node, (n) => {
      if ((n.type === 'text' || n.type === 'html' || n.type === 'inlineCode') && typeof n.value === 'string') n.value = fill(n.value);
      if ((n.type === 'link' || n.type === 'image') && typeof n.url === 'string') n.url = fill(decodeURI(n.url));
    });
  };
}

export const calloutTypes: Record<string, { cls: string; title: string; icon: string }> = {
  DERM: { cls: 'derm', title: 'See a dermatologist if', icon: 'stethoscope' },
  DOCTOR: { cls: 'derm', title: 'See a doctor if', icon: 'stethoscope' },
  URGENT: { cls: 'urgent', title: 'Urgent care', icon: 'alert' },
  DIDYOUKNOW: { cls: 'know', title: 'Did you know', icon: 'spark' },
  AVOID: { cls: 'avoid', title: 'What to avoid', icon: 'shield' },
};

export function remarkCallouts() {
  return (tree: unknown) => {
    walk(tree as Node, (n) => {
      if (n.type !== 'blockquote' || !n.children?.length) return;
      const first = n.children[0];
      const text = first?.type === 'paragraph' ? first.children?.[0] : undefined;
      if (!text || text.type !== 'text' || typeof text.value !== 'string') return;
      const m = text.value.match(/^\[!(\w+)\][ \t]*([^\n]*)\n?/);
      if (!m) return;
      const def = calloutTypes[m[1].toUpperCase()];
      if (!def) return;
      const title = m[2].trim() || def.title;
      text.value = text.value.slice(m[0].length);
      if (!text.value && first.children) first.children.shift();
      if (first.children && first.children.length === 0) n.children.shift();
      n.children.unshift({
        type: 'paragraph',
        data: { hName: 'p', hProperties: { class: 'callout__title' } },
        children: [{ type: 'text', value: title }],
      });
      n.data = { hName: 'aside', hProperties: { class: `callout callout--${def.cls}`, 'data-icon': def.icon, role: 'note' } };
    });
  };
}

type HNode = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: HNode[] };

export function rehypePolish() {
  return (root: unknown) => {
    const tree = root as HNode;
    const visit = (node: HNode) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'element' && child.tagName === 'table') {
          return {
            type: 'element',
            tagName: 'div',
            properties: { class: 'table-wrap', tabindex: '0', role: 'region', 'aria-label': 'Table, scroll sideways if needed' },
            children: [child],
          };
        }
        if (child.type === 'element' && child.tagName === 'a') {
          const href = String(child.properties?.href ?? '');
          if (/^https?:\/\//.test(href)) child.properties = { ...child.properties, rel: 'noopener noreferrer' };
        }
        visit(child);
        return child;
      });
    };
    visit(tree);
  };
}
