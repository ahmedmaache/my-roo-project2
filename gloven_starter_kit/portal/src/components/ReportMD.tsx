/**
 * ReportMD Component
 * 
 * Renders markdown content as HTML with proper styling.
 */

interface ReportMDProps {
  html: string;
}

export default function ReportMD({ html }: ReportMDProps) {
  return (
    <div 
      className="prose prose-sm md:prose-base lg:prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        lineHeight: '1.6',
      }}
    />
  );
}