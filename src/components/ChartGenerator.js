import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter, 
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import Papa from 'papaparse';

const ChartGenerator = () => {
  // Chart configuration state
  const [chartConfig, setChartConfig] = useState({
    chartType: 'bar',
    chartCategory: 'basic',
    title: 'My Chart',
    xAxisLabel: 'X Axis',
    yAxisLabel: 'Y Axis',
    xAxisData: '1, 2, 3, 4, 5',
    yAxisData: '10, 15, 7, 20, 12',
    colors: '#8884d8, #82ca9d, #ffc658, #ff8042, #0088fe',
    showGrid: true,
    showLegend: true,
    fontSize: 12,
  });

  // CSV file handling state
  const [csvFile, setCsvFile] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvData, setCsvData] = useState(null);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedXColumn, setSelectedXColumn] = useState('');
  const [selectedYColumn, setSelectedYColumn] = useState('');
  const [usingCSV, setUsingCSV] = useState(false);
  const fileInputRef = useRef(null);

  // Processed data for charts
  const [chartData, setChartData] = useState([]);
  // Generated Python code
  const [pythonCode, setPythonCode] = useState('');
  // Error state
  const [error, setError] = useState('');

  // Chart type options organized by category
  const chartTypes = {
    basic: ['bar', 'horizontalBar', 'line', 'pie', 'scatter', 'area'],
    statistical: ['histogram', 'boxPlot', 'densityPlot'],
    advanced: ['3dSurface', 'heatmap', 'polarPlot', 'radarChart']
  };

  // Chart type names for display
  const chartTypeNames = {
    bar: 'Bar Chart',
    horizontalBar: 'Horizontal Bar Chart',
    line: 'Line Chart',
    pie: 'Pie Chart',
    scatter: 'Scatter Plot',
    area: 'Area Chart',
    histogram: 'Histogram',
    boxPlot: 'Box Plot',
    densityPlot: 'Density Plot',
    '3dSurface': '3D Surface Plot',
    heatmap: 'Heatmap',
    polarPlot: 'Polar Plot',
    radarChart: 'Radar/Spider Chart'
  };

  // Process CSV file when uploaded
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    setCsvFileName(file.name);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data);
          const columns = results.meta.fields || [];
          setCsvColumns(columns);
          
          // Auto-select first column for X and second for Y if available
          if (columns.length > 0) {
            setSelectedXColumn(columns[0]);
            setSelectedYColumn(columns.length > 1 ? columns[1] : columns[0]);
            setUsingCSV(true);
          }
        } else {
          setError('The CSV file appears to be empty or invalid');
        }
      },
      error: function(error) {
        setError('Error parsing CSV: ' + error.message);
      }
    });
  };
  
  // Reset CSV file
  const resetCSVFile = () => {
    setCsvFile(null);
    setCsvFileName('');
    setCsvData(null);
    setCsvColumns([]);
    setSelectedXColumn('');
    setSelectedYColumn('');
    setUsingCSV(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process input data whenever configuration or CSV selection changes
  useEffect(() => {
    try {
      let data = [];
      let xValues = [];
      let yValues = [];
      
      // Process data based on source (CSV or manual input)
      if (usingCSV && csvData && selectedXColumn && selectedYColumn) {
        // Process CSV data
        csvData.forEach(row => {
          const xValue = row[selectedXColumn];
          const yValue = row[selectedYColumn];
          if (xValue !== undefined && yValue !== undefined) {
            xValues.push(xValue);
            yValues.push(yValue);
            data.push({
              name: xValue,
              value: parseFloat(yValue) || 0,
              y: parseFloat(yValue) || 0
            });
          }
        });
      } else {
        // Process manually entered data
        xValues = chartConfig.xAxisData.split(',').map(x => x.trim());
        yValues = chartConfig.yAxisData.split(',').map(y => y.trim());
        
        // Validate data
        if (xValues.length === 0 || yValues.length === 0) {
          setError('Please enter valid data for X and Y axes');
          return;
        }
        
        if (xValues.length !== yValues.length) {
          setError(`X and Y data must have same length. Currently: X: ${xValues.length}, Y: ${yValues.length}`);
          return;
        }
        
        // Create data array for charts
        data = xValues.map((x, index) => ({
          name: x,
          value: parseFloat(yValues[index]) || 0,
          y: parseFloat(yValues[index]) || 0
        }));
      }
      
      setError('');
      setChartData(data);
      
      // Generate Python code based on chart type
      generatePythonCode(data, xValues, yValues);
    } catch (err) {
      setError('Error processing data: ' + err.message);
    }
  }, [chartConfig, usingCSV, csvData, selectedXColumn, selectedYColumn]);

  // Generate Python code based on chart configuration
  const generatePythonCode = (data, xValues, yValues) => {
    const colors = chartConfig.colors.split(',').map(c => c.trim());
    let code = '';
    
    // Common imports
    code += `import matplotlib.pyplot as plt\nimport numpy as np\n`;
    
    // Add CSV import if using CSV
    if (usingCSV && csvFileName) {
      code += `import csv\n\n`;
      
      // CSV reading code
      code += `# Function to read data from CSV\ndef read_csv_data(file_path):\n`;
      code += `    x_values = []\n    y_values = []\n    \n`;
      code += `    with open(file_path, 'r', newline='') as csvfile:\n`;
      code += `        reader = csv.DictReader(csvfile)\n`;
      code += `        for row in reader:\n`;
      code += `            # Get values from columns: "${selectedXColumn}" for X and "${selectedYColumn}" for Y\n`;
      code += `            if "${selectedXColumn}" in row and "${selectedYColumn}" in row:\n`;
      code += `                x_value = row["${selectedXColumn}"]\n`;
      code += `                y_value = row["${selectedYColumn}"]\n`;
      code += `                try:\n`;
      code += `                    # Convert Y value to float for numerical operations\n`;
      code += `                    y_value = float(y_value)\n`;
      code += `                    x_values.append(x_value)\n`;
      code += `                    y_values.append(y_value)\n`;
      code += `                except (ValueError, TypeError):\n`;
      code += `                    print(f"Warning: Could not convert value '{y_value}' to float. Row skipped.")\n`;
      code += `    return x_values, y_values\n\n`;
      
      // Call the function
      code += `# Load data from CSV file\n`;
      code += `file_path = "${csvFileName}"  # Update this with the actual path to your CSV file\n`;
      code += `x, y = read_csv_data(file_path)\n\n`;
    } else {
      // Manual data
      code += `\n# Data\nx = [${xValues.join(', ')}]\ny = [${yValues.join(', ')}]\n\n`;
    }
    
    code += `# Create figure and axis\nplt.figure(figsize=(10, 6))\n\n`;
    
    // Add title and labels
    code += `# Add title and labels\nplt.title("${chartConfig.title}", fontsize=${chartConfig.fontSize + 4})\n`;
    code += `plt.xlabel("${chartConfig.xAxisLabel}", fontsize=${chartConfig.fontSize})\n`;
    code += `plt.ylabel("${chartConfig.yAxisLabel}", fontsize=${chartConfig.fontSize})\n\n`;
    
    // Grid configuration
    if (chartConfig.showGrid) {
      code += `# Enable grid\nplt.grid(True, linestyle='--', alpha=0.7)\n\n`;
    }
    
    // Chart type specific code
    switch (chartConfig.chartType) {
      case 'bar':
        code += `# Create bar chart\nplt.bar(x, y, color=[${colors.map(c => `"${c}"`).join(', ')}], width=0.6, alpha=0.8)\n\n`;
        break;
      case 'horizontalBar':
        code += `# Create horizontal bar chart\nplt.barh(x, y, color=[${colors.map(c => `"${c}"`).join(', ')}], height=0.6, alpha=0.8)\n\n`;
        break;
      case 'line':
        code += `# Create line chart\nplt.plot(x, y, marker='o', linestyle='-', color="${colors[0]}", linewidth=2, markersize=6)\n\n`;
        break;
      case 'pie':
        code += `# Create pie chart\nplt.pie(y, labels=x, autopct='%1.1f%%', colors=[${colors.map(c => `"${c}"`).join(', ')}], shadow=True, startangle=90)\nplt.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle\n\n`;
        break;
      case 'scatter':
        code += `# Create scatter plot\nplt.scatter(x, y, color="${colors[0]}", s=100, alpha=0.7)\n\n`;
        break;
      case 'area':
        code += `# Create area chart\nplt.fill_between(x, y, color="${colors[0]}", alpha=0.5)\nplt.plot(x, y, color="${colors[0]}", linewidth=2)\n\n`;
        break;
      case 'histogram':
        code += `# Create histogram\nplt.hist(y, bins=len(y)//2 or 5, color="${colors[0]}", alpha=0.7, edgecolor='black')\n\n`;
        break;
      case 'boxPlot':
        code += `# Create box plot\nplt.boxplot(y, patch_artist=True, boxprops=dict(facecolor="${colors[0]}", color="black"), medianprops=dict(color="black"))\nplt.xticks([1], ["${chartConfig.xAxisLabel}"])\n\n`;
        break;
      case 'densityPlot':
        code += `# Create density plot (KDE)\nfrom scipy import stats\nkde = stats.gaussian_kde(y)\nx_kde = np.linspace(min(y), max(y), 100)\nplt.plot(x_kde, kde(x_kde), color="${colors[0]}", linewidth=2)\nplt.fill_between(x_kde, kde(x_kde), color="${colors[0]}", alpha=0.5)\n\n`;
        break;
      case '3dSurface':
        code += `# Create 3D surface plot\nfrom mpl_toolkits.mplot3d import Axes3D\n\n# Convert 1D data to 2D grid for surface plot\nx_grid = np.linspace(min(x), max(x), 10)\ny_grid = np.linspace(min(y), max(y), 10)\nX, Y = np.meshgrid(x_grid, y_grid)\nZ = np.sin(np.sqrt(X**2 + Y**2))\n\nfig = plt.figure(figsize=(10, 8))\nax = fig.add_subplot(111, projection='3d')\nsurf = ax.plot_surface(X, Y, Z, cmap='viridis', alpha=0.8, linewidth=0, antialiased=True)\nfig.colorbar(surf, shrink=0.5, aspect=5)\n\n`;
        break;
      case 'heatmap':
        code += `# Create heatmap\nimport matplotlib.pyplot as plt\nimport numpy as np\nimport seaborn as sns\n\n# Create a 2D grid from the 1D data (example transformation)\ndata_2d = np.outer(y, np.ones(len(y))) * np.outer(np.ones(len(x)), y)\n\nplt.figure(figsize=(10, 8))\nsns.heatmap(data_2d, annot=True, fmt=".1f", linewidths=.5, cmap="YlGnBu")\nplt.xticks(np.arange(len(x)) + 0.5, x)\nplt.yticks(np.arange(len(x)) + 0.5, x)\n\n`;
        break;
      case 'polarPlot':
        code += `# Create polar plot\ntheta = np.linspace(0, 2*np.pi, len(x), endpoint=False)\nradii = y\n\nplt.subplot(111, projection='polar')\nbars = plt.bar(theta, radii, width=0.3, bottom=0, alpha=0.8, color="${colors[0]}")\n\n# Set the labels for each bar\nplt.xticks(theta, x)\n\n`;
        break;
      case 'radarChart':
        code += `# Create radar chart\nimport matplotlib.pyplot as plt\nimport numpy as np\n\n# Number of variables\nn = len(x)\n\n# What will be the angle of each axis in the plot (divide the plot / number of variables)
angles = np.linspace(0, 2*np.pi, n, endpoint=False).tolist()\n\n# Make the plot close in a circle
angles += angles[:1]\ny_closed = y + [y[0]]\n\nfig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))\n\n# Draw one axis per variable and add labels
plt.xticks(angles[:-1], x, fontsize=${chartConfig.fontSize})\n\n# Plot data
ax.plot(angles, y_closed, color="${colors[0]}", linewidth=2, linestyle='solid')\n\n# Fill area
ax.fill(angles, y_closed, color="${colors[0]}", alpha=0.25)\n\n`;
        break;
      default:
        code += `# Basic plot\nplt.plot(x, y)\n\n`;
    }
    
    // Add legend if enabled
    if (chartConfig.showLegend) {
      code += `# Add legend\nplt.legend(["${chartConfig.title}"], loc="best")\n\n`;
    }
    
    // Final commands
    code += `# Adjust layout and display\nplt.tight_layout()\nplt.show()\n`;
    
    setPythonCode(code);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setChartConfig({
      ...chartConfig,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle chart category change
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setChartConfig({
      ...chartConfig,
      chartCategory: category,
      chartType: chartTypes[category][0],
    });
  };

  // Copy Python code to clipboard
  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(pythonCode)
      .then(() => {
        alert('Code copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  // Render chart preview based on type
  const renderChartPreview = () => {
    const colors = chartConfig.colors.split(',').map(c => c.trim());
    
    // For advanced charts that can't be directly previewed
    if (['3dSurface', 'heatmap', 'densityPlot', 'boxPlot', 'histogram'].includes(chartConfig.chartType)) {
      return (
        <div className="preview-placeholder">
          <div className="preview-message">
            <h3>Preview not available for {chartTypeNames[chartConfig.chartType]}</h3>
            <p>Please refer to the generated Python code to create this chart type.</p>
          </div>
        </div>
      );
    }
    
    // Render appropriate chart based on type
    switch (chartConfig.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" label={{ value: chartConfig.xAxisLabel, position: 'bottom', offset: 5 }} />
              <YAxis label={{ value: chartConfig.yAxisLabel, angle: -90, position: 'left' }} />
              <Tooltip />
              {chartConfig.showLegend && <Legend />}
              <Bar dataKey="value" name={chartConfig.title}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'horizontalBar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart layout="vertical" data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 30 }}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis type="number" label={{ value: chartConfig.yAxisLabel, position: 'bottom', offset: 5 }} />
              <YAxis dataKey="name" type="category" label={{ value: chartConfig.xAxisLabel, angle: -90, position: 'left' }} />
              <Tooltip />
              {chartConfig.showLegend && <Legend />}
              <Bar dataKey="value" name={chartConfig.title}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" label={{ value: chartConfig.xAxisLabel, position: 'bottom', offset: 5 }} />
              <YAxis label={{ value: chartConfig.yAxisLabel, angle: -90, position: 'left' }} />
              <Tooltip />
              {chartConfig.showLegend && <Legend />}
              <Line type="monotone" dataKey="value" name={chartConfig.title} stroke={colors[0]} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              {chartConfig.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" name={chartConfig.xAxisLabel} label={{ value: chartConfig.xAxisLabel, position: 'bottom', offset: 5 }} />
              <YAxis dataKey="y" name={chartConfig.yAxisLabel} label={{ value: chartConfig.yAxisLabel, angle: -90, position: 'left' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              {chartConfig.showLegend && <Legend />}
              <Scatter name={chartConfig.title} data={chartData} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="name" label={{ value: chartConfig.xAxisLabel, position: 'bottom', offset: 5 }} />
              <YAxis label={{ value: chartConfig.yAxisLabel, angle: -90, position: 'left' }} />
              <Tooltip />
              {chartConfig.showLegend && <Legend />}
              <Area type="monotone" dataKey="value" name={chartConfig.title} stroke={colors[0]} fill={colors[0]} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'radarChart':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius={150} data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar name={chartConfig.title} dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
              {chartConfig.showLegend && <Legend />}
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'polarPlot':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius={150} data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar name={chartConfig.title} dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
              {chartConfig.showLegend && <Legend />}
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div className="preview-placeholder">
            <div className="preview-message">
              <h3>Select a chart type to preview</h3>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="chart-generator">
      <header className="app-header">
        <h1>Chart Generator App</h1>
        <p>Create custom charts and get Python code</p>
      </header>
      
      <main className="app-content">
        <div className="config-panel">
          <div className="panel-content">
            <h2>Chart Configuration</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="csv-section">
              <h3>Data Source</h3>
              
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
              
              {csvColumns.length > 0 && (
                <div className="csv-columns">
                  <div className="form-group">
                    <label htmlFor="xColumn">X-Axis Column:</label>
                    <select 
                      id="xColumn" 
                      value={selectedXColumn} 
                      onChange={(e) => setSelectedXColumn(e.target.value)}
                      className="form-control"
                    >
                      {csvColumns.map(column => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="yColumn">Y-Axis Column:</label>
                    <select 
                      id="yColumn" 
                      value={selectedYColumn} 
                      onChange={(e) => setSelectedYColumn(e.target.value)}
                      className="form-control"
                    >
                      {csvColumns.map(column => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="chartCategory">Chart Category:</label>
              <select 
                id="chartCategory" 
                name="chartCategory" 
                value={chartConfig.chartCategory} 
                onChange={handleCategoryChange}
                className="form-control"
              >
                <option value="basic">Basic Charts</option>
                <option value="statistical">Statistical Charts</option>
                <option value="advanced">Advanced Charts</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="chartType">Chart Type:</label>
              <select 
                id="chartType" 
                name="chartType" 
                value={chartConfig.chartType} 
                onChange={handleInputChange}
                className="form-control"
              >
                {chartTypes[chartConfig.chartCategory].map(type => (
                  <option key={type} value={type}>{chartTypeNames[type]}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="title">Chart Title:</label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                value={chartConfig.title} 
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="xAxisLabel">X-Axis Label:</label>
                <input 
                  type="text" 
                  id="xAxisLabel" 
                  name="xAxisLabel" 
                  value={chartConfig.xAxisLabel} 
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="yAxisLabel">Y-Axis Label:</label>
                <input 
                  type="text" 
                  id="yAxisLabel" 
                  name="yAxisLabel" 
                  value={chartConfig.yAxisLabel} 
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>
            </div>
            
            {!usingCSV && (
              <>
                <div className="form-group">
                  <label htmlFor="xAxisData">X-Axis Data (comma separated):</label>
                  <textarea 
                    id="xAxisData" 
                    name="xAxisData" 
                    value={chartConfig.xAxisData} 
                    onChange={handleInputChange}
                    className="form-control"
                    rows="2"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="yAxisData">Y-Axis Data (comma separated):</label>
                  <textarea 
                    id="yAxisData" 
                    name="yAxisData" 
                    value={chartConfig.yAxisData} 
                    onChange={handleInputChange}
                    className="form-control"
                    rows="2"
                  />
                </div>
              </>
            )}
            
            <div className="form-group">
              <label htmlFor="colors">Colors (comma separated):</label>
              <input 
                type="text" 
                id="colors" 
                name="colors" 
                value={chartConfig.colors} 
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            
            <div className="form-row checkbox-row">
              <div className="form-group checkbox-group">
                <input 
                  type="checkbox" 
                  id="showGrid" 
                  name="showGrid" 
                  checked={chartConfig.showGrid} 
                  onChange={handleInputChange}
                />
                <label htmlFor="showGrid">Show Grid</label>
              </div>
              
              <div className="form-group checkbox-group">
                <input 
                  type="checkbox" 
                  id="showLegend" 
                  name="showLegend" 
                  checked={chartConfig.showLegend} 
                  onChange={handleInputChange}
                />
                <label htmlFor="showLegend">Show Legend</label>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="fontSize">Font Size:</label>
              <select 
                id="fontSize" 
                name="fontSize" 
                value={chartConfig.fontSize} 
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="10">Small (10px)</option>
                <option value="12">Medium (12px)</option>
                <option value="14">Large (14px)</option>
                <option value="16">Extra Large (16px)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="preview-panel">
          <div className="panel-content">
            <h2>Chart Preview</h2>
            <div className="chart-preview">
              <h3 className="chart-title">{chartConfig.title}</h3>
              {renderChartPreview()}
            </div>
            
            <div className="code-section">
              <div className="code-header">
                <h3>Python Code (matplotlib)</h3>
                <button onClick={copyCodeToClipboard} className="copy-button">
                  Copy Code
                </button>
              </div>
              <pre className="code-block">
                <code>{pythonCode}</code>
              </pre>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Chart Generator App - Created with React and Recharts</p>
      </footer>
    </div>
  );
};

export default ChartGenerator;
