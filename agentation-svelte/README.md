# Agentation Svelte

Svelte 5 version of Agentation for element-level feedback on live pages.

## Install

```bash
npm install agentation-svelte -D
```

## Usage

```svelte
<script lang="ts">
  import { Agentation, type Annotation } from "agentation-svelte";

  const onAdd = (annotation: Annotation) => {
    console.log(annotation.element, annotation.comment);
  };
</script>

<main>
  <h1>Your app</h1>
</main>

<Agentation onAnnotationAdd={onAdd} />
```

The toolbar appears in the bottom-right. Toggle annotation mode, click elements, then copy structured output.

## Svelte source detection

In development builds, Agentation Svelte attempts to detect:

- Source file + line (`sourceFile`)
- Nearest component (`sourceComponent`)
- Component hierarchy (`svelteComponents`)

These fields are included in copied output when available.

## Props

- `copyToClipboard?: boolean` (default `true`)
- `onAnnotationAdd?: (annotation: Annotation) => void`
- `onAnnotationDelete?: (annotation: Annotation) => void`
- `onAnnotationUpdate?: (annotation: Annotation) => void`
- `onAnnotationsClear?: (annotations: Annotation[]) => void`
- `onCopy?: (markdown: string) => void`

## MVP Notes

This initial Svelte package intentionally ships core annotation flow only.

Not included yet:

- Server sync/session API
- Webhook automation
- React component/source detection
- Design/rearrange/draw modes
