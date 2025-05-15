import os
import csv
import json
from pathlib import Path
import shutil

def create_square_polygon(lat, lon, size=0.015):
    """Create a square polygon from center point."""
    half_size = size / 2
    coordinates = [
        [lon - half_size, lat - half_size],  # bottom left
        [lon + half_size, lat - half_size],  # bottom right
        [lon + half_size, lat + half_size],  # top right
        [lon - half_size, lat + half_size],  # top left
        [lon - half_size, lat - half_size]   # close the polygon
    ]
    return {
        "type": "Polygon",
        "coordinates": [coordinates]
    }

def process_csv_files(input_dir, output_dir):
    """Process CSV files and create tile GeoJSON files."""
    # Create or clean the output directory
    tiles_dir = Path(output_dir) / 'tiles'
    tiles_dir.mkdir(parents=True, exist_ok=True)
    
    # Clear existing files in tiles directory
    for file in tiles_dir.glob('*.geojson'):
        try:
            file.unlink()
        except Exception as e:
            print(f"Warning: Could not delete {file}: {e}")
    
    # Dictionary to store features by grid reference
    grid_features = {}
    bounds = {}  # Store bounds for each grid
    
    # Get all CSV files
    csv_files = list(Path(input_dir).glob('*.csv'))
    total_files = len(csv_files)
    
    print(f"Found {total_files} CSV files to process")
    
    for i, csv_path in enumerate(csv_files, 1):
        # Extract R#C# from filename
        filename = csv_path.stem
        grid_ref = filename.split('_')[0]  # Gets R#C# part
        
        print(f"Processing file {i}/{total_files}: {filename}")
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    lat = float(row['Latitude'])
                    lon = float(row['Longitude'])
                    name = row['Name']
                    
                    # Update bounds for this grid
                    if grid_ref not in bounds:
                        bounds[grid_ref] = {
                            'min_lat': lat, 'max_lat': lat,
                            'min_lon': lon, 'max_lon': lon
                        }
                    else:
                        bounds[grid_ref]['min_lat'] = min(bounds[grid_ref]['min_lat'], lat)
                        bounds[grid_ref]['max_lat'] = max(bounds[grid_ref]['max_lat'], lat)
                        bounds[grid_ref]['min_lon'] = min(bounds[grid_ref]['min_lon'], lon)
                        bounds[grid_ref]['max_lon'] = max(bounds[grid_ref]['max_lon'], lon)
                    
                    # Create feature
                    feature = {
                        "type": "Feature",
                        "geometry": create_square_polygon(lat, lon),
                        "properties": {
                            "name": f"{grid_ref}_{name}",
                            "grid": grid_ref,
                            "kids_250k": float(row['Kids_GT_250k']),
                            "kids_500k": float(row['Kids_GT_500k']),
                            # Store other metrics for future use
                            "kids_100k": float(row['Kids_GT_100k']),
                            "kids_125k": float(row['Kids_GT_125k']),
                            "kids_150k": float(row['Kids_GT_150k']),
                            "kids_200k": float(row['Kids_GT_200k'])
                        }
                    }
                    
                    # Add to grid features
                    if grid_ref not in grid_features:
                        grid_features[grid_ref] = []
                    grid_features[grid_ref].append(feature)
                    
                except (ValueError, KeyError) as e:
                    print(f"Error processing row in {filename}: {e}")
                    continue
    
    # Create metadata file with grid information
    metadata = {
        "grids": {
            grid_ref: {
                "bounds": grid_bounds,
                "feature_count": len(grid_features[grid_ref])
            }
            for grid_ref, grid_bounds in bounds.items()
        }
    }
    
    with open(tiles_dir / 'metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    
    # Save each grid as a separate GeoJSON file
    for grid_ref, features in grid_features.items():
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        with open(tiles_dir / f"{grid_ref}.geojson", 'w', encoding='utf-8') as f:
            json.dump(geojson, f, indent=2)
        
        print(f"Created tile for {grid_ref} with {len(features)} features")
    
    print("Conversion complete!")

if __name__ == "__main__":
    input_dir = r"c:\Users\andre\OneDrive\Documents\Trilogy-Andrew-Desktop\Demo Heatmaps\Convert Points to Area\Final Heatmaps\data\demographics"
    output_dir = r"c:\Users\andre\OneDrive\Documents\Trilogy-Andrew-Desktop\Demo Heatmaps\Convert Points to Area\Final Heatmaps\data"
    
    process_csv_files(input_dir, output_dir)
    print("Conversion complete!")
