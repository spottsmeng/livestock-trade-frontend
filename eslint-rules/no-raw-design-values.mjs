/**
 * §15.1 — "Enforce with an ESLint rule banning raw hex values and arbitrary
 * Tailwind values outside the token layer." This rule never existed before
 * Phase 5 (confirmed: eslint.config.mjs only extended eslint-config-next's
 * defaults). A local, dependency-free rule rather than eslint-plugin-
 * tailwindcss — that plugin's Tailwind v4 / ESLint 9 flat-config support is
 * inconsistent, and this is simple enough to own directly.
 *
 * Flags two things, scoped to `className` JSX attributes and `cn()`/`cva()`
 * calls (not every string literal in the codebase, to avoid false positives
 * on unrelated strings like API paths or copy text):
 *   1. Raw hex colors (`#fff`, `#1c63d6`, ...) — must go through a token
 *      instead (`color.*` in packages/design-tokens/tokens.json).
 *   2. Tailwind arbitrary values (`min-h-[56px]`, `bg-[#fff]`, ...) — must
 *      use a token-scale utility class instead. Deliberately does NOT flag
 *      Tailwind's variant-bracket syntax (`data-[state=open]:...`,
 *      `aria-[expanded=true]:...`) — that's a conditional selector, not an
 *      arbitrary VALUE, and is normal, idiomatic Tailwind (distinguished by
 *      the bracket being immediately followed by `:`).
 *
 * A genuinely value-less case (no token or Tailwind scale step expresses
 * it — e.g. a viewport-relative max-height, or a specific pixel minimum a
 * wide table needs) is a real, narrow exception: disable with
 * `// eslint-disable-next-line local/no-raw-design-values` and a comment
 * explaining why, the way components/reference-data/dnbp-model-panel.tsx
 * and app/buy-instructions/[id]/page.tsx do — never a blanket suppression.
 */

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
// utility-prefix-[value], not immediately followed by ':' (which would make
// it a variant selector like data-[state=open]:, not an arbitrary value).
const ARBITRARY_VALUE_RE = /[A-Za-z][\w-]*-\[[^\]]+\](?!:)/g;

function reportMatches(context, node, raw) {
  let match;
  HEX_RE.lastIndex = 0;
  while ((match = HEX_RE.exec(raw)) !== null) {
    context.report({ node, messageId: "hex", data: { value: match[0] } });
  }
  ARBITRARY_VALUE_RE.lastIndex = 0;
  while ((match = ARBITRARY_VALUE_RE.exec(raw)) !== null) {
    context.report({ node, messageId: "arbitrary", data: { value: match[0] } });
  }
}

function checkExpression(context, node) {
  if (!node) return;
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") reportMatches(context, node, node.value);
      break;
    case "TemplateLiteral":
      for (const quasi of node.quasis) reportMatches(context, node, quasi.value.raw);
      break;
    case "ConditionalExpression":
      checkExpression(context, node.consequent);
      checkExpression(context, node.alternate);
      break;
    case "LogicalExpression":
      checkExpression(context, node.left);
      checkExpression(context, node.right);
      break;
    case "ArrayExpression":
      for (const el of node.elements) checkExpression(context, el);
      break;
    case "ObjectExpression":
      for (const prop of node.properties) {
        if (prop.type === "Property") checkExpression(context, prop.key);
      }
      break;
    default:
      break;
  }
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Ban raw hex colors and arbitrary Tailwind values outside the design-token layer (PRD §15.1).",
    },
    schema: [],
    messages: {
      hex: "Raw hex color '{{value}}' is banned outside the token layer (§15.1) — use a design token instead.",
      arbitrary:
        "Arbitrary Tailwind value '{{value}}' is banned outside the token layer (§15.1) — use a token-scale " +
        "utility class, or add a documented eslint-disable-next-line if no token expresses this value.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "className" || !node.value) return;
        if (node.value.type === "Literal") {
          checkExpression(context, node.value);
        } else if (node.value.type === "JSXExpressionContainer") {
          checkExpression(context, node.value.expression);
        }
      },
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || (node.callee.name !== "cn" && node.callee.name !== "cva")) return;
        for (const arg of node.arguments) checkExpression(context, arg);
      },
    };
  },
};

export default rule;
