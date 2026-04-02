export function generateOutput(annotations, pathname, outputMode = "standard") {
    if (annotations.length === 0)
        return "";
    const viewport = typeof window !== "undefined"
        ? `${window.innerWidth}×${window.innerHeight}`
        : "unknown";
    let output = `## Page Feedback: ${pathname}\n`;
    if (outputMode === "forensic") {
        output += `\n**Environment:**\n`;
        output += `- Viewport: ${viewport}\n`;
        if (typeof window !== "undefined") {
            output += `- URL: ${window.location.href}\n`;
            output += `- User Agent: ${navigator.userAgent}\n`;
            output += `- Timestamp: ${new Date().toISOString()}\n`;
            output += `- Device Pixel Ratio: ${window.devicePixelRatio}\n`;
        }
        output += `\n---\n\n`;
    }
    else {
        output += `**Viewport:** ${viewport}\n\n`;
    }
    const getCompactElementLabel = (annotation) => {
        if (!annotation.isMultiSelect)
            return annotation.element;
        if (annotation.element === "Area selection")
            return annotation.element;
        if (annotation.elementPath === "multi-select") {
            return annotation.element;
        }
        return `${annotation.element} (multi-select)`;
    };
    annotations.forEach((annotation, index) => {
        if (outputMode === "compact") {
            output += `${index + 1}. **${getCompactElementLabel(annotation)}**${annotation.sourceFile ? ` (${annotation.sourceFile})` : ""}: ${annotation.comment}`;
            if (annotation.selectedText) {
                output += ` (re: "${annotation.selectedText.slice(0, 30)}${annotation.selectedText.length > 30 ? "..." : ""}")`;
            }
            output += "\n";
            return;
        }
        if (outputMode === "forensic") {
            output += `### ${index + 1}. ${annotation.element}\n`;
            if (annotation.isMultiSelect && annotation.fullPath) {
                output += `*Forensic data shown for first element of selection*\n`;
            }
            if (annotation.fullPath) {
                output += `**Full DOM Path:** ${annotation.fullPath}\n`;
            }
            if (annotation.cssClasses) {
                output += `**CSS Classes:** ${annotation.cssClasses}\n`;
            }
            if (annotation.boundingBox) {
                output += `**Position:** x:${Math.round(annotation.boundingBox.x)}, y:${Math.round(annotation.boundingBox.y)} (${Math.round(annotation.boundingBox.width)}×${Math.round(annotation.boundingBox.height)}px)\n`;
            }
            output += `**Annotation at:** ${annotation.x.toFixed(1)}% from left, ${Math.round(annotation.y)}px from top\n`;
            if (annotation.selectedText) {
                output += `**Selected text:** "${annotation.selectedText}"\n`;
            }
            if (annotation.nearbyText && !annotation.selectedText) {
                output += `**Context:** ${annotation.nearbyText.slice(0, 100)}\n`;
            }
            if (annotation.computedStyles) {
                output += `**Computed Styles:** ${annotation.computedStyles}\n`;
            }
            if (annotation.accessibility) {
                output += `**Accessibility:** ${annotation.accessibility}\n`;
            }
            if (annotation.nearbyElements) {
                output += `**Nearby Elements:** ${annotation.nearbyElements}\n`;
            }
            if (annotation.sourceFile) {
                output += `**Source:** ${annotation.sourceFile}\n`;
            }
            if (annotation.svelteComponents) {
                output += `**Svelte:** ${annotation.svelteComponents}\n`;
            }
            else if (annotation.sourceComponent) {
                output += `**Svelte:** <${annotation.sourceComponent}>\n`;
            }
            output += `**Feedback:** ${annotation.comment}\n\n`;
            return;
        }
        output += `### ${index + 1}. ${annotation.element}\n`;
        output += `**Location:** ${annotation.elementPath}\n`;
        if (annotation.sourceFile) {
            output += `**Source:** ${annotation.sourceFile}\n`;
        }
        if (annotation.svelteComponents) {
            output += `**Svelte:** ${annotation.svelteComponents}\n`;
        }
        else if (annotation.sourceComponent) {
            output += `**Svelte:** <${annotation.sourceComponent}>\n`;
        }
        if (outputMode === "detailed" && annotation.cssClasses) {
            output += `**Classes:** ${annotation.cssClasses}\n`;
        }
        if (outputMode === "detailed" && annotation.boundingBox) {
            output += `**Position:** ${Math.round(annotation.boundingBox.x)}px, ${Math.round(annotation.boundingBox.y)}px (${Math.round(annotation.boundingBox.width)}×${Math.round(annotation.boundingBox.height)}px)\n`;
        }
        if (annotation.selectedText) {
            output += `**Selected text:** "${annotation.selectedText}"\n`;
        }
        else if (annotation.nearbyText && outputMode === "detailed") {
            output += `**Context:** ${annotation.nearbyText.slice(0, 100)}\n`;
        }
        output += `**Feedback:** ${annotation.comment}\n\n`;
    });
    return output.trim();
}
