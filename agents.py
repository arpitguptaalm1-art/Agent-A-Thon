import pandas as pd
import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# --- Data Agent ---
class UserDataAgent:
    """
    Handles storing user data into an Excel file.
    """
    def __init__(self, db_path="user_registrations.xlsx"):
        self.db_path = db_path
        self._ensure_db()

    def _ensure_db(self):
        if not os.path.exists(self.db_path):
            # Create an empty DataFrame with columns and save it
            df = pd.DataFrame(columns=["name", "age", "income", "occupation", "state", "disability", "category"])
            df.to_excel(self.db_path, index=False)

    def save_user(self, user_data: dict):
        """
        Appends a new user record to the Excel file.
        """
        try:
            # Load existing
            df = pd.read_excel(self.db_path)
            # Create new row
            new_row = pd.DataFrame([user_data])
            # Append
            df = pd.concat([df, new_row], ignore_index=True)
            # Save back
            df.to_excel(self.db_path, index=False)
            return True, "User data stored successfully."
        except Exception as e:
            return False, str(e)

# --- Analyzer Agent ---
class SchemeAnalyzerAgent:
    """
    Analyzes user profile against schemes to find the best match.
    Uses TF-IDF for text similarity + Hard rule filtering.
    """
    def __init__(self, schemes_file="schemes.json"):
        self.schemes_file = schemes_file
        self.schemes_data = self._load_schemes()
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self._train_model()

    def _load_schemes(self):
        try:
            # Use absolute path relative to this file
            base_dir = os.path.dirname(os.path.abspath(__file__))
            file_path = os.path.join(base_dir, self.schemes_file)
            
            if not os.path.exists(file_path):
                print(f"ERROR: Schemes file not found at {file_path}")
                return []
                
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"Successfully loaded {len(data)} schemes from {file_path}")
                return data
        except Exception as e:
            print(f"Error loading schemes: {e}")
            return []

    def _train_model(self):
        """
        'Trains' the model by vectorizing the scheme descriptions/keywords.
        """
        if not self.schemes_data:
            return
        
        # Create a corpus from scheme details
        self.corpus = []
        for scheme in self.schemes_data:
            # Combine relevant text fields for matching
            text = f"{scheme.get('title', '')} {scheme.get('type', '')} {' '.join(scheme.get('eligibility', []))} {scheme.get('criteria', {}).get('category', [''])[0]}"
            self.corpus.append(text)
        
        self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)

    def recommend(self, user_profile: dict):
        """
        Returns a list of schemes sorted by relevance and filtered by hard constraints.
        """
        if not self.schemes_data:
            return []

        # 1. Hard Filter (Eligibility Check)
        eligible_schemes = []
        indices = []
        
        user_income = float(user_profile.get('income', float('inf')))
        user_category = user_profile.get('category', '').lower()
        user_occupation = user_profile.get('occupation', '').lower()

        for idx, scheme in enumerate(self.schemes_data):
            criteria = scheme.get('criteria', {})
            
            # Income Check
            if 'max_income' in criteria:
                if user_income > criteria['max_income']:
                    continue # Not eligible
            
            # Category Check (Loose matching)
            if 'category' in criteria:
                allowed = [c.lower() for c in criteria['category']]
                # Check user category AND occupation (e.g., occupation="farmer" matches category="farmer")
                if user_category not in allowed and user_occupation not in allowed and 'general' not in allowed:
                    continue 

            eligible_schemes.append(scheme)
            indices.append(idx)

        # 2. Soft Sort (AI Similarity)
        if not eligible_schemes:
            return []

        # Create query from user profile
        query = f"{user_profile.get('occupation', '')} {user_profile.get('category', '')} {user_profile.get('state', '')} needs help with {user_profile.get('need', 'financial assistance')}"
        query_vec = self.vectorizer.transform([query])
        
        # Calculate similarity with ALL schemes, but only keep eligible ones
        # We need to map back to the subset
        
        results = []
        for scheme in eligible_schemes:
            # Re-calculate score just for this scheme (inefficient but safe for small data)
            # Better: use the pre-calculated matrix indices
            # Find original index
            original_idx = self.schemes_data.index(scheme)
            score = cosine_similarity(query_vec, self.tfidf_matrix[original_idx]).flatten()[0]
            
            results.append({
                "scheme": scheme,
                "score": score
            })

        # Sort by score descending
        results.sort(key=lambda x: x['score'], reverse=True)
        return results

# --- Simplifier Agent ---
class SimplifierAgent:
    """
    Takes complex scheme data and outputs easy-to-read text.
    """
    def simplify(self, recommendation_result, user_name="User"):
        """
        Generates a human-friendly response.
        """
        scheme = recommendation_result['scheme']
        score = recommendation_result['score']
        
        title = scheme.get('title', 'Unknown Scheme')
        benefits = scheme.get('benefits', [])
        benefits_text = " and ".join(benefits[:2]) # Take first 2 benefits
        
        # Template-based NLG
        intro = f"Hello {user_name}, based on your profile, we highly recommend the **{title}**."
        reason = f"This scheme is a great match because it specifically targets your needs."
        benefit_stmt = f"You can get {benefits_text}."
        action = f"To apply, simply {scheme.get('process', ['visit the website'])[0]}."
        
        full_text = f"{intro}\n\n{reason}\n{benefit_stmt}\n{action}"
        return full_text

