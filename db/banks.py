# Not required by the other modules, but useful for UI
from typing import List, Dict

DEFAULT_BANKS: List[Dict] = [
    {"key": "relationships",  "label": "Relationships",        "description": "Friends, family, coworkers."},
    {"key": "preferences",    "label": "Personal Preferences", "description": "Food, colors, activities, tools."},
    {"key": "working_style",  "label": "Working Style",        "description": "Habits, focus windows, comms prefs."},
    {"key": "diet",           "label": "Diet & Nutrition",     "description": "Allergies, goals, restrictions."},
    {"key": "hobbies",        "label": "Hobbies & Interests",  "description": "Recurring interests and collections."},
    {"key": "career",         "label": "Career",               "description": "Role, skills, goals, mentors."},
    {"key": "custom",         "label": "Custom",               "description": "Anything else."},
]

def list_banks() -> List[Dict]:
    return DEFAULT_BANKS
