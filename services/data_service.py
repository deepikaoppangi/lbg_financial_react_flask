import json
from pathlib import Path

def load_json(path: Path):
    with open(path, "r") as f:
        return json.load(f)

def load_profile_data(data_dir: Path, profile_id: str = "james_thompson"):
    """Load profile-specific data. Returns expenses and time_series."""
    profile_path = data_dir / "profiles" / f"{profile_id}.json"
    if not profile_path.exists():
        # Fallback to default profile
        profile_path = data_dir / "profiles" / "james_thompson.json"
    
    profile_data = load_json(profile_path)
    return profile_data["expenses"], profile_data["time_series"]

def load_time_series(data_dir: Path, profile_id: str = "james_thompson"):
    _, time_series = load_profile_data(data_dir, profile_id)
    return time_series

def load_expenses(data_dir: Path, profile_id: str = "james_thompson"):
    expenses, _ = load_profile_data(data_dir, profile_id)
    return expenses

def get_available_profiles(data_dir: Path):
    """Get list of available profiles."""
    profiles_dir = data_dir / "profiles"
    if not profiles_dir.exists():
        return []
    
    profiles = []
    for profile_file in profiles_dir.glob("*.json"):
        try:
            profile_data = load_json(profile_file)
            profile_id = profile_file.stem
            profiles.append({
                "id": profile_id,
                "name": profile_data.get("name", profile_id.replace("_", " ").title())
            })
        except:
            continue
    
    return sorted(profiles, key=lambda x: x["id"])
