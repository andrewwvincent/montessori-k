// Map configuration
export const config = {
    style: 'mapbox://styles/mapbox/streets-v12',
    accessToken: 'pk.eyJ1IjoiYW5kcmV3LXZpbmNlbnQiLCJhIjoiY202OW4wNm5yMGlubzJtcTJmMnBxb2x1cSJ9.jrR3Ucv9Nvtc-T_7aKIQCg',
    CSV: '../data/locations.csv',
    center: [-97.7431, 30.2672], // Austin coordinates
    zoom: 7.5, // Moderately zoomed in on Austin
    title: 'Heatmaps - Number of Children from Households above Different Income Levels',
    description: 'Heatmaps of density of children ages 5-14 from households above different income levels in the United States.',
    sideBarInfo: ["Location_Name"],
    popupInfo: ["Location_Name"],
    token: 'pk.eyJ1IjoiYW5kcmV3d3ZpbmNlbnQiLCJhIjoiY2xkdzZ1ejB4MHRxbDN2bzZ0ZGNvMnY5YiJ9.zqIgFE8xhfvgRqR1GQgK_Q',
    container: 'map',
    defaultShapeSizes: {
        circle: 8,
        square: 8,
        star: 10,
        triangle: 10,
        diamond: 9,
        hexagon: 9,
        pentagon: 9,
        cross: 10
    },
    defaultStrokeWidths: {
        circle: 2,      // Base stroke width for simple shapes
        square: 2,      // Match circle stroke width
        star: 2.5,      // Slightly thicker for complex shapes
        triangle: 2.5,  // Match star stroke width
        diamond: 2,     // Match simple shape stroke width
        hexagon: 2,     // Match simple shape stroke width
        pentagon: 2,    // Match simple shape stroke width
        cross: 2.5      // Match complex shape stroke width
    },
    iconConfig: {
        canvasSize: 32,       // Size of the canvas for map icons
        displaySize: 18,      // Base size for calculations
        mapIconScale: 1,   // Scale factor for icons on the map
        padding: 4,           // Padding around shapes
        strokeScale: 0.5     // Scale factor for stroke widths (smaller = thinner strokes)
    },
    // Define status colors
    statusColors: {
        '#Medium': '#f8ea01',    // Yellow for potential partners
        '#High': '#039147',      // Green for active locations
        '#Low': '#db050d'  // Red for no contract
    },

    // List of major cities/metro areas for quick navigation
    cities: [
        {name: 'AL - Huntsville', coordinates: [-86.6248, 34.7327], zoom: 11},
        {name: 'AZ - Phoenix', coordinates: [-112.0969, 33.4686], zoom: 10},
        {name: 'CA - Bay Area', coordinates: [-122.2392, 37.8009], zoom: 9},
        {name: 'CA - Fresno', coordinates: [-119.7854, 36.7686], zoom: 11},
        {name: 'CA - Los Angeles', coordinates: [-118.3267, 34.0439], zoom: 9},
        {name: 'CA - Sacramento', coordinates: [-121.4847, 38.5848], zoom: 10},
        {name: 'CA - San Diego', coordinates: [-117.1455, 32.7343], zoom: 10},
        {name: 'CA - Santa Barbara', coordinates: [-119.7173, 34.4241], zoom: 11},
        {name: 'CO - Colorado Springs', coordinates: [-104.7452, 38.9749], zoom: 11},
        {name: 'CO - Denver', coordinates: [-104.9979, 39.7473], zoom: 10},
        {name: 'CO - Fort Collins', coordinates: [-105.0026, 40.536], zoom: 11},
        {name: 'CT - Hartford', coordinates: [-72.6748, 41.7664], zoom: 11},
        {name: 'CT - Stamford', coordinates: [-73.5426, 41.059], zoom: 10},
        {name: 'DC - Washington DC', coordinates: [-77.0458, 38.9143], zoom: 9},
        {name: 'FL - Boca Raton', coordinates: [-80.1062, 26.3717], zoom: 11},
        {name: 'FL - Fort Lauderdale', coordinates: [-80.1695, 26.126], zoom: 11},
        {name: 'FL - Jacksonville', coordinates: [-81.5472, 30.164], zoom: 11},
        {name: 'FL - Miami', coordinates: [-80.2121, 25.7718], zoom: 10},
        {name: 'FL - North Palm Beach', coordinates: [-80.0652, 26.8264], zoom: 11},
        {name: 'FL - Orlando', coordinates: [-81.3871, 28.5431], zoom: 11},
        {name: 'FL - Tampa', coordinates: [-82.5072, 27.9518], zoom: 10},
        {name: 'FL - West Palm Beach', coordinates: [-80.0834, 26.7329], zoom: 11},
        {name: 'GA - Atlanta', coordinates: [-84.3903, 33.7574], zoom: 9.5},
        {name: 'GA - Augusta', coordinates: [-82.0251, 33.4819], zoom: 11},
        {name: 'IA - Des Moines', coordinates: [-93.7681, 41.6101], zoom: 11},
        {name: 'ID - Boise', coordinates: [-116.3909, 43.6396], zoom: 11},
        {name: 'IL - Chicago', coordinates: [-87.7106, 41.872], zoom: 9},
        {name: 'IN - Indianapolis', coordinates: [-86.1691, 39.7795], zoom: 10},
        {name: 'KS - Kansas City', coordinates: [-94.6517, 39.1091], zoom: 10},
        {name: 'KY - Louisville', coordinates: [-85.6217, 38.2641], zoom: 11},
        {name: 'LA - Baton Rouge', coordinates: [-91.0295, 30.3625], zoom: 11},
        {name: 'MA - Boston', coordinates: [-71.0847, 42.3519], zoom: 10},
        {name: 'MI - Ann Arbor', coordinates: [-83.4745, 42.482], zoom: 10},
        {name: 'MI - Grand Rapids', coordinates: [-85.6613, 42.9697], zoom: 10},
        {name: 'MN - Minneapolis-St. Paul', coordinates: [-93.2442, 44.9643], zoom: 9.5},
        {name: 'MN - Rochester', coordinates: [-92.4623, 44.0217], zoom: 11},
        {name: 'MO - St. Louis', coordinates: [-90.5537, 38.6711], zoom: 10},
        {name: 'NC - Charlotte', coordinates: [-80.8448, 35.2361], zoom: 10},
        {name: 'NC - Raleigh', coordinates: [-78.6356, 35.7919], zoom: 10},
        {name: 'NE - Omaha', coordinates: [-96.0833, 41.2613], zoom: 10.5},
        {name: 'NJ - Manalapan Township', coordinates: [-74.3324, 40.2973], zoom: 10},
        {name: 'NJ - Newark', coordinates: [-74.1812, 40.7317], zoom: 9},
        {name: 'NJ - Princeton', coordinates: [-74.6594, 40.3501], zoom: 11},
        {name: 'NJ - Trenton', coordinates: [-74.7654, 40.2217], zoom: 11},
        {name: 'NV - Las Vegas', coordinates: [-115.1853, 36.1765], zoom: 10},
        {name: 'NY - Buffalo', coordinates: [-78.8349, 42.9072], zoom: 10},
        {name: 'NY - Long Island', coordinates: [-73.4253, 40.7929], zoom: 10},
        {name: 'NY - NYC', coordinates: [-73.9685, 40.7543], zoom: 12},
        {name: 'NY - Rochester', coordinates: [-77.5087, 43.0992], zoom: 11},
        {name: 'OH - Akron', coordinates: [-81.5153, 41.0333], zoom: 10},
        {name: 'OH - Cincinnati', coordinates: [-84.3614, 39.272], zoom: 10},
        {name: 'OH - Cleveland', coordinates: [-81.4988, 41.4767], zoom: 10.5},
        {name: 'OH - Columbus', coordinates: [-83.0087, 40.108], zoom: 10},
        {name: 'OR - Portland', coordinates: [-122.6802, 45.5095], zoom: 10},
        {name: 'PA - Philadelphia', coordinates: [-75.1664, 39.947], zoom: 9.5},
        {name: 'PA - Pittsburgh', coordinates: [-80.0002, 40.4428], zoom: 10},
        {name: 'SC - Greenville', coordinates: [-82.299, 34.8376], zoom: 11},
        {name: 'SD - Sioux Falls', coordinates: [-96.7202, 43.5046], zoom: 11},
        {name: 'TN - Memphis', coordinates: [-89.7777, 35.1187], zoom: 11},
        {name: 'TN - Nashville', coordinates: [-86.8162, 35.9741], zoom: 10},
        {name: 'TX - Austin', coordinates: [-97.746, 30.293], zoom: 10},
        {name: 'TX - Dallas', coordinates: [-96.8173, 33.0086], zoom: 10},
        {name: 'TX - Fort Worth', coordinates: [-97.3225, 32.7657], zoom: 10},
        {name: 'TX - Houston', coordinates: [-95.3809, 29.7722], zoom: 9.5},
        {name: 'TX - Midland', coordinates: [-102.1239, 32.013], zoom: 11},
        {name: 'TX - San Antonio', coordinates: [-98.5167, 29.5692], zoom: 10},
        {name: 'UT - Salt Lake City', coordinates: [-111.8806, 40.7564], zoom: 9.5},
        {name: 'VA - Norfolk', coordinates: [-76.1436, 36.7691], zoom: 11},
        {name: 'VA - Richmond', coordinates: [-77.4511, 37.5427], zoom: 10},
        {name: 'WA - Richland', coordinates: [-119.287, 46.2879], zoom: 11},
        {name: 'WA - Seattle', coordinates: [-122.3322, 47.6108], zoom: 9.5},

        

    ],

    locationLayers: [
        {
            id: 'Higher Ground (Open)',
            name: 'Higher Ground (Open)',
            file: 'data/higher-ground-open.kml',
            defaultShape: 'hexagon',  // This location uses hexagons
            defaultChecked: false,
            defaultLabels: false,
            styles: {
                '#Low': '#4CAF50',
                '#Medium': '#2196F3',
                '#High': '#FFC107'
            }
        }
    ]
};
