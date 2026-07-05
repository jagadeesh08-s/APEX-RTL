import pandas as pd
import numpy as np
import pickle
import os
import time
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

# Try to import XGBoost and LightGBM
try:
    from xgboost import XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from lightgbm import LGBMRegressor
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

class RTLPredictor:
    def __init__(self, dataset_path="rtl_dataset.csv"):
        self.dataset_path = dataset_path
        self.features = [
            'num_inputs', 'num_outputs', 'num_registers', 'num_wires',
            'num_always_sequential', 'num_always_combinational', 'num_assigns',
            'num_case_statements', 'num_arithmetic_ops', 'num_multipliers',
            'num_logical_ops', 'bitwidth_max', 'max_if_depth', 'sequential_ratio',
            'cyclomatic_complexity', 'fanout_estimate', 'ast_depth', 'num_parameters',
            'num_generate_blocks', 'num_memory_blocks', 'num_signed_ops',
            'fsm_state_count', 'combinational_path_len', 'pipeline_depth'
        ]
        self.targets = ['area', 'power', 'delay']
        self.models = {}
        self.feature_importances = {}
        self.model_metrics = {}

    def train_and_evaluate(self):
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Dataset {self.dataset_path} not found. Please run dataset_generator.py first.")

        df = pd.read_csv(self.dataset_path)
        X = df[self.features]
        
        print("--- Model Training and Evaluation Report ---")
        
        for target in self.targets:
            y = df[target]
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            print(f"\nTarget Metric: {target.upper()}")
            print("-" * 65)
            
            best_r2 = -float('inf')
            best_model = None
            best_model_name = ""
            best_train_time = 0.0
            
            models_to_test = {
                "Ridge Regression": Ridge(alpha=1.0),
                "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
                "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, random_state=42)
            }
            
            # Add XGBoost if available
            if HAS_XGB:
                models_to_test["XGBoost"] = XGBRegressor(n_estimators=100, random_state=42, max_depth=6, learning_rate=0.1)
            else:
                print("Note: XGBoost package not available. Skipping in active training.")
                
            # Add LightGBM if available
            if HAS_LIGHTGBM:
                models_to_test["LightGBM"] = LGBMRegressor(n_estimators=100, random_state=42, max_depth=6, learning_rate=0.1, verbose=-1)
            else:
                print("Note: LightGBM package not available. Skipping in active training.")
            
            for name, model in models_to_test.items():
                start_time = time.time()
                model.fit(X_train, y_train)
                train_time = time.time() - start_time
                
                preds = model.predict(X_test)
                
                # Metrics
                mae = mean_absolute_error(y_test, preds)
                rmse = root_mean_squared_error(y_test, preds)
                r2 = r2_score(y_test, preds)
                
                print(f"{name:18} | R2: {r2:6.4f} | MAE: {mae:8.3f} | RMSE: {rmse:8.3f} | Fit: {train_time:.3f}s")
                
                if r2 > best_r2:
                    best_r2 = r2
                    best_model = model
                    best_model_name = name
                    best_train_time = train_time
            
            print(f"Selected Best Model for {target}: {best_model_name} (R2 = {best_r2:.4f})")
            
            # Save metrics
            self.model_metrics[target] = {
                "algorithm": best_model_name,
                "r2_score": float(best_r2),
                "training_time_s": float(best_train_time)
            }
            
            # Save the best model
            self.models[target] = best_model
            with open(f"model_{target}.pkl", 'wb') as f:
                pickle.dump(best_model, f)
                
            # Extract feature importance
            if hasattr(best_model, 'feature_importances_'):
                importances = best_model.feature_importances_
                feat_imp = pd.Series(importances, index=self.features).sort_values(ascending=False)
                self.feature_importances[target] = feat_imp.to_dict()
                
                print(f"Top 3 Features for {target}:")
                for feat, val in list(self.feature_importances[target].items())[:3]:
                    print(f"  - {feat}: {val:.4f}")
            else:
                # For Ridge regression
                coefs = np.abs(best_model.coef_)
                feat_imp = pd.Series(coefs, index=self.features).sort_values(ascending=False)
                self.feature_importances[target] = feat_imp.to_dict()

        # Save feature importances and metrics
        with open("feature_importances.pkl", 'wb') as f:
            pickle.dump(self.feature_importances, f)
            
        with open("model_metrics.pkl", 'wb') as f:
            pickle.dump(self.model_metrics, f)
            
        print("\nAll models trained and saved successfully.")

    def predict(self, feature_dict):
        # Prepare inputs as DataFrame
        df_in = pd.DataFrame([feature_dict])[self.features]
        predictions = {}
        
        start_time = time.time()
        for target in self.targets:
            if target not in self.models:
                with open(f"model_{target}.pkl", 'rb') as f:
                    self.models[target] = pickle.load(f)
            predictions[target] = float(self.models[target].predict(df_in)[0])
        
        inference_latency_ms = (time.time() - start_time) * 1000.0
        predictions["inference_latency_ms"] = float(inference_latency_ms)
        
        return predictions

if __name__ == "__main__":
    predictor = RTLPredictor()
    predictor.train_and_evaluate()
