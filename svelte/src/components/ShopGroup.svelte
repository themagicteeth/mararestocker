<article>
    <slot name="toggle" />
    <section>
        <ul>
            <slot />
        </ul>
    </section>
</article>

<style>
    article {
        border-radius: 8px;
        border: 2px solid #e8e8e8;
        margin-bottom: 1em;
    }

    ul {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-evenly;
        padding: 0;
    }
</style>
