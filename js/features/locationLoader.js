// Import config
import { config } from '../../config.js';

let map; // Will be initialized from main script
let popup; // Global popup for hover states
let activeStatusFilters = new Set(['#Medium', '#High', '#Low']); // Track active status filters
let enrollmentZonesLayer = null; // Track enrollment zones layer
let zoneFeatures = []; // Store all zone features
let activeZoneTypes = new Set(['active', 'discussions', 'potential', 'rejected']); // Track active zone types

// Status to zone type mapping
const statusToZoneType = {
    '#Medium': 'medium',
    '#High': 'high',
    '#Low': 'low'
};

// Zone type to status mapping
const zoneTypeToStatus = {
    'medium': '#Medium',
    'high': '#High',
    'low': '#Low'
};

// Status colors for zones
const statusColors = {
    '#Medium': '#4CAF50',     // Green
    '#High': '#2196F3', // Blue
    '#Low': '#FFC107',    // Yellow
};

// Initialize location loader
export function initLocationLoader(mapInstance) {
    map = mapInstance;
    
    // Create popup
    popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
        className: 'location-popup',
        anchor: 'bottom',
        maxWidth: '300px'
    });

    createLocationFilters();
    createStatusFilters();
    loadLocationLayers();
    loadEnrollmentZones();
    initZoneControls();
}

// Initialize zone controls
function initZoneControls() {
    // Add event listeners for zone toggles
    const zoneTypes = ['medium', 'high', 'low'];
    zoneTypes.forEach(type => {
        document.getElementById(`zone-${type}`).addEventListener('change', (e) => {
            updateZoneVisibility(type, e.target.checked);
        });
    });
}

// Update zone visibility based on type
function updateZoneVisibility(zoneType, isVisible) {
    if (!map.getLayer('enrollment-zones')) return;

    if (isVisible) {
        activeZoneTypes.add(zoneType);
    } else {
        activeZoneTypes.delete(zoneType);
    }

    // Update the source data to only include visible features
    const visibleFeatures = zoneFeatures.filter(feature => {
        const status = feature.properties.status;
        const type = statusToZoneType[status];
        return activeZoneTypes.has(type) && activeStatusFilters.has(status);
    });

    map.getSource('enrollment-zones').setData({
        type: 'FeatureCollection',
        features: visibleFeatures
    });
}


// Create location filters in HTML
function createLocationFilters() {
    const filterForm = document.getElementById('filter-form');

    // Create location filters section
    const locationSection = document.createElement('div');
    locationSection.className = 'location-controls';
    locationSection.innerHTML = '<h3>Location Filters</h3>';

    // Create container for location filters
    const locationFilters = document.createElement('div');
    locationFilters.className = 'location-filters';

    // Create filters for each location layer
    config.locationLayers.forEach(layer => {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'location-filter';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `location-${layer.id}`;
        checkbox.checked = true; // Always checked by default
        checkbox.addEventListener('change', () => toggleLocationLayer(layer.id));

        // Create shape preview container
        const shapeContainer = document.createElement('span');
        shapeContainer.style.cssText = `
            display: inline-block;
            vertical-align: middle;
            margin: 0 8px;
        `;

        // Create SVG for shape preview
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('viewBox', '0 0 24 24');
        
        let shapePath;
        if (layer.defaultShape === 'circle') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shapePath.setAttribute('cx', '12');
            shapePath.setAttribute('cy', '12');
            shapePath.setAttribute('r', '8');
        } else if (layer.defaultShape === 'square') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shapePath.setAttribute('x', '4');
            shapePath.setAttribute('y', '4');
            shapePath.setAttribute('width', '16');
            shapePath.setAttribute('height', '16');
        } else if (layer.defaultShape === 'star') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const points = [];
            const outerRadius = 10;
            const innerRadius = outerRadius * 0.4;
            for (let i = 0; i < 10; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / 5 - Math.PI / 2;
                const x = 12 + radius * Math.cos(angle);
                const y = 12 + radius * Math.sin(angle);
                points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
            }
            points.push('Z');
            shapePath.setAttribute('d', points.join(' '));
        } else if (layer.defaultShape === 'triangle') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const height = 16;
            const side = height * 2 / Math.sqrt(3);
            shapePath.setAttribute('d', `M 12 4 L ${12 + side/2} 20 L ${12 - side/2} 20 Z`);
        } else if (layer.defaultShape === 'diamond') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            shapePath.setAttribute('d', 'M 12 4 L 20 12 L 12 20 L 4 12 Z');
        } else if (layer.defaultShape === 'hexagon') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const hexPoints = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3 - Math.PI / 6;
                const x = 12 + 8 * Math.cos(angle);
                const y = 12 + 8 * Math.sin(angle);
                hexPoints.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
            }
            hexPoints.push('Z');
            shapePath.setAttribute('d', hexPoints.join(' '));
        } else if (layer.defaultShape === 'pentagon') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pentPoints = [];
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const x = 12 + 8 * Math.cos(angle);
                const y = 12 + 8 * Math.sin(angle);
                pentPoints.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
            }
            pentPoints.push('Z');
            shapePath.setAttribute('d', pentPoints.join(' '));
        } else if (layer.defaultShape === 'cross') {
            shapePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            shapePath.setAttribute('d', 'M 4 12 L 20 12 M 12 4 L 12 20');
            shapePath.setAttribute('stroke-linecap', 'square');
        }

        shapePath.setAttribute('fill', '#888888'); // Use a neutral gray for shape preview
        shapePath.setAttribute('stroke', '#000');
        shapePath.setAttribute('stroke-width', config.defaultStrokeWidths[layer.defaultShape]);

        svg.appendChild(shapePath);
        shapeContainer.appendChild(svg);

        const label = document.createElement('label');
        label.htmlFor = `location-${layer.id}`;
        label.textContent = layer.name;
        label.style.verticalAlign = 'middle';

        filterContainer.appendChild(checkbox);
        filterContainer.appendChild(shapeContainer);
        filterContainer.appendChild(label);
        locationFilters.appendChild(filterContainer);
    });

    locationSection.appendChild(locationFilters);
    filterForm.appendChild(locationSection);
}

// Create status filters in HTML
function createStatusFilters() {
    const filterForm = document.getElementById('filter-form');

    // Create status filters section
    const statusSection = document.createElement('div');
    statusSection.className = 'status-controls';
    statusSection.innerHTML = '<h3>Status Filters</h3>';

    // Create container for status filters with grey background
    const statusFilters = document.createElement('div');
    statusFilters.className = 'status-filters';
    statusFilters.style.cssText = `
        background-color: #f8f8f8;
        border-radius: 4px;
        padding: 10px;
    `;

    // Define status types and their labels
    const statusTypes = [
        { id: 'High', label: 'High Enrollment (20+)' },
        { id: 'Medium', label: 'Medium Enrollment (6-19)' },
        { id: 'Low', label: 'Low Enrollment (1-5)' },
    ];

    // Create filters for each status type
    statusTypes.forEach(status => {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'status-filter';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `status-${status.id}`;
        checkbox.checked = true;
        checkbox.addEventListener('change', (e) => toggleStatusFilter(status.id, e.target.checked));

        // Create color preview box
        const colorBox = document.createElement('div');
        colorBox.style.cssText = `
            display: inline-block;
            width: 12px;
            height: 12px;
            background-color: ${config.statusColors['#' + status.id]};
            border: 1px solid #000000;
            margin-right: 6px;
            vertical-align: middle;
        `;

        const label = document.createElement('label');
        label.htmlFor = `status-${status.id}`;
        label.textContent = status.label;
        label.style.verticalAlign = 'middle';

        filterContainer.appendChild(checkbox);
        filterContainer.appendChild(colorBox);
        filterContainer.appendChild(label);
        statusFilters.appendChild(filterContainer);
    });

    statusSection.appendChild(statusFilters);
    filterForm.appendChild(statusSection);
}

// Toggle status filter
function toggleStatusFilter(statusId, isVisible) {
    const styleUrl = `#${statusId}`;
    if (isVisible) {
        activeStatusFilters.add(styleUrl);
    } else {
        activeStatusFilters.delete(styleUrl);
    }

    // Update visibility for all layers
    config.locationLayers.forEach(layer => {
        const layerId = `layer-${layer.id}`;
        if (map.getLayer(layerId)) {
            const locationEnabled = document.getElementById(`location-${layer.id}`).checked;
            const visibility = locationEnabled ? 'visible' : 'none';
            map.setLayoutProperty(layerId, 'visibility', visibility);

            if (visibility === 'visible') {
                // Filter features based on active status filters
                const filter = ['in', ['get', 'styleUrl'], ['literal', Array.from(activeStatusFilters)]];
                map.setFilter(layerId, filter);
            }
        }
    });

    // Update enrollment zones filter
    if (map.getLayer('enrollment-zones')) {
        const features = zoneFeatures.filter(feature => {
            const status = feature.properties.status;
            const type = statusToZoneType[status];
            return activeZoneTypes.has(type) && activeStatusFilters.has(status);
        });

        map.getSource('enrollment-zones').setData({
            type: 'FeatureCollection',
            features: features
        });
    }
}

// Toggle location layer
function toggleLocationLayer(layerId) {
    const fullLayerId = `layer-${layerId}`;
    if (map.getLayer(fullLayerId)) {
        const isVisible = document.getElementById(`location-${layerId}`).checked;
        map.setLayoutProperty(fullLayerId, 'visibility', isVisible ? 'visible' : 'none');
        
        if (isVisible) {
            // Re-apply status filters when showing layer
            const filter = ['in', ['get', 'styleUrl'], ['literal', Array.from(activeStatusFilters)]];
            map.setFilter(fullLayerId, filter);
        }
    }
}

// Load KML layers
function loadLocationLayers() {
    config.locationLayers.forEach(layer => {
        // Load KML file
        fetch(layer.file)
            .then(response => response.text())
            .then(kmlText => {
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, 'text/xml');
                
                // Extract coordinates and properties from KML
                const placemarks = kml.getElementsByTagName('Placemark');
                const features = Array.from(placemarks).map(placemark => {
                    const coordinates = placemark.getElementsByTagName('coordinates')[0].textContent
                        .trim()
                        .split(',')
                        .map(Number);

                    const nTag = placemark.getElementsByTagName('n')[0];
                    const title = nTag ? nTag.textContent : '';
                    const description = placemark.getElementsByTagName('description')[0]?.textContent || '';
                    const styleUrl = placemark.getElementsByTagName('styleUrl')[0]?.textContent || '';
                    
                    // Remove CDATA wrapper if present
                    const cleanDescription = description.replace(/^\[CDATA\[|\]\]$/g, '').trim();

                    return {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [coordinates[0], coordinates[1]]
                        },
                        properties: {
                            name: title,
                            description: cleanDescription,
                            styleUrl: styleUrl
                        }
                    };
                });

                // Create GeoJSON source
                const sourceId = `source-${layer.id}`;
                map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: features
                    }
                });

                // Add layer for points
                const layerId = `layer-${layer.id}`;

                // Create icons for each status color
                Object.entries(config.statusColors).forEach(([status, color]) => {
                    // Create icon with the status color and shape
                    // Remove the '#' from status since our icons are named without it
                    const statusId = status.slice(1);
                    const iconId = `${layer.defaultShape}-${statusId}`;
                    if (!map.hasImage(iconId)) {
                        const { canvasSize, displaySize, padding } = config.iconConfig;
                        const scale = canvasSize / displaySize;
                        
                        const canvas = document.createElement('canvas');
                        canvas.width = canvasSize;
                        canvas.height = canvasSize;
                        const ctx = canvas.getContext('2d');
                        
                        // Clear the canvas
                        ctx.clearRect(0, 0, canvasSize, canvasSize);

                        // Scale everything up
                        ctx.save();
                        ctx.scale(scale, scale);

                        // Set up common styles
                        ctx.fillStyle = color; 
                        ctx.strokeStyle = '#000000';
                        // Scale the stroke width relative to the display size
                        const baseStrokeWidth = config.defaultStrokeWidths[layer.defaultShape];
                        const scaledStrokeWidth = (baseStrokeWidth * displaySize * config.iconConfig.strokeScale) / 24;
                        ctx.lineWidth = scaledStrokeWidth;
                        ctx.lineCap = 'square';

                        // Convert coordinates to display size
                        const drawCenter = displaySize / 2;
                        const drawPadding = padding;

                        switch (layer.defaultShape) {
                            case 'square':
                                ctx.beginPath();
                                ctx.rect(drawPadding, drawPadding, displaySize - 2 * drawPadding, displaySize - 2 * drawPadding);
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'diamond':
                                ctx.beginPath();
                                ctx.moveTo(drawCenter, drawPadding);
                                ctx.lineTo(displaySize - drawPadding, drawCenter);
                                ctx.lineTo(drawCenter, displaySize - drawPadding);
                                ctx.lineTo(drawPadding, drawCenter);
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'hexagon':
                                ctx.beginPath();
                                const hexRadius = (displaySize - 2 * drawPadding) / 2;
                                for (let i = 0; i < 6; i++) {
                                    const angle = (i * Math.PI) / 3 - Math.PI / 6;
                                    const x = drawCenter + hexRadius * Math.cos(angle);
                                    const y = drawCenter + hexRadius * Math.sin(angle);
                                    if (i === 0) ctx.moveTo(x, y);
                                    else ctx.lineTo(x, y);
                                }
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'pentagon':
                                ctx.beginPath();
                                const pentRadius = (displaySize - 2 * drawPadding) / 2;
                                for (let i = 0; i < 5; i++) {
                                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                                    const x = drawCenter + pentRadius * Math.cos(angle);
                                    const y = drawCenter + pentRadius * Math.sin(angle);
                                    if (i === 0) ctx.moveTo(x, y);
                                    else ctx.lineTo(x, y);
                                }
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'cross':
                                const crossWidth = (displaySize - 2 * drawPadding) / 3;
                                ctx.beginPath();
                                // Horizontal bar
                                ctx.rect(drawPadding, drawCenter - crossWidth/2, displaySize - 2*drawPadding, crossWidth);
                                // Vertical bar
                                ctx.rect(drawCenter - crossWidth/2, drawPadding, crossWidth, displaySize - 2*drawPadding);
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'star':
                                const outerRadius = (displaySize - 2 * drawPadding) / 2;
                                const innerRadius = outerRadius * 0.4;
                                ctx.beginPath();
                                for (let i = 0; i < 10; i++) {
                                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                                    const angle = (i * Math.PI) / 5 - Math.PI / 2;
                                    const x = drawCenter + radius * Math.cos(angle);
                                    const y = drawCenter + radius * Math.sin(angle);
                                    if (i === 0) ctx.moveTo(x, y);
                                    else ctx.lineTo(x, y);
                                }
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'triangle':
                                const height = displaySize - 2 * drawPadding;
                                const side = height * 2 / Math.sqrt(3);
                                ctx.beginPath();
                                ctx.moveTo(drawCenter, drawPadding);
                                ctx.lineTo(drawCenter + side/2, displaySize - drawPadding);
                                ctx.lineTo(drawCenter - side/2, displaySize - drawPadding);
                                ctx.closePath();
                                ctx.fill();
                                ctx.stroke();
                                break;

                            case 'circle':
                            default:
                                ctx.beginPath();
                                ctx.arc(drawCenter, drawCenter, (displaySize - 2 * drawPadding) / 2, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.stroke();
                                break;
                        }

                        ctx.restore();

                        map.addImage(iconId, {
                            width: canvasSize,
                            height: canvasSize,
                            data: ctx.getImageData(0, 0, canvasSize, canvasSize).data
                        });
                    }
                });

                // Add symbol layer for the points
                map.addLayer({
                    id: layerId,
                    type: 'symbol',
                    source: sourceId,
                    layout: {
                        'symbol-placement': 'point',
                        'icon-image': [
                            'concat',
                            layer.defaultShape,
                            '-',
                            // Remove the '#' from styleUrl since our icons are named without it
                            ['slice', ['get', 'styleUrl'], 1]
                        ],
                        'icon-size': config.iconConfig.mapIconScale,
                        'icon-allow-overlap': true
                    },
                    filter: ['in', ['get', 'styleUrl'], ['literal', Array.from(activeStatusFilters)]]
                });

                // Add hover effect
                map.on('mouseenter', layerId, (e) => {
                    map.getCanvas().style.cursor = 'pointer';
                    if (e.features.length > 0) {
                        updatePopup(e.features[0]);
                    }
                });

                map.on('mouseleave', layerId, () => {
                    map.getCanvas().style.cursor = '';
                    popup.remove();
                });
            })
            .catch(error => console.error(`Error loading KML for ${layer.id}:`, error));
    });
}

// Helper function to update popup
function updatePopup(feature) {
    const coordinates = feature.geometry.coordinates.slice();
    const name = feature.properties.name;
    const description = feature.properties.description;

    // Format popup content
    const content = `
        <div class="popup-content">
            <h4>${name}</h4>
            ${description ? `<p>${description}</p>` : ''}
        </div>
    `;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(coordinates[0]) > 180) {
        coordinates[0] += coordinates[0] > 0 ? -360 : 360;
    }

    popup.setLngLat(coordinates)
        .setHTML(content)
        .addTo(map);
}
