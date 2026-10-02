# LogiPredict AI — Shared Synthetic Data Specification

## 1. Ground Truth Specification & Seed Strategy

To ensure deterministic, reproducible results across unit tests, CI pipelines, local frontend mock servers, and backend database seeders, LogiPredict AI establishes a single shared synthetic schema specification.

- **Deterministic Seed**: `SEED = 42`
- **Reference Date (t=0)**: `2026-10-02T00:00:00Z`
- **Format**: JSON (UTF-8, ISO 8601 timestamps)
- **Primary Source Files**:
  - Backend: `backend/app/data/synthetic_catalog.json`
  - Frontend: `frontend/src/data/syntheticCatalog.json`

---

## 2. Canonical Identifier Matrix

### 2.1 Forward Operating Bases & Depots (`SupplyLocation`)

| Location ID | Standard Base Name | Node Type | Latitude | Longitude | Altitude (m) | Strategic Role |
|---|---|---|---|---|---|---|
| `LOC-SRI-01` | Srinagar Central Logistics Depot | `Base_Depot` | 34.0837 | 74.7973 | 1,585m | Corps Rear Reservoir & Rail Link |
| `LOC-KRG-02` | Kargil Forward Logistics Hub | `Forward_Logistics_Hub` | 34.5539 | 76.1349 | 2,676m | Suru Valley Echelon Staging Point |
| `LOC-LEH-03` | Leh Corps Supply Depot | `Base_Depot` | 34.1526 | 77.5771 | 3,500m | Eastern Ladakh Command Depot |
| `LOC-DRS-04` | Drass Forward Operating Base | `Forward_Operating_Base` | 34.4299 | 75.7669 | 3,280m | High-Altitude Extreme Cold Post |
| `LOC-SIA-05` | Siachen Base Support Camp | `Forward_Operating_Base` | 35.1667 | 77.1667 | 3,600m | Glacier Logistics Support Node |
| `LOC-KUP-06` | Kupwara Forward Support Hub | `Forward_Logistics_Hub` | 34.5262 | 74.2546 | 1,600m | Western Sector Tactical Hub |

---

### 2.2 Standard Military SKU Master (`InventoryItem`)

| Item ID | Nomenclature | Category | Min Threshold | Max Capacity | Daily Burn | Lead Time |
|---|---|---|---|---|---|---|
| `SKU-POL-DSL-01` | Winter Diesel ATF-800 (-40C) | `POL` | 30,000 L | 120,000 L | 3,200 L/d | 4 days |
| `SKU-POL-KRS-02` | High-Altitude Kerosene (Heating) | `POL` | 25,000 L | 80,000 L | 1,800 L/d | 5 days |
| `SKU-ORD-556-03` | 5.56mm INSAS Ammunition (Tins) | `Ordnance & Ammunition` | 200 Tins | 1,000 Tins | 12 Tins/d | 3 days |
| `SKU-ORD-81M-04` | 81mm Mortar Shells (Crated) | `Ordnance & Ammunition` | 150 Crates | 600 Crates | 8 Crates/d | 6 days |
| `SKU-RAT-MRE-05` | 24-hr High-Altitude Combat Rations | `Rations & Subsistence` | 5,000 Packs | 20,000 Packs | 450 Packs/d | 7 days |
| `SKU-MED-PLM-07` | Freeze-Dried Plasma & Vaccines | `Medical & Cold-Chain` | 100 Kits | 400 Kits | 6 Kits/d | 2 days |
| `SKU-ENG-BAT-09` | LiFePO4 24V Extreme-Cold Battery | `Spares & Engineering` | 30 Units | 150 Units | 2.5 Units/d | 6 days |

---

### 2.3 Strategic Route Corridors (`SupplyRoute`)

| Route ID | Corridor Name | Origin Node | Destination Node | Distance | Baseline Transit | Road State |
|---|---|---|---|---|---|---|
| `RTE-SRI-KRG-01` | NH-1D via Zoji La Pass | `LOC-SRI-01` | `LOC-KRG-02` | 204 km | 6.5 hrs | `High_Altitude_Pass` |
| `RTE-KRG-DRS-02` | NH-1D Kargil to Drass | `LOC-KRG-02` | `LOC-DRS-04` | 58 km | 1.8 hrs | `Clear_All_Weather` |
| `RTE-KRG-LEH-03` | NH-1 via Fotu La Pass | `LOC-KRG-02` | `LOC-LEH-03` | 216 km | 5.5 hrs | `Clear_All_Weather` |
| `RTE-LEH-SIA-04` | Leh to Siachen via Khardung La | `LOC-LEH-03` | `LOC-SIA-05` | 210 km | 8.5 hrs | `Snow_Bound` |
| `RTE-SRI-KUP-05` | Srinagar to Kupwara | `LOC-SRI-01` | `LOC-KUP-06` | 85 km | 2.5 hrs | `Clear_All_Weather` |

---

## 3. Synthetic Data Generation Code Recipe (Python / NumPy)

```python
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_synthetic_demand_history(
    sku_id: str,
    base_daily_demand: float,
    days: int = 90,
    seed: int = 42,
    weekend_drop: float = 0.85,
    winter_seasonality: float = 1.35,
) -> pd.DataFrame:
    """Generates reproducible historical daily consumption time series."""
    np.random.seed(seed)
    start_date = datetime(2026, 7, 4)
    dates = [start_date + timedelta(days=i) for i in range(days)]
    
    series = []
    for d in dates:
        day_of_week = d.weekday()
        # Weekly seasonality
        weekly_factor = weekend_drop if day_of_week in (5, 6) else 1.0
        # Cold weather seasonality multiplier
        month = d.month
        season_factor = winter_seasonality if month in (10, 11, 12, 1, 2) else 1.0
        # Noise
        noise = np.random.normal(loc=0.0, scale=0.08 * base_daily_demand)
        
        daily_val = max(0.0, (base_daily_demand * weekly_factor * season_factor) + noise)
        series.append({"timestamp": d.isoformat(), "item_id": sku_id, "actual_demand": round(daily_val, 2)})
        
    return pd.DataFrame(series)
```
