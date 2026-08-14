"""
Génère un dataset labellisé de relevés capteurs (robot mobile) avec anomalies injectées,
utile pour évaluer le modèle (ai-backend) ou pour rejouer un scénario dans le frontend.

Usage :
    python generate_dataset.py --out robot_sensors.csv --n 4000 --anomaly-rate 0.03
"""

import argparse

import numpy as np
import pandas as pd


def generate(n_samples: int, anomaly_rate: float, seed: int = 7) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    df = pd.DataFrame({
        "motor_current_max": rng.normal(0.15, 0.03, n_samples).clip(0),
        "motor_temperature": rng.normal(35, 4, n_samples),
        "ecart_vitesse_max": rng.normal(0.02, 0.01, n_samples).clip(0),
        "ic_temperature": rng.normal(45, 5, n_samples),
        "numsv": rng.integers(18, 34, n_samples),
        "fixtype": rng.integers(3, 5, n_samples),
        "carrierstatus": rng.integers(0, 2, n_samples),
        "rtk_correction_ok": rng.integers(0, 2, n_samples),
        "horacc": rng.normal(0.02, 0.01, n_samples).clip(0),
        "veracc": rng.normal(0.03, 0.01, n_samples).clip(0),
        "gspeed": rng.normal(0.5, 0.3, n_samples).clip(0),
        "voltage": rng.normal(53.5, 0.6, n_samples),
        "current": rng.normal(-2.5, 1.2, n_samples),
        "percentage": rng.normal(78, 8, n_samples).clip(0, 100),
        "power_supply_health": rng.integers(0, 2, n_samples),
        "fault": np.zeros(n_samples),
        "status": rng.integers(120, 136, n_samples),
        "is_overheat": np.zeros(n_samples),
        "is_short_circuit": np.zeros(n_samples),
        "is_stall_detected": np.zeros(n_samples),
    })

    df["label"] = "normal"
    n_anomalies = int(n_samples * anomaly_rate)
    anomaly_idx = rng.choice(n_samples, size=n_anomalies, replace=False)

    scenarios = [
        "capteur_fige",       # une valeur reste bloquée (capteur figé)
        "surchauffe_moteur",  # pic de température moteur
        "chute_batterie",     # chute de tension / surintensité
        "perte_gnss",         # perte de précision GNSS
        "court_circuit",      # défaut matériel
    ]

    for idx in anomaly_idx:
        scenario = rng.choice(scenarios)
        if scenario == "capteur_fige":
            df.loc[idx, "motor_current_max"] = 0.10
        elif scenario == "surchauffe_moteur":
            df.loc[idx, "motor_temperature"] = rng.uniform(85, 110)
            df.loc[idx, "is_overheat"] = 1
        elif scenario == "chute_batterie":
            df.loc[idx, "voltage"] = rng.uniform(38, 45)
            df.loc[idx, "current"] = rng.uniform(-15, -8)
        elif scenario == "perte_gnss":
            df.loc[idx, "numsv"] = rng.integers(0, 6)
            df.loc[idx, "fixtype"] = 0
            df.loc[idx, "rtk_correction_ok"] = 0
        elif scenario == "court_circuit":
            df.loc[idx, "is_short_circuit"] = 1
            df.loc[idx, "fault"] = rng.integers(1, 5)

        df.loc[idx, "label"] = scenario

    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="robot_sensors.csv")
    parser.add_argument("--n", type=int, default=4000)
    parser.add_argument("--anomaly-rate", type=float, default=0.03)
    args = parser.parse_args()

    dataset = generate(args.n, args.anomaly_rate)
    dataset.to_csv(args.out, index=False)
    print(f"{len(dataset)} lignes générées -> {args.out} ({dataset['label'].ne('normal').sum()} anomalies)")
