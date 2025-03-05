import React, { useState, useRef } from 'react';
import { /api/generate-eda } from 'react-router-dom';

const ExploratoryDataAnalysis = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [analysisType, setAnalysisType] = useState('basic');
  const fileInputRef = useRef(null);

  // Handle CSV file upload
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    setCsvFileName(file.name);
    setReport(null); // Reset any previous report
    setError('');
  };

  // Reset file selection
  const resetCSVFile = () => {
    setCsvFile(null);
    setCsvFileName('');
    setReport(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate EDA report
  const generateReport = async () => {
    if (!csvFile) {
      setError('Please upload a CSV file first');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('analysis_type', analysisType);
      
      // Call your Python backend API
      const response = await fetch('https://your-python-api.com/generate-eda', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      setReport(result);
    } catch (err) {
      setError(`Failed to generate report: ${err.message}`);
      console.error('Error generating EDA report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chart-generator">
      <header className="app-header">
        <h1>Exploratory Data Analysis</h1>
        <p>Automatically analyze your data to discover insights</p>
        <nav className="app-nav">
          <Link to="/" className="nav-link">Back to Chart Generator</Link>
        </nav>
      </header>
      
      <main className="app-content">
        <div className="config-panel">
          <div className="panel-content">
            <h2>Data Analysis Configuration</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group file-upload">
              <label htmlFor="csvFile">Upload CSV File:</label>
              <div className="file-input-container">
                <input 
                  type="file" 
                  id="csvFile" 
                  accept=".csv" 
                  onChange={handleCSVUpload}
                  className="form-control file-input"
                  ref={fileInputRef}
                />
                {csvFileName && (
                  <div className="selected-file">
                    <span className="file-name">{csvFileName}</span>
                    <button className="reset-file" onClick={resetCSVFile}>✕</button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="analysisType">Analysis Type:</label>
              <select 
                id="analysisType" 
                value={analysisType} 
                onChange={(e) => setAnalysisType(e.target.value)}
                className="form-control"
              >
                <option value="basic">Basic Analysis</option>
                <option value="comprehensive">Comprehensive Analysis</option>
                <option value="minimal">Minimal (Faster for Large Files)</option>
              </select>
            </div>
            
            <button 
              className="generate-button" 
              onClick={generateReport}
              disabled={isLoading || !csvFile}
            >
              {isLoading ? 'Generating...' : 'Generate EDA Report'}
            </button>
            
            <div className="features-list">
              <h3>Analysis Features:</h3>
              <ul>
                <li>Missing value detection and visualization</li>
                <li>Outlier identification</li>
                <li>Correlation analysis between variables</li>
                <li>Distribution summaries with visualizations</li>
                <li>Descriptive statistics for each column</li>
                <li>Anomaly detection in numerical data</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="preview-panel">
          <div className="panel-content">
            <h2>EDA Report</h2>
            
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Generating comprehensive data analysis...</p>
                <p className="loading-note">This may take a few moments for larger datasets</p>
              </div>
            ) : !report ? (
              <div className="empty-report">
                <p>Upload a CSV file and click "Generate EDA Report" to analyze your data.</p>
                <div className="report-placeholder">
                  <div className="placeholder-icon">📊</div>
                  <p>Your analysis will appear here</p>
                </div>
              </div>
            ) : (
              <div className="report-container">
                {/* This iframe would load the HTML report generated by pandas-profiling */}
                <iframe 
                  title="EDA Report" 
                  className="report-frame"
                  srcDoc={report.html_content} 
                  width="100%" 
                  height="600px"
                  sandbox="allow-scripts"
                />
                
                <div className="report-actions">
                  <button 
                    className="download-button"
                    onClick={() => window.open(report.download_url)}
                  >
                    Download Full Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Chart Generator App - Automated EDA powered by Python</p>
      </footer>
      
      <style jsx>{`
        .app-nav {
          margin-top: 10px;
        }
        
        .nav-link {
          display: inline-block;
          padding: 8px 16px;
          background-color: #fff;
          color: #2563eb;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .nav-link:hover {
          background-color: #f0f9ff;
        }
        
        .generate-button {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          cursor: pointer;
          font-size: 1rem;
          margin-top: 1rem;
          width: 100%;
          transition: background-color 0.2s;
        }
        
        .generate-button:hover:not(:disabled) {
          background-color: #1d4ed8;
        }
        
        .generate-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
        
        .features-list {
          margin-top: 2rem;
          padding: 1rem;
          background-color: #f0f9ff;
          border-radius: 6px;
        }
        
        .features-list h3 {
          margin-top: 0;
          color: #0369a1;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }
        
        .features-list ul {
          margin: 0;
          padding-left: 1.5rem;
        }
        
        .features-list li {
          margin-bottom: 0.5rem;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }
        
        .loading-spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border-left-color: #2563eb;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        .loading-note {
          font-size: 0.9rem;
          color: #64748b;
          margin-top: 0.5rem;
        }
        
        .empty-report {
          text-align: center;
          padding: 2rem;
        }
        
        .report-placeholder {
          border: 2px dashed #cbd5e1;
          padding: 3rem;
          border-radius: 8px;
          margin-top: 1rem;
        }
        
        .placeholder-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .report-container {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .report-frame {
          border: none;
          width: 100%;
        }
        
        .report-actions {
          display: flex;
          justify-content: flex-end;
          padding: 1rem;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        
        .download-button {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }
        
        .download-button:hover {
          background-color: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default ExploratoryDataAnalysis;
