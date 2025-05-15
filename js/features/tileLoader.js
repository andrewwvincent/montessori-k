// Global variables
let map;
let currentCity = null;
let loadedTiles = new Set();
let visibleTiles = new Set(); // Track currently visible tiles
let loadingTiles = new Set(); // Track tiles currently being loaded
let tileLoadStartTimes = new Map(); // Track when each tile started loading
let metadata = null;
let filters = null; // Will be initialized in initializeFilterStates
let currentlyLoadingTiles = new Set();
let moveEndTimeout = null;
const TILE_LOAD_TIMEOUT = 5000; // 5 seconds timeout for tile loading
const ZOOM_THRESHOLD = 4; // Zoom level threshold for loading/unloading tiles
const LOAD_BATCH_SIZE = 10; // Number of tiles to load in parallel

// Base URL for tile data - change this based on environment
const BASE_URL = window.location.href.includes('github.io') 
    ? '/dynamic-microschool-heatmaps'  // GitHub Pages URL
    : '.';  // Local development URL

// Helper function to calculate distance from viewport center
function getDistanceFromCenter(gridBounds, viewportCenter) {
    const gridCenterLat = (gridBounds.min_lat + gridBounds.max_lat) / 2;
    const gridCenterLon = (gridBounds.min_lon + gridBounds.max_lon) / 2;
    const dlat = gridCenterLat - viewportCenter.lat;
    const dlon = gridCenterLon - viewportCenter.lng;
    return Math.sqrt(dlat * dlat + dlon * dlon);
}

// Load a batch of tiles in parallel
async function loadTileBatch(tiles) {
    return Promise.all(tiles.map(gridRef => loadTile(gridRef)));
}

// Initialize the map
function initializeMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kcmV3LXZpbmNlbnQiLCJhIjoiY202OW4wNm5yMGlubzJtcTJmMnBxb2x1cSJ9.jrR3Ucv9Nvtc-T_7aKIQCg';
    
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/basic-v9',
        center: [-97.7431, 30.2672], // Austin coordinates
        zoom: 9
    });

    // Add geocoder control
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        types: 'place,locality,neighborhood'
    });

    map.addControl(geocoder);
    map.addControl(new mapboxgl.NavigationControl());

    // Add map event handlers with throttling
    map.on('move', throttledCheckVisibleTiles);
    map.on('moveend', throttledCheckVisibleTiles);
    map.on('zoom', throttledCheckVisibleTiles);
    map.on('zoomend', throttledCheckVisibleTiles);

    // Load metadata and initialize UI once map is ready
    map.on('load', async () => {
        try {
            // Load metadata first
            metadata = await loadMetadata();
            
            // Then check visible tiles
            if (metadata) {
                checkVisibleTiles();
            }
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    });
}

// Load metadata and initialize tile loading
async function loadMetadata() {
    try {
        const response = await fetch('data/tiles/metadata.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading metadata:', error);
        return null;
    }
}

// Load a specific tile
async function loadTile(gridRef) {
    // Skip if already loaded or currently loading
    if (loadedTiles.has(gridRef) || currentlyLoadingTiles.has(gridRef)) {
        console.log(`Skipping ${gridRef} - already loaded or loading`);
        return;
    }

    const sourceId = `source-${gridRef}`;
    const layerId = `layer-${gridRef}`;

    try {
        // Mark as loading
        currentlyLoadingTiles.add(gridRef);
        console.log(`Starting to load ${gridRef}`);

        // Ensure source and layer don't exist
        if (map.getSource(sourceId)) {
            console.log(`Removing existing source for ${gridRef}`);
            map.removeSource(sourceId);
        }
        if (map.getLayer(layerId)) {
            console.log(`Removing existing layer for ${gridRef}`);
            map.removeLayer(layerId);
        }

        // Fetch the data
        console.log(`Fetching data for ${gridRef}`);
        const response = await fetch(`data/tiles/${gridRef}.geojson`);
        if (!response.ok) {
            throw new Error(`Failed to load tile ${gridRef} - HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log(`Successfully fetched data for ${gridRef} - ${data.features.length} features`);
        
        // Double check the source doesn't exist before adding
        if (!map.getSource(sourceId)) {
            console.log(`Adding source for ${gridRef}`);
            map.addSource(sourceId, {
                type: 'geojson',
                data: data
            });

            // Find a good layer to insert before - we want to be above land but below labels
            const layers = map.getStyle().layers;
            const labelLayer = layers.find(layer => 
                layer.id.includes('label') || 
                layer.id.includes('place') ||
                layer.id.includes('poi')
            );

            console.log(`Adding layer for ${gridRef}`);
            // Add main layer for colors
            map.addLayer({
                'id': layerId,
                'type': 'fill',
                'source': sourceId,
                'paint': {
                    'fill-color': 'rgba(0, 0, 0, 0)',
                    'fill-opacity': 0.8,
                    'fill-outline-color': 'rgba(0, 0, 0, 0)'
                }
            }, labelLayer ? labelLayer.id : undefined);

            loadedTiles.add(gridRef);
            console.log(`Updating colors for ${gridRef}`);
            updateLayerColors(map, sourceId, layerId);
            console.log(`Successfully loaded ${gridRef}`);
        }
    } catch (error) {
        console.error(`Error loading tile ${gridRef}:`, error);
        // Clean up if there was an error
        unloadTile(gridRef);
    } finally {
        // Remove from loading set
        currentlyLoadingTiles.delete(gridRef);
    }
}

// Unload a tile and remove its layers
function unloadTile(gridRef) {
    const sourceId = `source-${gridRef}`;
    const layerId = `layer-${gridRef}`;

    try {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
            // Set the data to null before removing the source
            map.getSource(sourceId).setData({ type: 'FeatureCollection', features: [] });
            map.removeSource(sourceId);
        }
    } catch (error) {
        console.error(`Error unloading tile ${gridRef}:`, error);
    }
    loadedTiles.delete(gridRef);
    currentlyLoadingTiles.delete(gridRef);
}

// Check which tiles need to be loaded based on viewport
async function checkVisibleTiles() {
    if (!metadata || !map) {
        console.warn('Metadata or map not yet initialized');
        return;
    }

    try {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        const center = map.getCenter();
        
        console.log(`Current viewport - zoom: ${zoom}, center: ${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}`);
        console.log(`R12C25 metadata:`, metadata.grids['R12C25']);
        
        console.log(`Viewport bounds: W:${bounds.getWest().toFixed(4)} E:${bounds.getEast().toFixed(4)} S:${bounds.getSouth().toFixed(4)} N:${bounds.getNorth().toFixed(4)}`);
        
        // Clear loading queue and unload all tiles if below zoom threshold
        if (zoom <= ZOOM_THRESHOLD) {
            console.log(`Below zoom threshold (${ZOOM_THRESHOLD}), unloading all tiles`);
            currentlyLoadingTiles.clear();
            Array.from(loadedTiles).forEach(gridRef => {
                unloadTile(gridRef);
            });
            return;
        }

        // Get visible grids and sort by distance from center
        const visibleGrids = Object.keys(metadata.grids)
            .filter(gridRef => {
                const gridBounds = metadata.grids[gridRef].bounds;
                const visible = isGridVisible(gridBounds, bounds);
                if (gridRef === 'R12C25') {
                    console.log(`R12C25 bounds:`, gridBounds);
                    console.log(`R12C25 visible:`, visible);
                }
                return visible;
            })
            .sort((a, b) => {
                const distA = getDistanceFromCenter(metadata.grids[a].bounds, center);
                const distB = getDistanceFromCenter(metadata.grids[b].bounds, center);
                return distA - distB;
            });

        console.log(`Found ${visibleGrids.length} visible grids`);
        if (visibleGrids.includes('R12C25')) {
            console.log('R12C25 is in visible grids');
        }

        // Limit the number of visible tiles to prevent memory issues
        // Scale max tiles based on zoom level, but keep it reasonable
        const MAX_TILES = Math.min(150, Math.floor(75 * (zoom / ZOOM_THRESHOLD)));
        const tilesToLoad = visibleGrids.slice(0, MAX_TILES);
        
        console.log(`Loading up to ${MAX_TILES} tiles`);
        if (tilesToLoad.includes('R12C25')) {
            console.log('R12C25 is in tiles to load');
            const index = tilesToLoad.indexOf('R12C25');
            console.log(`R12C25 is at position ${index} in load queue`);
        }

        // Unload tiles that are no longer visible
        Array.from(loadedTiles).forEach(gridRef => {
            if (!tilesToLoad.includes(gridRef)) {
                console.log(`Unloading ${gridRef} - no longer visible`);
                unloadTile(gridRef);
            }
        });

        // Split tiles into batches and load them
        const unloadedTiles = tilesToLoad.filter(gridRef => 
            !loadedTiles.has(gridRef) && !currentlyLoadingTiles.has(gridRef)
        );

        console.log(`${unloadedTiles.length} tiles need loading`);
        if (unloadedTiles.includes('R12C25')) {
            console.log('R12C25 is in unloaded tiles queue');
        }

        for (let i = 0; i < unloadedTiles.length; i += LOAD_BATCH_SIZE) {
            const batch = unloadedTiles.slice(i, i + LOAD_BATCH_SIZE);
            console.log(`Loading batch ${i/LOAD_BATCH_SIZE + 1}:`, batch);
            await loadTileBatch(batch);
        }
    } catch (error) {
        console.error('Error in checkVisibleTiles:', error);
    }
}

// Throttle the checkVisibleTiles function for smoother zooming
function throttledCheckVisibleTiles() {
    if (moveEndTimeout) {
        clearTimeout(moveEndTimeout);
    }
    moveEndTimeout = setTimeout(() => {
        checkVisibleTiles();
    }, 100); // Increased delay for smoother zooming
}

// Check if a grid's bounds intersect with the viewport bounds
function isGridVisible(gridBounds, viewportBounds) {
    if (!gridBounds || !viewportBounds) return false;
    
    // Get viewport bounds
    const west = viewportBounds.getWest();
    const east = viewportBounds.getEast();
    const south = viewportBounds.getSouth();
    const north = viewportBounds.getNorth();
    
    // Log bounds for R12C25
    console.log('Checking visibility - viewport:', {west, east, south, north});
    console.log('Grid bounds:', gridBounds);
    
    // Check if grid intersects viewport
    return west <= gridBounds.max_lon && 
           east >= gridBounds.min_lon &&
           south <= gridBounds.max_lat && 
           north >= gridBounds.min_lat;
}

function updateLayerColors(map, sourceId, layerId) {
    try {
        // Helper function to safely get element state
        const getElementState = (id) => {
            const element = document.getElementById(id);
            return element ? element.checked : false;
        };

        // Helper function to safely get color boxes and their states
        const getColorBoxesAndStates = (id) => {
            const container = document.getElementById(id);
            if (!container) return { colors: [], categoryStates: [] };
            
            const items = container.querySelectorAll('.category-item');
            const result = Array.from(items).map(item => {
                const colorBox = item.querySelector('.color-box');
                const checkbox = item.querySelector('.category-checkbox');
                const color = window.getComputedStyle(colorBox).backgroundColor;
                return {
                    color: color.replace(/rgba?\(([^)]+)\)/, (_, p1) => {
                        const parts = p1.split(',').map(p => p.trim());
                        return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
                    }),
                    enabled: checkbox ? checkbox.checked : false
                };
            });
            
            return {
                colors: result.map(r => r.color),
                categoryStates: result.map(r => r.enabled)
            };
        };

        // Get current filter states and colors
        const filters = {
            '500k': {
                enabled: getElementState('income500k-parent'),
                ...getColorBoxesAndStates('income500k-categories')
            },
            '250k': {
                enabled: getElementState('income250k-parent'),
                ...getColorBoxesAndStates('income250k-categories')
            },
            '200k': {
                enabled: getElementState('income200k-parent'),
                ...getColorBoxesAndStates('income200k-categories')
            }
        };

        // Fallback colors if needed
        const colorScheme = {
            '500k': ['rgba(255, 0, 0, 0.5)', 'rgba(255, 128, 0, 0.5)', 'rgba(255, 255, 0, 0.5)', 
                    'rgba(0, 128, 0, 0.5)', 'rgba(0, 0, 255, 0.5)'],
            '250k': ['rgba(255, 0, 0, 0.5)', 'rgba(255, 128, 0, 0.5)', 'rgba(255, 255, 0, 0.5)', 
                    'rgba(0, 128, 0, 0.5)', 'rgba(0, 0, 255, 0.5)'],
            '200k': ['rgba(255, 0, 0, 0.5)', 'rgba(255, 128, 0, 0.5)', 'rgba(255, 255, 0, 0.5)', 
                    'rgba(0, 128, 0, 0.5)', 'rgba(0, 0, 255, 0.5)']
        };
        
        Object.keys(filters).forEach(level => {
            if (!filters[level].colors.length) {
                console.warn(`No colors found for ${level}, using fallback colors`);
                filters[level].colors = colorScheme[level];
                filters[level].categoryStates = [true, true, true, true, true];
            } else {
                // Convert existing colors to have 0.5 opacity
                filters[level].colors = filters[level].colors.map(color => {
                    return color.replace(/rgba?\(([^)]+)\)/, (_, p1) => {
                        const parts = p1.split(',').map(p => p.trim());
                        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 0.5)`;
                    });
                });
            }
        });

        // Set up color expression for solid colors
        const colorExpression = [
            'case',
            // If 500k is enabled and has >500 kids
            ['all',
                ['boolean', filters['500k'].enabled],
                ['>', ['get', 'kids_500k'], 500]
            ],
            [
                'case',
                ['all', ['boolean', filters['500k'].categoryStates[0]], ['>=', ['get', 'kids_500k'], 1500]], filters['500k'].colors[0],
                ['all', ['boolean', filters['500k'].categoryStates[1]], ['>=', ['get', 'kids_500k'], 1250]], filters['500k'].colors[1],
                ['all', ['boolean', filters['500k'].categoryStates[2]], ['>=', ['get', 'kids_500k'], 1000]], filters['500k'].colors[2],
                ['all', ['boolean', filters['500k'].categoryStates[3]], ['>=', ['get', 'kids_500k'], 750]], filters['500k'].colors[3],
                ['all', ['boolean', filters['500k'].categoryStates[4]], ['>=', ['get', 'kids_500k'], 500]], filters['500k'].colors[4],
                'rgba(0, 0, 0, 0)'
            ],
            // If 250k is enabled and has >500 kids
            ['all',
                ['boolean', filters['250k'].enabled],
                ['>', ['get', 'kids_250k'], 500]
            ],
            [
                'case',
                ['all', ['boolean', filters['250k'].categoryStates[0]], ['>=', ['get', 'kids_250k'], 1500]], filters['250k'].colors[0],
                ['all', ['boolean', filters['250k'].categoryStates[1]], ['>=', ['get', 'kids_250k'], 1250]], filters['250k'].colors[1],
                ['all', ['boolean', filters['250k'].categoryStates[2]], ['>=', ['get', 'kids_250k'], 1000]], filters['250k'].colors[2],
                ['all', ['boolean', filters['250k'].categoryStates[3]], ['>=', ['get', 'kids_250k'], 750]], filters['250k'].colors[3],
                ['all', ['boolean', filters['250k'].categoryStates[4]], ['>=', ['get', 'kids_250k'], 500]], filters['250k'].colors[4],
                'rgba(0, 0, 0, 0)'
            ],
            // If 200k is enabled and has >500 kids
            ['all',
                ['boolean', filters['200k'].enabled],
                ['>', ['get', 'kids_200k'], 500]
            ],
            [
                'case',
                ['all', ['boolean', filters['200k'].categoryStates[0]], ['>=', ['get', 'kids_200k'], 1500]], filters['200k'].colors[0],
                ['all', ['boolean', filters['200k'].categoryStates[1]], ['>=', ['get', 'kids_200k'], 1250]], filters['200k'].colors[1],
                ['all', ['boolean', filters['200k'].categoryStates[2]], ['>=', ['get', 'kids_200k'], 1000]], filters['200k'].colors[2],
                ['all', ['boolean', filters['200k'].categoryStates[3]], ['>=', ['get', 'kids_200k'], 750]], filters['200k'].colors[3],
                ['all', ['boolean', filters['200k'].categoryStates[4]], ['>=', ['get', 'kids_200k'], 500]], filters['200k'].colors[4],
                'rgba(0, 0, 0, 0)'
            ],
            // Default: transparent
            'rgba(0, 0, 0, 0)'
        ];

        // Update the layer properties
        if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'fill-color', colorExpression);
        } else {
            console.warn(`Layer ${layerId} not found`);
        }
    } catch (error) {
        console.error('Error in updateLayerColors:', error);
    }
}

function updateFilters() {
    const income200kCategories = document.getElementById('income200k-categories');
    const income250kCategories = document.getElementById('income250k-categories');
    const income500kCategories = document.getElementById('income500k-categories');

    filters = {
        '500k': {
            enabled: document.getElementById('income500k-parent').checked,
            categories: {},
            colors: Array.from(income500kCategories.querySelectorAll('.color-box')).map(box => {
                const color = window.getComputedStyle(box).backgroundColor;
                return color.replace(/rgba?\(([^)]+)\)/, (_, p1) => {
                    const parts = p1.split(',').map(p => p.trim());
                    return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
                });
            })
        },
        '250k': {
            enabled: document.getElementById('income250k-parent').checked,
            categories: {},
            colors: Array.from(income250kCategories.querySelectorAll('.color-box')).map(box => {
                const color = window.getComputedStyle(box).backgroundColor;
                return color.replace(/rgba?\(([^)]+)\)/, (_, p1) => {
                    const parts = p1.split(',').map(p => p.trim());
                    return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
                });
            })
        },
        '200k': {
            enabled: document.getElementById('income200k-parent').checked,
            categories: {},
            colors: Array.from(income200kCategories.querySelectorAll('.color-box')).map(box => {
                const color = window.getComputedStyle(box).backgroundColor;
                return color.replace(/rgba?\(([^)]+)\)/, (_, p1) => {
                    const parts = p1.split(',').map(p => p.trim());
                    return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
                });
            })
        }
    };

    // Update category states
    ['500k', '250k', '200k'].forEach(level => {
        const categories = document.getElementById(`income${level}-categories`);
        if (categories) {
            categories.querySelectorAll('.category-item').forEach((item, index) => {
                const checkbox = item.querySelector('.category-checkbox');
                const label = item.querySelector('.category-label').textContent;
                filters[level].categories[label] = checkbox.checked;
            });
        }
    });
}

// Export initialization function
export function initTileLoader(mapInstance) {
    map = mapInstance;
    
    // Initialize filters
    updateFilters();
    
    // Load metadata and initialize UI once map is ready
    loadMetadata().then(loadedMetadata => {
        metadata = loadedMetadata;
        if (metadata) {
            // Setup map event handlers
            map.on('moveend', checkVisibleTiles);
            map.on('zoomend', checkVisibleTiles);
            
            // Initial check for visible tiles
            checkVisibleTiles();
        }
    });

    // Listen for filter changes
    document.querySelectorAll('.parent-checkbox, .category-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFilters();
            Array.from(loadedTiles).forEach(gridId => {
                const sourceId = `source-${gridId}`;
                const layerId = `layer-${gridId}`;
                updateLayerColors(map, sourceId, layerId);
            });
        });
    });
}
