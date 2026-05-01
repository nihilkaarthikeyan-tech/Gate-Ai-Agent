import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  math: string;
  block?: boolean;
  className?: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ math, block = false, className = '' }) => {
  const html = katex.renderToString(math, {
    throwOnError: false,
    displayMode: block,
  });

  if (block) {
    return (
      <div
        className={`my-2 overflow-x-auto text-center ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MathRenderer;
