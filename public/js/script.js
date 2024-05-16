const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
    console.log('WebSocket connected');
};

ws.onmessage = event => {
    const drinks = JSON.parse(event.data);
    console.log('Received updated drink data:', drinks);
    fetchAndDisplayDrinks(); // Re-fetch and display updated drinks
};

ws.onclose = () => {
    console.log('WebSocket disconnected');
};

let drinksData = []; // This will store the fetched drinks data including previous prices

async function fetchAndDisplayDrinks() {
    try {
        const response = await fetch('/api/drinks');
        const fetchedDrinks = await response.json();

        const drinkMenuElement = document.getElementById('drinkMenu');
        drinkMenuElement.innerHTML = '';

        fetchedDrinks.forEach(fetchedDrink => {
            // Find the drink in the existing data to get the previous price
            const existingDrink = drinksData.find(d => d.name === fetchedDrink.name);
            const previousPrice = existingDrink ? existingDrink.price : fetchedDrink.price; // Use current price as previous if not found

            const drinkItem = document.createElement('div');
            drinkItem.classList.add('drink-item');

            let priceClass = '';
            if (fetchedDrink.price > previousPrice) {
                priceClass = 'price-increase';
            } else if (fetchedDrink.price < previousPrice) {
                priceClass = 'price-decrease';
            }

            drinkItem.innerHTML = `
                <h2>${fetchedDrink.name}</h2>
                <p>Price: <span class="price ${priceClass}">${fetchedDrink.price.toFixed(2)}</span></p>
            `;
            drinkMenuElement.appendChild(drinkItem);

            // Update the drink data with the new price
            if (existingDrink) {
                existingDrink.price = fetchedDrink.price;
            } else {
                drinksData.push({...fetchedDrink, previousPrice: fetchedDrink.price});
            }
        });
    } catch (error) {
        console.error('Error fetching drinks:', error);
    }
}

window.onload = () => {
    fetchAndDisplayDrinks(); // Fetch and display drinks on page load
    openFullscreen(); // Trigger fullscreen on page load
};

function openFullscreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
        document.documentElement.msRequestFullscreen();
    }
}
