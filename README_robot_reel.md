# Connecter `sensor_reader.py` à un robot réel

Ce guide explique comment brancher `sensor_reader.py` sur un **vrai robot** qui publie
déjà ses topics ROS sur le réseau — par opposition au test en local avec `file.bag`
(voir `README.md`, section rejeu de bag).

## Différence clé avec le test en local

Quand tu testais avec `file.bag`, **toi** tu lançais `roscore` (le master ROS) dans un
conteneur Docker, en plus de `sensor_reader.py` et `rosbag play`.

Avec un vrai robot, c'est différent : **le master ROS tourne déjà sur le robot
lui-même**. Tu ne dois jamais lancer un second `roscore` de ton côté — ROS ne
fonctionne qu'avec **un seul master** sur tout le réseau logique. `sensor_reader.py`
doit simplement s'y connecter en tant que client supplémentaire, comme n'importe quel
autre nœud du robot.

## Pourquoi pas Docker (sur Mac en tout cas)

Sur **Docker Desktop pour Mac**, le réseau du conteneur passe par une couche NAT
cachée dans une VM. Un appareil externe comme le robot peut difficilement ouvrir une
connexion **entrante** vers ton conteneur — or c'est exactement ce dont ROS a besoin :
une fois la négociation faite via le master (XML-RPC), les nœuds ouvrent des connexions
TCP **directes entre eux** (TCPROS) pour l'échange réel des données. Résultat typique
si tu essaies quand même : `rostopic list` fonctionne (ça passe par le master), mais
aucune donnée n'arrive jamais (le TCPROS direct échoue silencieusement).

- **Sur Mac** : installe ROS Noetic nativement avec
  [RoboStack](https://robostack.github.io/) (via `conda`/`mamba`), pas de Docker.
- **Sur Linux natif** : Docker fonctionne très bien pour ce cas aussi, à condition de
  lancer le conteneur avec `--network host` (pas de NAT dans ce cas, le conteneur
  partage directement la pile réseau de l'hôte).

## 1. Prérequis : installer ROS Noetic nativement (Mac, via RoboStack)

```bash
mamba create -n ros_env -c robostack-staging ros-noetic-ros-base
conda activate ros_env
```

## 2. Compiler les packages de messages custom

Les mêmes packages que dans `workspace/src` (`enova_msgs`, `roboteq_msgs`,
`motor_controller_msgs`) doivent être compilés **dans cet environnement**, pas dans
l'image Docker utilisée pour les tests en local :

```bash
mkdir -p ~/catkin_ws/src
cp -r workspace/src/* ~/catkin_ws/src/
cd ~/catkin_ws
catkin_make
source devel/setup.bash
```

## 3. Installer les dépendances Python du script

```bash
pip install -r requirements-sensor-reader.txt
```

## 4. Vérifier la connectivité réseau avec le robot

```bash
ping <IP_du_robot>
```

Le robot doit aussi pouvoir te joindre **en retour** sur ton adresse IP (pas juste toi
qui le pingues) — c'est nécessaire pour TCPROS. Assure-toi que ta machine et le robot
sont bien sur le même réseau/sous-réseau, et qu'aucun pare-feu ne bloque les ports ROS
(par défaut le master écoute sur `11311`, les nœuds négocient ensuite des ports
dynamiques).

## 5. Configurer les variables d'environnement ROS

**Important** : `ROS_MASTER_URI` et `ROS_IP` sont des variables d'environnement
**standard ROS**, lues automatiquement par `rospy` — elles ne sont ni lues ni
référencées dans le code de `sensor_reader.py`. Il faut les exporter dans le shell
**avant** de lancer le script :

```bash
export ROS_MASTER_URI=http://<IP_du_robot>:11311
export ROS_IP=<ton_IP_a_toi>
```

- `ROS_MASTER_URI` : où se trouve le master du robot.
- `ROS_IP` : l'adresse que **toi** tu annonces au master pour que le robot (et les
  autres nœuds) puisse t'ouvrir une connexion TCPROS en retour. Sans elle, ROS peut
  annoncer une IP interne inutilisable (typique dans un conteneur), et le robot ne
  pourra jamais t'envoyer de données malgré un abonnement apparemment réussi.

Pour connaître l'URI du master si tu as un accès SSH au robot :
```bash
ssh <utilisateur>@<IP_du_robot> 'echo $ROS_MASTER_URI'
```

## 6. Vérifier que tu vois bien les vrais topics du robot

```bash
rostopic list
```

Tu dois voir apparaître les topics réels du robot : `/battery/state`,
`/left/front/feedback`, `/left/rear/feedback`, `/right/front/feedback`,
`/right/rear/feedback`, `/ublox/gnss_fix`, `/ublox/gnss_status`,
`/ublox/rtk_correction`, `/left_roboteq_driver/status`,
`/right_roboteq_driver/status`.

Optionnel mais recommandé, vérifie qu'un topic publie vraiment des données avant de
lancer le script complet :
```bash
rostopic hz /left/front/feedback
```

## 7. Démarrer `backend-node`

Dans un terminal séparé (voir `README.md` principal) :
```bash
cd backend-node
npm run dev
```

## 8. Lancer `sensor_reader.py`

Pas besoin de `roscore` ni de `rosbag play` cette fois — seulement le script :

```bash
python3 sensor_reader.py _backend_url:=http://localhost:4000
```

Le log de démarrage doit confirmer l'URL cible :
```
[sensor_reader] Envoi vers http://localhost:4000/api/sensors/ingest toutes les 0.1s
```

## 9. Vérifier que ça marche

- Côté `backend-node` : les logs doivent montrer des `POST /api/sensors/ingest 200`.
- Côté navigateur : le dashboard doit afficher des valeurs qui bougent en temps réel.
- Vérification directe :
  ```bash
  curl -s http://localhost:4000/api/sensors/latest
  ```

## Dépannage rapide

| Symptôme | Cause probable |
|---|---|
| `rostopic list` ne montre que `/rosout` | Mauvais `ROS_MASTER_URI`, ou robot/master pas démarré |
| `rostopic list` marche mais aucune donnée n'arrive jamais dans `sensor_reader.py` | `ROS_IP` mal configuré, ou pare-feu bloquant les connexions TCPROS entrantes |
| `Failed to establish a new connection: Connection refused` côté `sensor_reader.py` | `backend-node` (`npm run dev`) n'est pas lancé, ou mauvais port/URL dans `--backend-url` / `_backend_url:=` |
| `Failed to parse: <url>` | Faute de frappe dans l'URL passée en paramètre (ex. `::` au lieu de `:`) |
| Un topic précis (ex. batterie) reste toujours à `0` alors que les autres fonctionnent | Le champ n'est peut-être simplement jamais rempli par le driver source (champs optionnels de `sensor_msgs/BatteryState` comme `voltage`/`charge`) — vérifier avec `rostopic echo <topic> -n 1` directement sur le robot |
| `roscore cannot run as another roscore/master is already running` | Normal et attendu ici — ne lance **jamais** `roscore` toi-même dans ce use case, le master du robot suffit |
