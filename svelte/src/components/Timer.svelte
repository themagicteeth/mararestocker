<script>
    let time = ""
    setInterval(() => {
        const d = new Date()
        const timer = {
            hours: addZero(d.getHours(), 2) - 2,
            minutes: `:${addZero(d.getMinutes(), 2)}`,
            seconds: `:${addZero(d.getSeconds(), 2)}`
        }

        time = `${timer.hours}${timer.minutes}${timer.seconds} MST`
    }, 1000);

    function addZero(x, n) {
        if (x.toString().length < n) {
            return `0${x}`;
        }
        return x;
    }
</script>

<header>
    <h1>{time}</h1>
</header>

<style>
    header {
        background-color: black;
        color: white;
        text-align: center;
        font-weight: bold;
        margin-top: 0;
    }
</style>