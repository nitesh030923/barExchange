const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
    console.log('WebSocket connected');
};

ws.onmessage = event => {
    const drinks = JSON.parse(event.data);
    console.log('Received updated drink data from server:', drinks);
    // Update displayed prices based on received data directly
    fetchAndDisplayDrinks();
};

ws.onclose = () => {
    console.log('WebSocket disconnected');
};

async function fetchAndDisplayDrinks() {
    try {
        const response = await fetch('/api/drinks');
        const drinks = await response.json();

        const drinkMenuElement = document.getElementById('drinkMenu');
        drinkMenuElement.innerHTML = '';

        drinks.forEach(drink => {
            const drinkItem = document.createElement('div');
            drinkItem.classList.add('drink-item');
            drinkItem.innerHTML = `
                <h2>${drink.name}</h2>
                <p>Price: <span class="price">${drink.price.toFixed(2)}</span></p>
                <button onclick="adjustPopularity('${drink.name}', 'increase')">Increase Popularity</button>
                <button onclick="adjustPopularity('${drink.name}', 'decrease')">Decrease Popularity</button>
            `;
            drinkMenuElement.appendChild(drinkItem);
        });
    } catch (error) {
        console.error('Error fetching drinks:', error);
    }
}

async function adjustPopularity(drinkName, action) {
    try {
        const response = await fetch(`/api/drinks/${drinkName}/popularity/${action}`, { method: 'PUT' });
        if (response.ok) {
            // No need to refresh drink list here, WebSocket will update it
        } else {
            console.error('Failed to adjust popularity');
        }
    } catch (error) {
        console.error('Error adjusting popularity:', error);
    }
}

window.onload = () => {
    fetchAndDisplayDrinks();
};
