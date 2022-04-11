<script>
    export let shopName
    export let shopId
    export let imageUrl

    function goToShop() {
        window.open(`http://www.marapets.com/shop.php?id=${shopId}`, 'marapets')
    }
</script>

<li>
    <a href="http://www.marapets.com/shop.php?id={shopId}" target="_blank" title="Go to {shopName} shop" on:click|preventDefault={goToShop}>
        <figure>
            <img src="{imageUrl}" alt="{shopName} shop">
            <figcaption>{shopName}</figcaption>
        </figure>
    </a>
</li>

<style>
    li {
        border-radius: 8px;
        border: 2px solid #e8e8e8;
        background-color: white;
        text-align: center;
        flex: auto;
        flex-grow: 0;
    }

    li a {
        text-decoration: none;
        color: black;
        font-weight: bold;
    }
</style>