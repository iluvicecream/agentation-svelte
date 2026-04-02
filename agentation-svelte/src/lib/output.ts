import type { Annotation } from "./types";
import type { OutputMode } from "./types";

export function generateOutput(
  annotations: Annotation[],
  pathname: string,
  outputMode: OutputMode = "standard"
): string {
  if (annotations.length === 0) return "";

  const viewport =
    typeof window !== "undefined"
      ? `${window.innerWidth}x${window.innerHeight}`
      : "unknown";

  let output = `## Page Feedback: ${pathname}\n`;
  output += `**Viewport:** ${viewport}\n\n`;

  annotations.forEach((annotation, index) => {
    if (outputMode === "compact") {
      output += `${index + 1}. **${annotation.element}**: ${annotation.comment}`;
      if (annotation.selectedText) {
        output += ` (re: "${annotation.selectedText.slice(0, 30)}${annotation.selectedText.length > 30 ? "..." : ""}")`;
      }
      output += "\n";
      return;
    }

    output += `### ${index + 1}. ${annotation.element}\n`;
    output += `**Location:** ${annotation.elementPath}\n`;

    if (outputMode === "detailed" && annotation.cssClasses) {
      output += `**Classes:** ${annotation.cssClasses}\n`;
    }

    if (outputMode === "detailed" && annotation.boundingBox) {
      output += `**Position:** ${Math.round(annotation.boundingBox.x)}px, ${Math.round(annotation.boundingBox.y)}px (${Math.round(annotation.boundingBox.width)}x${Math.round(annotation.boundingBox.height)}px)\n`;
    }

    if (annotation.selectedText) {
      output += `**Selected text:** "${annotation.selectedText}"\n`;
    } else if (annotation.nearbyText && outputMode === "detailed") {
      output += `**Context:** ${annotation.nearbyText.slice(0, 100)}\n`;
    }

    output += `**Feedback:** ${annotation.comment}\n\n`;
  });

  return output.trim();
}
