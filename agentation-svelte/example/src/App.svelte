<script lang="ts">
  import { Agentation, type Annotation } from "agentation-svelte";

  let events = $state<string[]>([]);

  function onAdd(annotation: Annotation) {
    events = [`Added: ${annotation.element} - ${annotation.comment}`, ...events].slice(0, 6);
  }

  function onUpdate(annotation: Annotation) {
    events = [`Updated: ${annotation.element} - ${annotation.comment}`, ...events].slice(0, 6);
  }

  function onDelete(annotation: Annotation) {
    events = [`Deleted: ${annotation.element}`, ...events].slice(0, 6);
  }

  function onClear(annotations: Annotation[]) {
    events = [`Cleared ${annotations.length} annotations`, ...events].slice(0, 6);
  }

  function onCopy(markdown: string) {
    events = [`Copied ${markdown.split("\n").length} lines`, ...events].slice(0, 6);
  }
</script>

<main>
  <header>
    <p class="eyebrow">Agentation Svelte</p>
    <h1>Annotate this page</h1>
    <p class="lead">
      Click <strong>Annotate</strong> in the floating toolbar, then click any element on the page to add feedback.
    </p>
  </header>

  <section class="grid">
    <article class="card">
      <h2>Pricing card</h2>
      <p>Perfect for testing button and text annotations.</p>
      <button>Start free trial</button>
    </article>

    <article class="card alt">
      <h2>Feature card</h2>
      <p>Click headings, cards, and links to capture semantic paths.</p>
      <a href="https://agentation.com" target="_blank" rel="noreferrer">View docs</a>
    </article>
  </section>

  <section class="events">
    <h3>Recent callbacks</h3>
    {#if events.length === 0}
      <p>No events yet.</p>
    {:else}
      <ul>
        {#each events as event, index (event + index)}
          <li>{event}</li>
        {/each}
      </ul>
    {/if}
  </section>
</main>

<Agentation
  onAnnotationAdd={onAdd}
  onAnnotationUpdate={onUpdate}
  onAnnotationDelete={onDelete}
  onAnnotationsClear={onClear}
  onCopy={onCopy}
/>
