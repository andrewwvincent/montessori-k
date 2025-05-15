import os
import csv
import json
from pathlib import Path

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

def process_csv_files(input_dir, output_file):
    """Process all CSV files and create a GeoJSON file."""
    features = []
    
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
                    
                    # Create feature
                    feature = {
                        "type": "Feature",
                        "geometry": create_square_polygon(lat, lon),
                        "properties": {
                            "name": f"{grid_ref}_{name}",
                            "kids_gt_100k": float(row['Kids_GT_100k']),
                            "kids_gt_125k": float(row['Kids_GT_125k']),
                            "kids_gt_150k": float(row['Kids_GT_150k']),
                            "kids_gt_200k": float(row['Kids_GT_200k']),
                            "kids_gt_250k": float(row['Kids_GT_250k']),
                            "kids_gt_500k": float(row['Kids_GT_500k'])
                        }
                    }
                    features.append(feature)
                except (ValueError, KeyError) as e:
                    print(f"Error processing row in {filename}: {e}")
                    continue
    
    # Create the GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    # Save with pretty printing
    print(f"Writing GeoJSON file with {len(features)} features...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=2)
    
    print("Conversion complete!")

if __name__ == "__main__":
    input_dir = r"c:\Users\andre\OneDrive\Documents\Trilogy-Andrew-Desktop\Demo Heatmaps\Convert Points to Area\Final Heatmaps\data\High-Demographics"
    output_file = r"c:\Users\andre\OneDrive\Documents\Trilogy-Andrew-Desktop\Demo Heatmaps\Convert Points to Area\Final Heatmaps\data\all_cities_new.geojson"
    
    process_csv_files(input_dir, output_file)
