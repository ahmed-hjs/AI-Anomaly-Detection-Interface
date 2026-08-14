# Robot Anomaly Platform

Plateforme de supervision temps réel pour la détection d'anomalies sur un robot mobile à
4 moteurs (right/left front/rear) : télémétrie moteur, GNSS, batterie, avec un autoencodeur
LSTM (deep learning, fourni pré-entraîné) qui détecte les anomalies **par moteur**, en plus
d'une détection de capteurs figés.

## Architecture

```
sensor_reader.py (robot réel)  ──┐
                                  ├─► backend-node (Express + Socket.IO) ─► frontend-dashboard (React)
demo replay (database.txt)    ──┘         │
                                           ▼
                                 ai-backend (Flask + Keras LSTM, scoring par moteur)
```

- **sensor_reader.py** : tourne sur/à côté du robot, lit les capteurs et POST chaque relevé
  vers `backend-node` (`/api/sensors/ingest`). 
- **backend-node/** : point d'entrée unique pour le frontend. Reçoit les relevés réels
  (`/api/sensors/ingest`) ou rejoue le fichier de démo (`/api/demo/start`), détecte les
  capteurs figés, accumule une fenêtre glissante de 30 relevés et interroge `ai-backend`
  pour la détection d'anomalies **par moteur**, puis diffuse tout en temps réel via
  WebSocket (Socket.IO) — y compris un flux continu de scores (`ai:scores`) pour le graphe
  de la page "AI Robot".
- **ai-backend/** : sert le modèle IA — un autoencodeur LSTM qui reconstruit une
  fenêtre de 30 relevés × 45 capteurs. L'erreur de reconstruction est regroupée par moteur
  (`schema.MOTOR_GROUPS`) plutôt qu'en un seul score global. Les seuils d'anomalie sont calculés une fois (99.5e
  percentile de l'erreur observée sur `database.txt`) et mis en cache dans
  `thresholds.json`, généré automatiquement au premier appel à `/predict` si absent.
- **frontend-dashboard/** : dashboard (React + Tailwind + Recharts).
  - **Dashboard** : vue d'ensemble (température moteurs, batterie, GNSS) + bouton **Démo**.
  - **Robot** : détail de tous les capteurs, groupés par moteur.
  - **AI Robot** *(nouveau)* : un panneau par moteur (Right/Left Front/Rear + GNSS/Batterie)
    avec le score d'anomalie courant et son historique ; **surligné en rouge** dès qu'un
    moteur dépasse son seuil.
  - **Alertes** *(nouveau)* : liste filtrable (critique / avertissement / info) de toutes
    les alertes, y compris les anomalies IA nommées par moteur.
  - **Historique** *(nouveau)* : journal chronologique complet.

## Schéma des capteurs (réel)

Le schéma canonique vit dans **trois fichiers qui doivent rester synchronisés** :
`backend-node/utils/schema.js`, `ai-backend/schema.py`.

Pour chaque moteur `i` dans `0..3` (le moteur 0 n'a pas de suffixe) :
`motor_current{i}, motor_power{i}, commanded_velocity{i}, measured_velocity{i}, measured_position{i}, supply_voltage{i}, supply_current{i}, motor_temperature{i}, channel_temperature{i}`

Plus un bloc GNSS/batterie partagé :
`data, lat, lon, height, numSV, fixType, voltage, Current, percentage`

Soit 45 valeurs par relevé (sans le `time`).

### Mapping position des moteurs 

Les indices 0/1/2/3 (suffixes `""`, `"1"`, `"2"`, `"3"`) sont associés à :

| Indice | Position assumée |
|--------|-------------------|
| 0 (sans suffixe) | Right Front Motor |
| 1 | Left Front Motor |
| 2 | Right Rear Motor |
| 3 | Left Rear Motor |


## Démarrage rapide

### 1. AI backend

```bash
cd ai-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py               # démarre l'API sur http://localhost:5001
```

`model.keras` et `scaler.pkl` sont déjà ceux fournis (pas besoin de ré-entraîner). Au premier
appel à `/predict`, si `thresholds.json` n'existe pas encore, la calibration se lance
automatiquement (rejoue `../backend-node/data/database.txt`, peut prendre 1-2 minutes selon
la machine). Pour la relancer manuellement (après un nouvel entraînement, ou sur un autre
jeu de données) :

```bash
python calibrate_thresholds.py --data ../backend-node/data/database.txt
# ou, l'ai-backend étant déjà lancé :
curl -X POST http://localhost:5001/calibrate
```

Si tu veux ré-entraîner à partir de zéro : `python train_model.py --epochs 15` (sauvegarde
`model.keras` + `scaler.pkl` bruts, puis calibre automatiquement les seuils).

### 2. Backend Node

```bash
cd backend-node
cp .env.example .env
npm install
npm run dev                 # démarre sur http://localhost:4000
```

Aucune simulation ne démarre automatiquement. Le backend attend soit des relevés réels
(`POST /api/sensors/ingest`), soit un déclenchement du mode démo (`POST /api/demo/start`).

### 3. Frontend

```bash
cd frontend-dashboard
cp .env.example .env
npm install                 # installe notamment socket.io-client, ajouté pour ce câblage
npm run dev                 # démarre sur http://localhost:5173
```

### 4. Mode démo (sans robot)

Cliquer sur **"Lancer la démo"** dans le dashboard (ou `POST /api/demo/start`) rejoue
`backend-node/data/database.txt` ligne par ligne, à la même vitesse que les données réelles
(configurable via `intervalMs`), et boucle indéfiniment. Les mêmes détections (capteurs
figés + IA) s'appliquent que ce soit la démo ou le flux réel.

## API backend-node

| Méthode | Route                  | Description                                      |
|---------|-------------------------|---------------------------------------------------|
| GET     | `/api/sensors/latest`   | Dernier relevé + historique (sparklines)          |
| POST    | `/api/sensors/ingest`   | Pousse un relevé réel (utilisé par sensor_reader.py) |
| GET     | `/api/alerts`           | Alertes récentes                                   |
| POST    | `/api/demo/start`       | Démarre le rejeu de database.txt                   |
| POST    | `/api/demo/stop`        | Arrête le rejeu                                    |
| GET     | `/api/demo/status`      | État du rejeu (index courant / total)              |
| GET     | `/api/ai/latest`        | Dernier verdict IA + historique des scores par moteur |

Événements Socket.IO : `sensor:update`, `alert:new`, `demo:status`, et `ai:scores` (diffusé
à chaque fenêtre de 30 relevés, anomalie ou non — c'est ce qui alimente le graphe continu de
la page "AI Robot").


### 5. Robot réel

```bash
pip install -r requirements-sensor-reader.txt
python sensor_reader.py --backend-url http://localhost:4000 --interval 0.1
```

Complète la fonction `read_sensors()` dans `sensor_reader.py` avec la vraie lecture
matérielle (le squelette envoie des zéros pour vérifier la connexion au backend).



