<script>
    import { writable } from "svelte/store";
    export let shop
    
    export const visibility = writable(shop)
    
    function hide() {
        visibility.set("hiddden")
    }

    function show() {
        visibility.set("show")
    }
   


</script>