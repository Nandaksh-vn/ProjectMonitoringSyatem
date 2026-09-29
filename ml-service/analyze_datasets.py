import os
import pandas as pd
import json

def get_datasets():
    datasets = []
    for root, dirs, files in os.walk("data/raw"):
        for file in files:
            if file.endswith((".csv", ".xlsx", ".xls", ".json", ".parquet")):
                datasets.append(os.path.join(root, file))
    return datasets

def analyze_datasets():
    datasets = get_datasets()
    inventory_md = "# Dataset Inventory\\n\\n"
    suitability_md = "# Dataset Suitability\\n\\n"
    
    for path in datasets:
        print(f"Analyzing {path}...")
        try:
            # Check size
            size_mb = os.path.getsize(path) / (1024 * 1024)
            if size_mb > 500:
                print(f"Skipping full load for {path} due to size ({size_mb:.2f} MB)")
                continue
                
            if path.endswith('.csv'):
                df = pd.read_csv(path, nrows=50000) # Read max 50k rows for speed
            elif path.endswith('.json'):
                df = pd.read_json(path, lines=True, chunksize=1000).__next__()
            else:
                continue
                
            rows = len(df)
            cols = len(df.columns)
            col_names = list(df.columns)
            missing = df.isnull().sum().to_dict()
            dtypes = df.dtypes.astype(str).to_dict()
            duplicates = df.duplicated().sum()
            
            num_cols = list(df.select_dtypes(include=['int64', 'float64']).columns)
            cat_cols = list(df.select_dtypes(include=['object', 'category']).columns)
            date_cols = list(df.select_dtypes(include=['datetime64']).columns)
            
            # Simple heuristic for ID columns
            id_cols = [c for c in col_names if 'id' in c.lower() or 'code' in c.lower()]
            
            inventory_md += f"## Dataset: {os.path.basename(path)}\\n"
            inventory_md += f"- **File Path**: {path}\\n"
            inventory_md += f"- **Rows (Sampled/Total)**: {rows}\\n"
            inventory_md += f"- **Columns**: {cols}\\n"
            inventory_md += f"- **Column Names**: {', '.join(col_names)}\\n"
            inventory_md += f"- **Numerical Columns**: {', '.join(num_cols)}\\n"
            inventory_md += f"- **Categorical Columns**: {', '.join(cat_cols)}\\n"
            inventory_md += f"- **Date Columns**: {', '.join(date_cols)}\\n"
            inventory_md += f"- **Possible ID Columns**: {', '.join(id_cols)}\\n"
            inventory_md += f"- **Duplicates**: {duplicates}\\n\\n"
            
            # Suitability
            cost_supported = any(c.lower() in ['actualcost', 'cost', 'budget', 'approved_cost', 'revised_cost'] for c in col_names)
            time_supported = any(c.lower() in ['duration', 'start', 'end', 'planned', 'actual_end', 'delay', 'schedule'] for c in col_names)
            risk_supported = any(c.lower() in ['risk', 'risk_score', 'risk_level'] for c in col_names)
            progress_supported = any(c.lower() in ['progress', 'status', 'milestone', 'completed'] for c in col_names)
            
            suitability_md += f"## Dataset: {os.path.basename(path)}\\n"
            suitability_md += f"- **Rows**: {rows}\\n"
            suitability_md += f"- **Columns**: {cols}\\n\\n"
            suitability_md += f"Cost Overrun: {'SUPPORTED' if cost_supported else 'NOT SUPPORTED'}\\n"
            suitability_md += f"Time Overrun: {'SUPPORTED' if time_supported else 'NOT SUPPORTED'}\\n"
            suitability_md += f"Risk Prediction: {'SUPPORTED' if risk_supported else 'NOT SUPPORTED'}\\n"
            suitability_md += f"Progress Analysis: {'SUPPORTED' if progress_supported else 'NOT SUPPORTED'}\\n\\n"
            suitability_md += f"Available fields: {', '.join(col_names)}\\n\\n"
            
        except Exception as e:
            print(f"Error analyzing {path}: {e}")
            
    os.makedirs('../docs', exist_ok=True)
    with open('../docs/dataset_inventory.md', 'w') as f:
        f.write(inventory_md)
    with open('../docs/dataset_suitability.md', 'w') as f:
        f.write(suitability_md)
    print("Generated inventory and suitability reports.")

if __name__ == '__main__':
    analyze_datasets()
