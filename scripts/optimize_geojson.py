import json
import os
import shutil
from pathlib import Path

TILES_DIR = Path(__file__).parent.parent / 'data' / 'tiles'
BACKUP_DIR = TILES_DIR / 'backup'
THRESHOLD = 500

def optimize_geojson():
    # Create backup directory if it doesn't exist
    BACKUP_DIR.mkdir(exist_ok=True)
    
    # Get all geojson files
    geojson_files = [f for f in TILES_DIR.glob('*.geojson') if f.name != 'metadata.json']
    total_files = len(geojson_files)
    
    print(f"Found {total_files} GeoJSON files to process")
    print("Creating backups in:", BACKUP_DIR)
    
    total_features_removed = 0
    total_size_before = 0
    total_size_after = 0
    
    for idx, file_path in enumerate(geojson_files, 1):
        print(f"\nProcessing {file_path.name} ({idx}/{total_files})...")
        
        # Backup original file
        backup_path = BACKUP_DIR / file_path.name
        shutil.copy2(file_path, backup_path)
        
        # Get original file size
        size_before = file_path.stat().st_size
        total_size_before += size_before
        
        # Read and parse the file
        with open(file_path, 'r') as f:
            geojson = json.load(f)
        
        original_feature_count = len(geojson['features'])
        
        # Filter and optimize features
        geojson['features'] = [
            {
                'type': feature['type'],
                'geometry': feature['geometry'],
                'properties': {
                    'name': feature['properties']['name'],
                    'grid': feature['properties']['grid'],
                    'kids_250k': feature['properties']['kids_250k']
                }
            }
            for feature in geojson['features']
            if feature['properties']['kids_250k'] > THRESHOLD
        ]
        
        features_removed = original_feature_count - len(geojson['features'])
        total_features_removed += features_removed
        
        # Write optimized file
        with open(file_path, 'w') as f:
            json.dump(geojson, f)
        
        # Get new file size
        size_after = file_path.stat().st_size
        total_size_after += size_after
        
        print(f"  Removed {features_removed} features below threshold")
        print(f"  Size reduced: {size_before/1024:.1f}KB → {size_after/1024:.1f}KB")

    print("\nOptimization complete!")
    print(f"Total features removed: {total_features_removed}")
    print(f"Total size reduction: {(total_size_before-total_size_after)/1024/1024:.2f}MB")
    print(f"  Before: {total_size_before/1024/1024:.2f}MB")
    print(f"  After:  {total_size_after/1024/1024:.2f}MB")
    print(f"\nOriginal files backed up to: {BACKUP_DIR}")

if __name__ == '__main__':
    optimize_geojson()
