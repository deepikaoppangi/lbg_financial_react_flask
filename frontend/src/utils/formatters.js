export const formatGBP = (n) => {
  try {
    return "£" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  } catch (e) {
    return "£" + n;
  }
};

export const formatPercentage = (n) => {
  return `${Math.round(n)}%`;
};

export const formatText = (text) => {
  if (!text) return "";
  
  // Remove hashtags
  text = text.replace(/#\w+/g, "");
  
  // Convert markdown-style headings to HTML
  text = text.replace(/^###\s+(.+)$/gm, '<strong class="formatted-heading">$1</strong>');
  text = text.replace(/^##\s+(.+)$/gm, '<strong class="formatted-heading">$1</strong>');
  text = text.replace(/^#\s+(.+)$/gm, '<strong class="formatted-heading">$1</strong>');
  
  // Convert bullet points
  text = text.replace(/^[-*•]\s+(.+)$/gm, '<li>$1</li>');
  text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive <li> tags in <ul>
  text = text.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="formatted-list">$&</ul>');
  
  // Convert line breaks to <br>
  text = text.replace(/\n/g, '<br>');
  
  // Clean up extra spaces
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

export const formatBulletPoints = (lines) => {
  if (!lines || !Array.isArray(lines)) return [];
  
  const result = [];
  let currentList = [];
  let inList = false;

  lines.forEach((line, index) => {
    if (!line || !line.trim()) {
      if (inList && currentList.length > 0) {
        result.push(
          <ul key={`list-${index}`} className="list-disc list-inside space-y-2 mb-4 text-lbg-grey-700">
            {currentList}
          </ul>
        );
        currentList = [];
        inList = false;
      }
      return;
    }
    
    let processedLine = line.trim();
    processedLine = processedLine.replace(/#(\w+)/g, "");
    
    // Handle markdown headings
    if (line.match(/^#{1,6}\s+/)) {
      if (inList && currentList.length > 0) {
        result.push(
          <ul key={`list-${index}`} className="list-disc list-inside space-y-2 mb-4 text-lbg-grey-700">
            {currentList}
          </ul>
        );
        currentList = [];
        inList = false;
      }
      const headingText = processedLine.replace(/^#{1,6}\s+/, "").trim();
      result.push(
        <h3 key={index} className="text-lg font-bold text-lbg-salem mb-3 mt-4 first:mt-0">
          {headingText}
        </h3>
      );
      return;
    }
    
    // Handle bullet points
    if (processedLine.match(/^[-*•]\s/) || processedLine.match(/^\d+\.\s/)) {
      const bulletContent = processedLine.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, "");
      currentList.push(
        <li key={index} className="text-sm leading-relaxed">
          {bulletContent}
        </li>
      );
      inList = true;
      return;
    }
    
    // Regular paragraph
    if (inList && currentList.length > 0) {
      result.push(
        <ul key={`list-${index}`} className="list-disc list-inside space-y-2 mb-4 text-lbg-grey-700">
          {currentList}
        </ul>
      );
      currentList = [];
      inList = false;
    }
    
    result.push(
      <p key={index} className="text-sm text-lbg-grey-700 mb-3 leading-relaxed">
        {processedLine}
      </p>
    );
  });

  // Close any remaining list
  if (inList && currentList.length > 0) {
    result.push(
      <ul key="list-final" className="list-disc list-inside space-y-2 mb-4 text-lbg-grey-700">
        {currentList}
      </ul>
    );
  }

  return result;
};
