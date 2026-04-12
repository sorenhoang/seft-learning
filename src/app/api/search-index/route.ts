import { buildContentTree, buildSearchIndex } from "@/lib/content";

// Statically generated at build time — no runtime cost
export const dynamic = "force-static";

export function GET() {
  try {
    const tree = buildContentTree();
    const index = buildSearchIndex(tree);
    return Response.json(index);
  } catch (err) {
    console.error("[search-index] Failed to build search index:", err);
    return Response.json([], { status: 500 });
  }
}
