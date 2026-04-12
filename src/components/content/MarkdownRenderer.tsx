interface MarkdownRendererProps {
  html: string;
}

export default function MarkdownRenderer({ html }: MarkdownRendererProps) {
  return (
    <div
      className="prose prose-zinc max-w-none dark:prose-invert
        prose-headings:scroll-mt-20
        prose-a:text-zinc-900 prose-a:underline-offset-4 dark:prose-a:text-zinc-100
        prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5
        prose-code:text-zinc-800 prose-code:before:content-none prose-code:after:content-none
        dark:prose-code:bg-zinc-800 dark:prose-code:text-zinc-200
        prose-pre:rounded-lg prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-700
        prose-pre:bg-transparent prose-pre:p-0
        prose-img:rounded-lg"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
