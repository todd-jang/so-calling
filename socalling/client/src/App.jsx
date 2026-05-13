import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './App.css';

const API_URL = 'http://localhost:4000';
const COLORS = ['#38bdf8', '#a855f7', '#10b981', '#94a3b8'];
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

function App() {
  const [alerts, setAlerts] = useState([]);
  const [aiSummary, setAiSummary] = useState('AI 인사이트를 불러오는 중...');
  const [chartData, setChartData] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. Try to load from Cache first
    const cached = localStorage.getItem('socalling_cache');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        setAlerts(data.alerts);
        setAiSummary(data.summary);
        setChartData(data.chart);
        setPredictions(data.predictions);
        console.log('[Cache] Loaded fresh data from LocalStorage');
        return;
      }
    }

    // 2. Fetch from Server if cache is stale
    try {
      setLoading(true);
      const alertRes = await axios.get(`${API_URL}/api/alerts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAlerts(alertRes.data);
      
      const analysis = await runAIAnalysis(alertRes.data);
      const preds = await fetchPredictions(alertRes.data);

      // Save to Cache
      const cachePayload = {
        data: { alerts: alertRes.data, summary: analysis.summary, chart: analysis.chart, predictions: preds },
        timestamp: Date.now()
      };
      localStorage.setItem('socalling_cache', JSON.stringify(cachePayload));
    } catch (err) {
      console.error('Data fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async (currentAlerts) => {
    const preds = {};
    for (const alert of currentAlerts) {
      try {
        const res = await axios.get(`${API_URL}/api/alerts/${alert._id}/prediction`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success) preds[alert._id] = res.data.data;
      } catch (e) {}
    }
    return preds;
  };

  const runAIAnalysis = async (currentAlerts) => {
    try {
      const items = currentAlerts.map(a => `${a.origin} -> ${a.destination}`);
      const response = await axios.post(`${API_URL}/api/ai/analyze-batch`, { items });

      if (response.data.success) {
        const { summary, classification } = response.data.data;
        setAiSummary(summary);
        const counts = classification.reduce((acc, curr) => {
          acc[curr.category] = (acc[curr.category] || 0) + 1;
          return acc;
        }, {});
        const chart = Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
        setChartData(chart);
        return { summary, chart };
      }
    } catch (err) {
      return { summary: 'AI 분석 연동 실패', chart: [] };
    }
    return { summary: '', chart: [] };
  };

  return (
    <div className="socalling-dashboard">
      <header className="header glass">
        <h1>Socalling <span>Secured</span></h1>
        <div className="ai-status">
          <div className={`dot ${loading ? 'pulse' : 'active'}`} />
          <span>Security & Cache Shield Active</span>
        </div>
      </header>

      <main className="main-layout">
        <section className="insight-section glass">
          <div className="insight-header">
            <i className="fas fa-shield-alt"></i>
            <h2>Encrypted AI Intelligence</h2>
          </div>
          <p className="summary-text">{aiSummary}</p>
        </section>

        <div className="content-grid">
          <div className="stats-column">
            <section className="chart-section glass">
              <h3>AI Category Trends</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #38bdf8', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="alerts-section glass">
            <h3>Monitoring & Predictions</h3>
            <div className="list">
              {alerts.map((alert) => (
                <div key={alert._id} className="alert-card prediction-card">
                  <div className="card-top">
                    <span className="route">{alert.origin} → {alert.destination}</span>
                    <span className="price-tag">{alert.targetPrice.toLocaleString()} KRW</span>
                  </div>
                  {predictions[alert._id] && (
                    <div className="prediction-detail">
                      <small>AI Forecast: {predictions[alert._id].nextPrice.toLocaleString()}원</small>
                      <p className="rec-text">{predictions[alert._id].recommendation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
