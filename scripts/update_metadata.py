import json
import glob
import os

def update_metadata():
    # Load existing metadata
    with open('data/tiles/metadata.json', 'r') as f:
        metadata = json.load(f)
    
    # Get all tile files
    tile_files = glob.glob('data/tiles/*.geojson')
    
    # For each tile file
    for tile_file in tile_files:
        grid_ref = os.path.basename(tile_file).replace('.geojson', '')
        
        # If grid not in metadata, add it
        if grid_ref not in metadata['grids']:
            # Load the tile to get its bounds
            with open(tile_file, 'r') as f:
                tile_data = json.load(f)
            
            # Calculate bounds from features
            min_lat = float('inf')
            max_lat = float('-inf')
            min_lon = float('inf')
            max_lon = float('-inf')
            
            for feature in tile_data['features']:
                coords = feature['geometry']['coordinates'][0]
                for coord in coords:
                    lon, lat = coord
                    min_lat = min(min_lat, lat)
                    max_lat = max(max_lat, lat)
                    min_lon = min(min_lon, lon)
                    max_lon = max(max_lon, lon)
            
            # Add to metadata
            metadata['grids'][grid_ref] = {
                'bounds': {
                    'min_lat': min_lat,
                    'max_lat': max_lat,
                    'min_lon': min_lon,
                    'max_lon': max_lon
                },
                'feature_count': len(tile_data['features'])
            }
    
    # Save updated metadata
    with open('data/tiles/metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

if __name__ == '__main__':
    update_metadata()
