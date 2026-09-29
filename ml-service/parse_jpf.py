import json
import pandas as pd

def extract_project_data():
    path = "data/raw/JPF_Anonymised_Project_Data.json/JPF_Anonymised_Project_Data.json"
    print("Loading JSON...")
    # Read the file line by line or string to avoid memory issues if possible
    # Given it's 1.2 GB, let's just try json.load() and hope it fits in memory
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        projects_data = []
        for p_id, p_info in data.get("Projects", {}).items():
            projects_data.append({
                "Project_ID": p_info.get("Project_ID"),
                "UK_Region": p_info.get("UK_Region"),
                "Project_Type": p_info.get("Project_Type"),
                "Earliest_Project_Start_Date": p_info.get("Earliest_Project_Start_Date"),
                "Status_Data_Date": p_info.get("Status_Data_Date"),
                "Latest_Project_Finish_Date": p_info.get("Latest_Project_Finish_Date")
            })
            
        df = pd.DataFrame(projects_data)
        df.to_csv("data/raw/JPF_Projects_Summary.csv", index=False)
        print(f"Extracted {len(df)} projects.")
    except Exception as e:
        print(f"Error parsing JSON: {e}")

if __name__ == "__main__":
    extract_project_data()
