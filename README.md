# Agentation for Svelte!

# Installation

```bash
bun install @iluvicecream/agentation-svelte
```

# Usage

```svelte
<script lang="ts">
  import Agentation from '@iluvicecream/agentation-svelte';
</script>

<Agentation />
```

# Mcp
```bash
bun install agentation-mcp
```
run mcp server with 

```bash
bunx -y agentation-mcp server
```

```svelte
<script lang="ts">
  import Agentation from '@iluvicecream/agentation-svelte';
</script>
<Agentation endpoint="http://localhost:4747" />
```

