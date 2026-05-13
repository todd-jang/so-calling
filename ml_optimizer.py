import json

class ArchitecturalPhysicsEngine:
    """기후 데이터 기반 범용 건축 물리 엔진 (Seoul / Texas / Cambridge)"""
    
    def __init__(self, city_name):
        self.city = city_name
        self.data = self._fetch_climate_data()
        
    def _fetch_climate_data(self):
        db = {
            "cambridge": {"avg_temp": 9.5, "humidity": 80, "solar_rad": 120, "is_cold": True},
            "texas": {"avg_temp": 28.5, "humidity": 65, "solar_rad": 350, "is_cold": False},
            "seoul": {"avg_temp": 12.5, "humidity": 75, "solar_rad": 250, "is_cold": True}
        }
        return db.get(self.city.lower(), {"avg_temp": 15, "humidity": 50, "solar_rad": 200, "is_cold": False})

    def calculate_specs(self):
        city = self.city.lower()
        
        # 1. 단열 두께 (추운 지역일수록 두꺼움)
        if self.data["is_cold"]:
            insulation_thickness = max(100, (20 - self.data["avg_temp"]) * 15)
        else:
            insulation_thickness = 100
        
        # 2. 차양 길이 (더운 지역일수록 길어짐)
        if self.data["is_cold"]:
            overhang_depth = 300
        else:
            overhang_depth = max(1400, (self.data["solar_rad"] / 100) * 500)
        
        # 3. 창면적비 (지역별 최적화)
        wwr_map = {"seoul": 0.35, "cambridge": 0.30, "texas": 0.30}
        wwr = wwr_map.get(city, 0.3 if self.data["is_cold"] else 0.45)
        
        # 4. 층고 및 지형 (지역별 특성)
        if city == "seoul":
            ceiling_height = 2400
            topography = "Northern_Hillside_Stepped"
            floor_material = "Premium_Stone_with_Ondol"
            hvac = "Hybrid_Heating_Cooling"
        elif city == "texas":
            ceiling_height = 2700
            topography = "Flat_Texas_Plain"
            floor_material = "Cooling_Marble_Stone"
            hvac = "High_Performance_AC_Cooling"
        elif city == "cambridge":
            ceiling_height = 2600
            topography = "Gentle_Rolling_Hills"
            floor_material = "Heavy_Wool_Carpet"
            hvac = "Hydronic_Heating"
        else:
            ceiling_height = 2700
            topography = "Standard_Flat"
            floor_material = "Standard"
            hvac = "Standard"
        
        return {
            "city": self.city,
            "physics_metrics": {
                "insulation_thickness_mm": round(insulation_thickness, 1),
                "ceiling_height_mm": ceiling_height,
                "topography_focus": topography,
                "overhang_depth_mm": round(overhang_depth, 1),
                "window_to_wall_ratio": wwr,
                "floor_material": floor_material,
                "hvac_priority": hvac
            }
        }

def run_intelligent_pipeline(city):
    engine = ArchitecturalPhysicsEngine(city)
    build_spec = engine.calculate_specs()
    
    with open("climate_build_spec.json", "w", encoding="utf-8") as f:
        json.dump(build_spec, f, indent=4, ensure_ascii=False)
    
    print(f"====================================")
    print(f" {city.upper()} Final Design Spec")
    print(f"====================================")
    print(json.dumps(build_spec, indent=2, ensure_ascii=False))
    print(f"\n[Success] '{city}' climate-physics spec exported.")

if __name__ == "__main__":
    run_intelligent_pipeline("seoul")
