# Svelte 5 Gotchas

## Reactivity

### Object/Array Mutation

```svelte
<script>
    let items = $state(['a', 'b'])

    // Correct: These all work (deep reactivity)
    items.push('c')
    items[0] = 'x'
    items.splice(1, 1)

    // Correct: Reassignment also works
    items = [...items, 'c']
</script>
```

### Primitives Must Be Reassigned

```svelte
<script>
    let count = $state(0)

    // Correct: Correct
    count = count + 1
    count++

    // Wrong: This does nothing (no mutation possible)
    // Primitives have no methods to mutate
</script>
```

### Derived Cannot Be Assigned

```svelte
<script>
    let count = $state(0)
    let doubled = $derived(count * 2)

    // Wrong: Error: doubled is readonly
    doubled = 10

    // Correct: Change the source instead
    count = 5 // doubled becomes 10
</script>
```

## Props

### Props Are Readonly by Default

```svelte
<script>
    let { count } = $props()

    // Wrong: Error: cannot assign to prop
    count = 5

    // Correct: Use $bindable for two-way binding
    let { count = $bindable(0) } = $props()
    count = 5 // Now works
</script>
```

### Destructuring Loses Reactivity

```svelte
<script>
    let { user } = $props()

    // Wrong: Not reactive - name is a static copy
    let { name } = user

    // Correct: Access directly for reactivity
    // In template: {user.name}

    // Correct: Or use $derived
    let name = $derived(user.name)
</script>
```

## Effects

### $effect Runs After Mount

```svelte
<script>
    let el

    // Wrong: el is undefined on first run
    $effect(() => {
        console.log(el.offsetHeight) // Error!
    })

    // Correct: Guard against undefined
    $effect(() => {
        if (!el) return
        console.log(el.offsetHeight)
    })
</script>

<div bind:this={el}>Content</div>
```

### $effect Tracks Dependencies Automatically

```svelte
<script>
    let count = $state(0)
    let other = $state(0)

    // Runs when `count` changes (it's read inside)
    $effect(() => {
        console.log(count)
    })

    // Wrong: Won't track `other` - not read inside
    $effect(() => {
        console.log(count)
        // `other` not tracked because not accessed
    })

    // Correct: Access dependencies you want to track
    $effect(() => {
        console.log(count, other)
    })
</script>
```

### Avoid Infinite Loops

```svelte
<script>
    let count = $state(0)

    // Wrong: Infinite loop: reads and writes same state
    $effect(() => {
        count = count + 1
    })

    // Correct: Use untrack for writes that shouldn't re-trigger
    import { untrack } from 'svelte'
    $effect(() => {
        const current = count
        untrack(() => {
            someOtherState = current
        })
    })
</script>
```

## Events

### No Event Modifiers

```svelte
<!-- Wrong: Svelte 4 modifiers don't exist -->
<button on:click|preventDefault|stopPropagation={handler}>

<!-- Correct: Handle in the function -->
<button onclick={e => {
  e.preventDefault();
  e.stopPropagation();
  handler(e);
}}>
```

### Event Types Changed

```svelte
<!-- Wrong: on:click -->
<button on:click={handler}>

<!-- Correct: onclick (lowercase, no colon) -->
<button onclick={handler}>

<!-- Same for all events -->
<input oninput={handler} />
<form onsubmit={handler}>
<div onmouseenter={handler}>
```

## Snippets

### Children is a Snippet, Not Slot

```svelte
<script>
    let { children } = $props()
</script>

<!-- Wrong: Old slot syntax -->
<slot />

<!-- Correct: Render the children snippet -->
{@render children?.()}
```

### Snippets Can Take Parameters

```svelte
<!-- List.svelte -->
<script>
    let { items, item } = $props()
</script>

<!-- Parent -->
<List {items}>
    {#snippet item(data, index)}
        <span>{index}: {data.name}</span>
    {/snippet}
</List>

{#each items as data, index}
    {@render item(data, index)}
{/each}
```

## Bindings

### bind:this Still Works

```svelte
<script>
    let canvas

    $effect(() => {
        if (!canvas) return
        const ctx = canvas.getContext('2d')
    })
</script>

<canvas bind:this={canvas}></canvas>
```

### bind:value Works with $bindable

```svelte
<!-- Child needs $bindable for parent to bind -->
<script>
    let { value = $bindable('') } = $props()
</script>

<input bind:value />

<!-- Parent can then bind -->
<Child bind:value={name} />
```

## Attachments

### Attachment bodies are tracked

```svelte
<script>
    import { untrack } from 'svelte'

    // Wrong: reading `count` here re-runs the attachment when it changes
    const bad = (node) => {
        node.dataset.count = count
    }

    // Correct: read state you do not want to track under untrack
    const good = (node) => {
        untrack(() => {
            node.dataset.count = count
        })
    }
</script>

<div {@attach good}></div>
```

### Spreading props re-runs every attachment in the child

```svelte
<!-- Wrong: any change inside props re-runs {@attach child.interactions.grid} -->
<Child {...props} interactions={stable} />

<!-- Correct: explicit props keep each getter independent -->
<Child a={props.a} b={props.b} interactions={stable} />
```
