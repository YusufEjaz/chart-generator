import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import ChartGenerator from './components/ChartGenerator';
import ExploratoryDataAnalysis from './components/ExploratoryDataAnalysis';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<ChartGenerator />} />
        <Route path="/eda" element={<ExploratoryDataAnalysis />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
