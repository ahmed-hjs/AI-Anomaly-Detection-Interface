import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/**
 * Centralise la connexion Socket.IO + le fetch initial vers backend-node, pour que
 * toutes les pages (Dashboard, Robot, ...) partagent le même état sans ouvrir
 * plusieurs connexions. Gère aussi l'état du mode démo (rejeu de database.txt).
 */
export function useRobotData() {
  const [reading, setReading] = useState({});
  const [history, setHistory] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [robot, setRobot] = useState({ name: "R-07", uptimeSeconds: 0, connected: true });
  const [connected, setConnected] = useState(false);
  const [demo, setDemo] = useState({ running: false, index: 0, total: null });
  // Scores d'anomalie IA par moteur + bloc GNSS/batterie (voir backend-node/controllers/aiController.js)
  const [aiGroups, setAiGroups] = useState([]);
  const [aiHistory, setAiHistory] = useState({}); // { groupId: [{timestamp, mae, threshold, score, is_anomaly}, ...] }
  const [latestAiVerdict, setLatestAiVerdict] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/sensors/latest`)
      .then((r) => r.json())
      .then((data) => {
        if (data.reading) setReading(data.reading);
        if (data.history) setHistory(data.history);
        if (data.robot) setRobot(data.robot);
      })
      .catch(() => {});

    fetch(`${BACKEND_URL}/api/alerts?limit=100`)
      .then((r) => r.json())
      .then((data) => setAlerts(data.alerts || []))
      .catch(() => {});

    fetch(`${BACKEND_URL}/api/demo/status`)
      .then((r) => r.json())
      .then((data) => setDemo(data))
      .catch(() => {});

    fetch(`${BACKEND_URL}/api/ai/latest`)
      .then((r) => r.json())
      .then((data) => {
        if (data.groups) setAiGroups(data.groups);
        if (data.history) setAiHistory(data.history);
        if (data.latestVerdict) setLatestAiVerdict(data.latestVerdict);
      })
      .catch(() => {});

    const socket = io(BACKEND_URL, { transports: ["websocket"] });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("sensor:update", ({ reading: newReading }) => {
      setReading(newReading);
      setHistory((prev) => {
        const next = { ...prev };
        Object.entries(newReading).forEach(([key, value]) => {
          const arr = next[key] ? [...next[key], value] : [value];
          next[key] = arr.slice(-60);
        });
        return next;
      });
      setRobot((prev) => ({ ...prev, uptimeSeconds: (prev.uptimeSeconds || 0) + 1 }));
    });

    socket.on("alert:new", (newAlerts) => {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 300));
    });

    socket.on("demo:status", (status) => setDemo(status));

    socket.on("ai:scores", (verdict) => {
      setLatestAiVerdict(verdict);
      setAiHistory((prev) => {
        const next = { ...prev };
        const groups = [...(verdict.motors || []), verdict.shared].filter(Boolean);
        groups.forEach((g) => {
          const point = {
            timestamp: verdict.timestamp,
            mae: g.mae,
            threshold: g.threshold,
            score: g.score,
            is_anomaly: g.is_anomaly,
          };
          const arr = next[g.id] ? [...next[g.id], point] : [point];
          next[g.id] = arr.slice(-200);
        });
        return next;
      });
    });

    return () => socket.disconnect();
  }, []);

  const startDemo = useCallback(async (intervalMs = 100, stepSize = 5) => {
    await fetch(`${BACKEND_URL}/api/demo/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervalMs, stepSize }),
    });
  }, []);

  const stopDemo = useCallback(async () => {
    await fetch(`${BACKEND_URL}/api/demo/stop`, { method: "POST" });
  }, []);

  const recentCriticalSensors = useMemo(() => {
    const cutoff = Date.now() - 60_000;
    return new Set(
      alerts.filter((a) => a.severity === "critical" && a.timestamp >= cutoff).map((a) => a.sensor)
    );
  }, [alerts]);

  // Capteurs figés (avertissement, orange) signalés récemment — distinct des critiques.
  const recentWarningSensors = useMemo(() => {
    const cutoff = Date.now() - 60_000;
    return new Set(
      alerts.filter((a) => a.severity === "warning" && a.timestamp >= cutoff).map((a) => a.sensor)
    );
  }, [alerts]);

  return {
    reading,
    history,
    alerts,
    robot,
    connected,
    demo,
    startDemo,
    stopDemo,
    recentCriticalSensors,
    recentWarningSensors,
    aiGroups,
    aiHistory,
    latestAiVerdict,
  };
}
