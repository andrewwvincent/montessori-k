// Core map functionality
export class MapCore {
    constructor(config) {
        this.config = config;
        this.map = null;
        this.geocoder = null;
        this.moveEndTimeout = null;
        this.onTileCheckNeeded = null;  // Callback for when tiles need to be checked
        this.searchMarker = null; // Add marker for search results

        // Austin, TX coordinates and zoom level
        this.initialView = {
            center: [-97.7431, 30.2672],
            zoom: 10
        };
    }

    initialize() {
        mapboxgl.accessToken = this.config.accessToken;
        
        this.map = new mapboxgl.Map({
            container: 'map',
            style: this.config.style,
            center: this.initialView.center,
            zoom: this.initialView.zoom,
            minZoom: 4,
            maxZoom: 20
        });

        this.initializeControls();
        this.setupEventListeners();

        return this.map;
    }

    initializeControls() {
        // Add navigation control first
        this.map.addControl(new mapboxgl.NavigationControl());

        // Add fullscreen control
        this.map.addControl(new mapboxgl.FullscreenControl());

        // Add geocoder control with retry
        const initGeocoder = () => {
            if (typeof MapboxGeocoder !== 'undefined') {
                try {
                    const geocoder = new MapboxGeocoder({
                        accessToken: mapboxgl.accessToken,
                        mapboxgl: mapboxgl,
                        marker: false, // Disable default marker
                        countries: 'us',
                        types: 'address,place,locality,neighborhood,postcode',
                        flyTo: {
                            duration: 2000,
                            zoom: 16 // Zoom level for addresses
                        }
                    });

                    // Add geocoder to sidebar
                    const sidebarContent = document.querySelector('.sidebar-content');
                    const title = document.getElementById('title');
                    const geocoderContainer = document.createElement('div');
                    geocoderContainer.className = 'geocoder-container';
                    sidebarContent.insertBefore(geocoderContainer, title.nextSibling);
                    geocoderContainer.appendChild(geocoder.onAdd(this.map));

                    // Initialize city selector if cities are configured
                    if (this.config.cities && this.config.cities.length > 0) {
                        import('./citySelector.js').then(module => {
                            const CitySelector = module.CitySelector;
                            const citySelector = new CitySelector(this.map, this.config.cities);
                            const citySelectorElement = citySelector.initialize();
                            sidebarContent.insertBefore(citySelectorElement, geocoderContainer.nextSibling);
                        }).catch(error => {
                            console.error('Error loading city selector:', error);
                        });
                    }

                    // Handle search results
                    geocoder.on('result', (e) => {
                        // Remove previous marker if it exists
                        if (this.searchMarker) {
                            this.searchMarker.remove();
                        }

                        // Create new marker at search result location
                        this.searchMarker = new mapboxgl.Marker({
                            color: '#FF0000',
                            scale: 0.8
                        })
                        .setLngLat(e.result.center)
                        .addTo(this.map);

                        // Adjust zoom based on result type
                        const type = e.result.place_type[0];
                        let zoom = 16; // Default zoom for addresses
                        
                        if (type === 'place' || type === 'locality') {
                            zoom = 12; // City level
                        } else if (type === 'neighborhood') {
                            zoom = 14; // Neighborhood level
                        } else if (type === 'postcode') {
                            zoom = 13; // Postal code level
                        }

                        // Fly to the location with appropriate zoom
                        this.map.flyTo({
                            center: e.result.center,
                            zoom: zoom,
                            duration: 2000
                        });
                    });

                    // Clear marker when search is cleared
                    geocoder.on('clear', () => {
                        if (this.searchMarker) {
                            this.searchMarker.remove();
                            this.searchMarker = null;
                        }
                    });

                } catch (error) {
                    console.error('Error initializing MapboxGeocoder:', error);
                }
            } else {
                // Retry after a short delay
                setTimeout(initGeocoder, 100);
            }
        };

        // Start geocoder initialization
        initGeocoder();
    }

    setupEventListeners() {
        // Handle map movement
        this.map.on('move', () => {
            if (this.moveEndTimeout) {
                clearTimeout(this.moveEndTimeout);
            }
            this.moveEndTimeout = setTimeout(() => {
                if (this.onTileCheckNeeded) {
                    this.onTileCheckNeeded();
                }
            }, 100);
        });

        this.map.on('moveend', () => {
            if (this.moveEndTimeout) {
                clearTimeout(this.moveEndTimeout);
            }
            if (this.onTileCheckNeeded) {
                this.onTileCheckNeeded();
            }
        });
    }

    // Register callback for tile check events
    onTilesNeedCheck(callback) {
        this.onTileCheckNeeded = callback;
    }

    // Layer management methods
    addLayer(layerId, sourceId, data) {
        if (!this.map.getSource(sourceId)) {
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: data
            });
        }

        if (!this.map.getLayer(layerId)) {
            this.map.addLayer({
                id: layerId,
                type: 'fill',
                source: sourceId,
                paint: {
                    'fill-color': 'rgba(0, 0, 0, 0)',
                    'fill-opacity': 0.8,
                    'fill-outline-color': 'rgba(0, 0, 0, 0.2)'
                }
            });
        }
    }

    removeLayer(layerId, sourceId) {
        try {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
        } catch (error) {
            console.error(`Error removing layer/source: ${error}`);
        }
    }

    // Map state methods
    getBounds() {
        try {
            return this.map.getBounds();
        } catch (error) {
            // Return a default bounds for globe projection or error cases
            return {
                getWest: () => -180,
                getEast: () => 180,
                getSouth: () => -85,
                getNorth: () => 85
            };
        }
    }

    getZoom() {
        return this.map.getZoom();
    }

    isStyleLoaded() {
        return this.map.isStyleLoaded();
    }

    setPaintProperty(layerId, property, value) {
        if (this.map.getLayer(layerId)) {
            this.map.setPaintProperty(layerId, property, value);
        }
    }
}
