import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

interface AIMessageContentProps {
  content: string;
}

const normalizeMathDelimiters = (value: string): string =>
  value
    .replace(
      /\\\[([\s\S]*?)\\\]/g,
      (_match, formula: string) => `$$${formula}$$`,
    )
    .replace(
      /\\\(([\s\S]*?)\\\)/g,
      (_match, formula: string) => `$${formula}$`,
    );

export function AIMessageContent({
  content,
}: AIMessageContentProps): JSX.Element {
  const normalizedContent = normalizeMathDelimiters(content);

  return (
    <div className="max-w-none overflow-hidden break-words text-sm leading-7 text-foreground [&_p]:my-2 [&_ul]:my-2 [&_ul]:ml-4 [&_ul]:list-disc [&_li]:my-1 [&_strong]:font-semibold [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-2">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
