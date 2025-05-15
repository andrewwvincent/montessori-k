import json
import os
from pathlib import Path
import shutil
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

def load_geojson(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)

def save_geojson(data, file_path):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w') as f:
        json.dump(data, f)

def filter_and_merge_features(features, income_field, min_kids=500):
    """Filter features by minimum kids count and optionally merge adjacent polygons."""
    # Filter features that meet the minimum threshold
    filtered_features = []
    for feature in features:
        kids_count = feature['properties'].get(f'kids_{income_field}', 0)
        if kids_count >= min_kids:
            # Create a new feature with only the relevant income level
            new_feature = {
                'type': 'Feature',
                'geometry': feature['geometry'],
                'properties': {
                    'name': feature['properties']['name'],
                    'grid': feature['properties']['grid'],
                    f'kids_{income_field}': kids_count
                }
            }
            filtered_features.append(new_feature)
    
    return filtered_features

def process_tile(input_path, output_dir):
    """Process a single tile file for wealth mode."""
    print(f"Processing {input_path}...")
    
    # Load the tile data
    tile_data = load_geojson(input_path)
    tile_name = os.path.basename(input_path)
    
    # Create separate files for each income level
    for income_level in ['250k', '500k']:
        # Filter and optionally merge features
        filtered_features = filter_and_merge_features(
            tile_data['features'],
            income_level,
            min_kids=500
        )
        
        # Create new GeoJSON - always create the file even if empty
        output_data = {
            'type': 'FeatureCollection',
            'features': filtered_features
        }
        
        # Save to new location
        output_path = os.path.join(output_dir, income_level, tile_name)
        save_geojson(output_data, output_path)
        print(f"Saved {income_level} data to {output_path} ({len(filtered_features)} features)")

def process_all_tiles(input_dir, output_dir):
    """Process all tiles in the input directory."""
    # Create output directory structure
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.join(output_dir, '250k'), exist_ok=True)
    os.makedirs(os.path.join(output_dir, '500k'), exist_ok=True)
    
    # Copy metadata.json if it exists
    metadata_path = os.path.join(input_dir, 'metadata.json')
    if os.path.exists(metadata_path):
        shutil.copy2(metadata_path, os.path.join(output_dir, 'metadata.json'))
    
    # Process each tile file
    for file_name in os.listdir(input_dir):
        if file_name.endswith('.geojson') and file_name != 'metadata.json':
            input_path = os.path.join(input_dir, file_name)
            process_tile(input_path, output_dir)

if __name__ == '__main__':
    base_dir = Path(__file__).parent.parent
    input_dir = base_dir / 'data' / 'tiles'
    output_dir = base_dir / 'data' / 'wealth_tiles'
    
    print("Starting wealth tile processing...")
    process_all_tiles(str(input_dir), str(output_dir))
    print("Finished processing wealth tiles.")
