
function beginClock() {
    // document.getElementsByTagName('body')[0].style.backgroundColor = background;
    setInterval('clockTick()', 1000);
}

function clockTick() {
    updateTimeDisplay();
    updateTableDisplays();
}

function updateTimeDisplay() {
    const d = new Date();
    let timestring = addZero(d.getHours(), 2) - 2;
    timestring += `:${addZero(d.getMinutes(), 2)}`;
    timestring += `:${addZero(d.getSeconds(), 2)}`;

    document.getElementById('time').innerHTML = `${timestring} MST`;
}

function addZero(x, n) {
    if (x.toString().length < n) {
        return `0${x}`;
    }
    return x;
}

function updateTableDisplays() {
    const shopsOff = '#f9f9fa';
    const upcomingInterval = 20;
    const freshInterval = 20;
    const shopsTables = document.getElementsByClassName('shops');

    for (const shopsTable of shopsTables) {
        shopsTable.style.backgroundColor = shopsOff
    }

    for (let tableNum = 0; tableNum < 5; tableNum++) {
        const d = new Date();
        const minutes = d.getMinutes()
        const seconds = d.getSeconds()
        const table = document.getElementById(`table${tableNum}`)
        console.log(minutes % 5)

        if ((minutes + 1) % 5 === tableNum && seconds >= 60 - upcomingInterval) {
            const shopsSoon = '#80cced'
            table.style.backgroundColor = getGradient(shopsOff, shopsSoon, (seconds + upcomingInterval - 60) / upcomingInterval)


        } else if (minutes % 5 === tableNum && seconds <= freshInterval) {
            const shopsNow = '#26c281'
            table.style.backgroundColor = getGradient(shopsNow, shopsOff, seconds / freshInterval)
        }
    }
}

function getGradient(color1, color2, percent) {
    const rgb1 = new Array(3)
    const rgb2 = new Array(3)
    const newrgb = new Array(3)
    for (let color = 0; color <= 3; color++) {
        rgb1[color] = parseInt(color1.substring(2 * color + 1, 2 * color + 3), 16)
        rgb2[color] = parseInt(color2.substring(2 * color + 1, 2 * color + 3), 16)

        newrgb[color] = addZero(Math.floor((1 - percent) * rgb1[color] + (percent) * rgb2[color]).toString(16), 2)
    }
    return `#${newrgb[0]}${newrgb[1]}${newrgb[2]}`
}


/** 
 * Add event listener to links to open in the same tab
 * instead of a new one each time.
 * */
const links = document.querySelectorAll("li a")
for (const link of links) {
    link.addEventListener("click", (e) => {
        e.preventDefault()
        const shopUrl = e.target.closest("a").href
        window.open(shopUrl, 'marapets')
    })
}
