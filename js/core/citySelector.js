// City selector functionality
export class CitySelector {
    constructor(map, cities) {
        this.map = map;
        this.cities = cities.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
    }

    initialize() {
        // Create the city selector container
        const container = document.createElement('div');
        container.className = 'city-selector';

        // Create and style the select element
        const select = document.createElement('select');
        select.className = 'city-select';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a city...';
        defaultOption.selected = true;
        select.appendChild(defaultOption);

        // Add city options
        this.cities.forEach(city => {
            const option = document.createElement('option');
            option.value = JSON.stringify({
                coordinates: city.coordinates,
                zoom: city.zoom
            });
            option.textContent = city.name;
            select.appendChild(option);
        });

        // Handle city selection
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                const { coordinates, zoom } = JSON.parse(e.target.value);
                this.map.flyTo({
                    center: coordinates,
                    zoom: zoom,
                    duration: 2000
                });
            }
        });

        container.appendChild(select);
        return container;
    }
}
