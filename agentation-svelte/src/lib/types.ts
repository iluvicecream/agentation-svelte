export type Annotation = {
  id: string;
  x: number;
  y: number;
  comment: string;
  element: string;
  elementPath: string;
  timestamp: number;
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  isFixed?: boolean;
  isMultiSelect?: boolean;
  elementBoundingBoxes?: Array<{ x: number; y: number; width: number; height: number }>;
  sourceFile?: string;
  sourceComponent?: string;
  svelteComponents?: string;
  nearbyElements?: string;
  computedStyles?: string;
  computedStylesObj?: Record<string, string>;
  fullPath?: string;
  accessibility?: string;
};

export type DraftAnnotation = Omit<Annotation, "id" | "timestamp" | "comment">;

export type OutputMode = "compact" | "standard" | "detailed" | "forensic";

export type AgentationProps = {
  copyToClipboard?: boolean;
  defaultOutputMode?: OutputMode;
  endpoint?: string;
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotation: Annotation) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  onCopy?: (markdown: string) => void;
  onSubmit?: (markdown: string, annotations: Annotation[]) => void;
};
