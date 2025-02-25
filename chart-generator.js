// Get components from global objects instead of using imports
const { useState, useEffect } = React;
const {
  LineChart, BarChart, PieChart, ScatterChart, 
  Line, Bar, Pie, Cell, Scatter, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} = Recharts;

// Define the ChartGenerator component
const ChartGenerator = () => {
  const [chartConfig, setChartConfig] = useState({
    type: 'bar',
    title: 'Sales Data',
    xLabel: 'Months',
    yLabel: 'Revenue',
    xData: 'January, February, March, April',
    yData: '100, 150, 200, 120',
    colors: 'red, blue, green, orange',
    showGrid: true,
    showLegend: true,
    fontSize: 12,
    is3D: false
  });
  
  const [generatedCode, setGeneratedCode] = useState('');
  
  // Chart type options grouped by category
  const chartTypesByCategory = {
    'Basic': [
      { value: 'bar', label: 'Bar Chart' },
      { value: 'barh', label: 'Horizontal Bar Chart' },
      { value: 'line', label: 'Line Chart' },
      { value: 'pie', label: 'Pie Chart' },
      { value: 'scatter', label: 'Scatter Plot' },
      { value: 'area', label: 'Area Chart' }
    ],
    'Statistical': [
      { value: 'histogram', label: 'Histogram' },
      { value: 'boxplot', label: 'Box Plot' },
      { value: 'density', label: 'Density Plot (KDE)' }
    ],
    'Advanced': [
      { value: '3dsurface', label: '3D Surface Plot' },
      { value: 'heatmap', label: 'Heatmap' },
      { value: 'polar', label: 'Polar Plot' },
      { value: 'radar', label: 'Radar/Spider Chart' }
    ]
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setChartConfig({
      ...chartConfig,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Generate Python code based on chart configuration
  const generateCode = () => {
    // Parse data strings into arrays
    const xDataArray = chartConfig.xData.split(',').map(item => item.trim());
    const yDataArray = chartConfig.yData.split(',').map(item => parseFloat(item.trim()));
    const colorsArray = chartConfig.colors.split(',').map(item => item.trim());
    
    // Base imports
    let code = 'import matplotlib.pyplot as plt\nimport numpy as np\n';
    
    // Add specialized imports based on chart type
    if (['density'].includes(chartConfig.type)) {
      code += 'import seaborn as sns\n';
    }
    
    if (['3dsurface'].includes(chartConfig.type)) {
      code += 'from mpl_toolkits.mplot3d import Axes3D\n';
    }
    
    code += '\n# Data\n';
    code += `x = ${JSON.stringify(xDataArray)}\n`;
    code += `y = ${JSON.stringify(yDataArray)}\n`;
    
    if (colorsArray.length > 0) {
      code += `colors = ${JSON.stringify(colorsArray)}\n`;
    }
    
    code += '\n';
    
    // Figure setup - adjust for 3D plots
    code += `# Create figure and axes\n`;
    if (['3dsurface'].includes(chartConfig.type)) {
      code += `fig = plt.figure(figsize=(10, 6))\n`;
      code += `ax = fig.add_subplot(111, projection='3d')\n\n`;
    } else if (chartConfig.type === 'polar' || chartConfig.type === 'radar') {
      code += `fig = plt.figure(figsize=(10, 6))\n`;
      code += `ax = fig.add_subplot(111, projection='polar')\n\n`;
    } else {
      code += `fig, ax = plt.subplots(figsize=(10, 6))\n\n`;
    }
    
    // Chart specific code
    code += `# Create ${chartConfig.type} chart\n`;
    
    switch (chartConfig.type) {
      case 'bar':
        code += `ax.bar(x, y, color=colors if 'colors' in locals() else None)\n`;
        break;
      case 'barh':
        code += `ax.barh(x, y, color=colors if 'colors' in locals() else None)\n`;
        break;
      case 'line':
        code += `ax.plot(x, y, marker='o', color=colors[0] if 'colors' in locals() and len(colors) > 0 else None)\n`;
        break;
      case 'pie':
        code += `ax.pie(y, labels=x, autopct='%1.1f%%', colors=colors if 'colors' in locals() else None)\n`;
        code += `ax.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle\n`;
        break;
      case 'scatter':
        code += `ax.scatter(x, y, color=colors[0] if 'colors' in locals() and len(colors) > 0 else None)\n`;
        break;
      case 'area':
        code += `ax.fill_between(range(len(x)), y, alpha=0.5, color=colors[0] if 'colors' in locals() and len(colors) > 0 else 'skyblue')\n`;
        code += `ax.plot(range(len(x)), y, color=colors[0] if 'colors' in locals() and len(colors) > 0 else 'navy')\n`;
        code += `ax.set_xticks(range(len(x)))\n`;
        code += `ax.set_xticklabels(x)\n`;
        break;
      case 'histogram':
        code += `ax.hist(y, bins=10, alpha=0.7, color=colors[0] if 'colors' in locals() and len(colors) > 0 else None)\n`;
        break;
      case 'boxplot':
        code += `ax.boxplot(y)\n`;
        code += `ax.set_xticklabels(['Data'])\n`;
        break;
      case 'density':
        code += `# Density plot using Seaborn's KDE\n`;
        code += `sns.kdeplot(y, ax=ax, shade=True, color=colors[0] if 'colors' in locals() and len(colors) > 0 else None)\n`;
        break;
      case 'heatmap':
        code += `# For heatmaps, we need 2D data\n`;
        code += `# Create a simple matrix for this example\n`;
        code += `data_matrix = np.array([y] * len(y))\n`;
        code += `for i in range(len(y)):\n`;
        code += `    data_matrix[i] = np.roll(y, i)\n\n`;
        code += `heatmap = ax.imshow(data_matrix, cmap='viridis', aspect='auto')\n`;
        code += `plt.colorbar(heatmap, ax=ax)\n`;
        code += `ax.set_xticks(range(len(x)))\n`;
        code += `ax.set_xticklabels(x)\n`;
        code += `ax.set_yticks(range(len(x)))\n`;
        code += `ax.set_yticklabels(x)\n`;
        break;
      case '3dsurface':
        code += `# For 3D surface plots, we need 2D data\n`;
        code += `# Generate a 2D grid for this example\n`;
        code += `x_grid = np.linspace(-3, 3, 100)\n`;
        code += `y_grid = np.linspace(-3, 3, 100)\n`;
        code += `X, Y = np.meshgrid(x_grid, y_grid)\n`;
        code += `Z = np.sin(X) * np.cos(Y)\n\n`;
        code += `surf = ax.plot_surface(X, Y, Z, cmap='viridis', edgecolor='none')\n`;
        code += `fig.colorbar(surf, ax=ax, shrink=0.5, aspect=5)\n`;
        break;
      case 'polar':
        code += `# Convert to polar coordinates\n`;
        code += `theta = np.linspace(0, 2*np.pi, len(y), endpoint=False)\n`;
        code += `ax.plot(theta, y, color=colors[0] if 'colors' in locals() and len(colors) > 0 else None)\n`;
        code += `ax.set_xticks(theta)\n`;
        code += `ax.set_xticklabels(x)\n`;
        break;
      case 'radar':
        code += `# Create a radar/spider chart\n`;
        code += `theta = np.linspace(0, 2*np.pi, len(y), endpoint=False)\n`;
        code += `# Close the plot by appending the first value\n`;
        code += `values = np.append(y, y[0])\n`;
        code += `theta = np.append(theta, theta[0])\n`;
        code += `ax.plot(theta, values, color=colors[0] if 'colors' in locals() and len(colors) > 0 else None)\n`;
        code += `ax.fill(theta, values, alpha=0.25, color=colors[0] if 'colors' in locals() and len(colors) > 0 else None)\n`;
        code += `ax.set_xticks(theta[:-1])\n`;
        code += `ax.set_xticklabels(x)\n`;
        break;
      default:
        code += `ax.bar(x, y, color=colors if 'colors' in locals() else None)\n`;
    }
    
    // Style configurations
    code += `\n# Customize chart\n`;
    code += `ax.set_title("${chartConfig.title}", fontsize=${chartConfig.fontSize + 4})\n`;
    
    // Add labels for non-special charts
    if (!['pie', '3dsurface', 'polar', 'radar'].includes(chartConfig.type)) {
      code += `ax.set_xlabel("${chartConfig.xLabel}", fontsize=${chartConfig.fontSize})\n`;
      code += `ax.set_ylabel("${chartConfig.yLabel}", fontsize=${chartConfig.fontSize})\n`;
    }
    
    // Add grid for charts that support it
    if (chartConfig.showGrid && 
        !['pie', '3dsurface', 'polar', 'radar', 'heatmap'].includes(chartConfig.type)) {
      code += `ax.grid(True, linestyle='--', alpha=0.7)\n`;
    }
    
    // Add legend for charts that support it
    if (chartConfig.showLegend && 
        !['heatmap', '3dsurface'].includes(chartConfig.type)) {
      code += `ax.legend()\n`;
    }
    
    // Add additional customizations for 3D charts
    if (chartConfig.type.includes('3d')) {
      code += `\n# Rotate the axes for better view\n`;
      code += `ax.view_init(30, 45)\n`;
    }
    
    // Add tight layout and display the plot
    code += `\n# Show plot\nplt.tight_layout()\nplt.show()\n`;
    
    return code;
  };

  // Prepare data for chart preview
  const prepareChartData = () => {
    try {
      const xValues = chartConfig.xData.split(',').map(item => item.trim());
      const yValues = chartConfig.yData.split(',').map(item => parseFloat(item.trim()));
      
      return xValues.map((label, index) => ({
        name: label,
        value: yValues[index] || 0,
        size: (yValues[index] || 0) * 5 // For bubble charts
      }));
    } catch (error) {
      return [];
    }
  };
  
  // Update generated code when chart configuration changes
  useEffect(() => {
    setGeneratedCode(generateCode());
  }, [chartConfig]);
  
  // Render chart preview based on configuration
  const renderChartPreview = () => {
    const data = prepareChartData();
    const colors = chartConfig.colors.split(',').map(c => c.trim());
    
    if (!data.length) {
      return (
        React.createElement("div", { className: "bg-gray-100 p-4 rounded-md h-64 flex items-center justify-center" },
          React.createElement("p", { className: "text-gray-500" }, "No data to display")
        )
      );
    }
    
    // Handle special cases where we can't easily preview
    const specialCharts = ['3dsurface', 'heatmap', 'density'];
    
    if (specialCharts.includes(chartConfig.type)) {
      return (
        React.createElement("div", { className: "bg-gray-100 p-4 rounded-md h-64 flex items-center justify-center flex-col" },
          React.createElement("p", { className: "text-gray-500 mb-2" }, "Preview not available for ", chartConfig.type),
          React.createElement("p", { className: "text-xs text-gray-400" }, "Generate Python code to see the result")
        )
      );
    }
    
    switch (chartConfig.type) {
      case 'bar':
        return (
          React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
            React.createElement(BarChart, { data: data },
              chartConfig.showGrid && React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
              React.createElement(XAxis, { dataKey: "name" }),
              React.createElement(YAxis, null),
              React.createElement(Tooltip, null),
              chartConfig.showLegend && React.createElement(Legend, null),
              React.createElement(Bar, { dataKey: "value", fill: colors[0] || "#8884d8" },
                data.map((entry, index) => (
                  React.createElement(Cell, { 
                    key: `cell-${index}`, 
                    fill: colors[index % colors.length] || `hsl(${index * 45}, 70%, 60%)` 
                  })
                ))
              )
            )
          )
        );
        
      case 'barh':
        return (
          React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
            React.createElement(BarChart, { data: data, layout: "vertical" },
              chartConfig.showGrid && React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
              React.createElement(XAxis, { type: "number" }),
              React.createElement(YAxis, { type: "category", dataKey: "name" }),
              React.createElement(Tooltip, null),
              chartConfig.showLegend && React.createElement(Legend, null),
              React.createElement(Bar, { dataKey: "value", fill: colors[0] || "#8884d8" },
                data.map((entry, index) => (
                  React.createElement(Cell, { 
                    key: `cell-${index}`, 
                    fill: colors[index % colors.length] || `hsl(${index * 45}, 70%, 60%)` 
                  })
                ))
              )
            )
          )
        );
        
      case 'line':
        return (
          React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
            React.createElement(LineChart, { data: data },
              chartConfig.showGrid && React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
              React.createElement(XAxis, { dataKey: "name" }),
              React.createElement(YAxis, null),
              React.createElement(Tooltip, null),
              chartConfig.showLegend && React.createElement(Legend, null),
              React.createElement(Line, { 
                type: "monotone", 
                dataKey: "value", 
                stroke: colors[0] || "#8884d8",
                dot: { stroke: colors[0] || "#8884d8", strokeWidth: 2, r: 4 }
              })
            )
          )
        );
        
      case 'pie':
        return (
          React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
            React.createElement(PieChart, null,
              React.createElement(Pie, {
                data: data,
                cx: "50%",
                cy: "50%",
                labelLine: true,
                label: ({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`,
                outerRadius: 80,
                fill: "#8884d8",
                dataKey: "value"
              },
                data.map((entry, index) => (
                  React.createElement(Cell, { 
                    key: `cell-${index}`, 
                    fill: colors[index % colors.length] || `hsl(${index * 45}, 70%, 60%)` 
                  })
                ))
              ),
              chartConfig.showLegend && React.createElement(Legend, null),
              React.createElement(Tooltip, null)
            )
          )
        );
        
      case 'scatter':
        return (
          React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
            React.createElement(ScatterChart, null,
              chartConfig.showGrid && React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
              React.createElement(XAxis, { dataKey: "name", type: "category" }),
              React.createElement(YAxis, { dataKey: "value" }),
              React.createElement(Tooltip, { cursor: {strokeDasharray: '3 3'} }),
              chartConfig.showLegend && React.createElement(Legend, null),
              React.createElement(Scatter, { 
                name: chartConfig.yLabel, 
                data: data, 
                fill: colors[0] || "#8884d8" 
              })
            )
          )
        );
        
      case 'area':
        return (
          React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
            React.createElement(AreaChart, { data: data },
              chartConfig.showGrid && React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
              React.createElement(XAxis, { dataKey: "name" }),
              React.createElement(YAxis, null),
              React.createElement(Tooltip, null),
              chartConfig.showLegend && React.createElement(Legend, null),
              React.createElement(Area, { 
                type: "monotone", 
                dataKey: "value", 
                stroke: colors[0] || "#8884d8", 
                fill: colors[0] || "#8884d8", 
                fillOpacity: 0.3 
              })
            )
          )
        );
        
      default:
        return (
          React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
            React.createElement(BarChart, { data: data },
              chartConfig.showGrid && React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
              React.createElement(XAxis, { dataKey: "name" }),
              React.createElement(YAxis, null),
              React.createElement(Tooltip, null),
              chartConfig.showLegend && React.createElement(Legend, null),
              React.createElement(Bar, { dataKey: "value", fill: colors[0] || "#8884d8" })
            )
          )
        );
    }
  };
  
  // Render the component using React.createElement instead of JSX
  return React.createElement(
    "div", 
    { 
      className: "max-w-6xl mx-auto p-4 bg-gray-50", 
      style: { fontFamily: "'JetBrains Mono', monospace" }
    },
    React.createElement("h1", { className: "text-2xl font-bold mb-6 text-center text-gray-800" }, "Chart Generator"),
    
    React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
      // Left side: Configuration Panel
      React.createElement("div", { className: "bg-white p-4 rounded-lg shadow-sm border border-gray-200" },
        React.createElement("h2", { className: "text-lg font-medium mb-4 text-gray-800" }, "Chart Configuration"),
        
        React.createElement("div", { className: "space-y-4" },
          // Chart Type
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium mb-1 text-gray-700" }, "Chart Type"),
            React.createElement("select", { 
              name: "type", 
              value: chartConfig.type, 
              onChange: handleChange,
              className: "w-full p-2 border border-gray-300 rounded-md bg-white",
              style: { fontFamily: "'JetBrains Mono', monospace" }
            },
              Object.keys(chartTypesByCategory).map(category => 
                React.createElement("optgroup", { key: category, label: category },
                  chartTypesByCategory[category].map(type => 
                    React.createElement("option", { key: type.value, value: type.value }, type.label)
                  )
                )
              )
            )
          ),
          
          // Title
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium mb-1 text-gray-700" }, "Chart Title"),
            React.createElement("input", { 
              type: "text", 
              name: "title", 
              value: chartConfig.title, 
              onChange: handleChange,
              className: "w-full p-2 border border-gray-300 rounded-md",
              style: { fontFamily: "'JetBrains Mono', monospace" }
            })
          ),
          
          // Labels
          React.createElement("div", { className: "grid grid-cols-2 gap-4" },
            React.createElement("div", null,
              React.createElement("label", { className: "block text-sm font-medium mb-1 text-gray-700" }, "X-Axis Label"),
              React.createElement("input", { 
                type: "text", 
                name: "xLabel", 
                value: chartConfig.xLabel, 
                onChange: handleChange,
                className: "w-full p-2 border border-gray-300 rounded-md",
                style: { fontFamily: "'JetBrains Mono', monospace" }
              })
            ),
            React.createElement("div", null,
              React.createElement("label", { className: "block text-sm font-medium mb-1 text-gray-700" }, "Y-Axis Label"),
              React.createElement("input", { 
                type: "text", 
                name: "yLabel", 
                value: chartConfig.yLabel, 
                onChange: handleChange,
                className: "w-full p-2 border border-gray-300 rounded-md",
                style: { fontFamily: "'JetBrains Mono', monospace" }
              })
            )
          ),
          
          // X-Axis Data
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium mb-1 text-gray-700" }, "X-Axis Data (comma separated)"),
            React.createElement("input", { 
              type: "text", 
              name: "xData", 
              value: chartConfig.xData, 
              onChange: handleChange,
              className: "w-full p-2 border border-gray-300 rounded-md",
              style: { fontFamily: "'JetBrains Mono', monospace" }
            })
          ),
          
          // Y-Axis Data
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium mb-1 text-gray-700" }, "Y-Axis Data (comma separated)"),
            React.createElement("input", { 
              type: "text", 
              name: "yData", 
              value: chartConfig.yData, 
              onChange: handleChange,
              className: "w-full p-2 border border-gray-300 rounded-md",
              style: { fontFamily: "'JetBrains Mono', monospace" }
            })
          ),
          
          // Colors
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium mb-1 text-gray-700" }, "Colors (comma separated)"),
            React.createElement("input", { 
              type: "text", 
              name: "colors", 
              value: chartConfig.colors, 
              onChange: handleChange,
              className: "w-full p-2 border border-gray-300 rounded-md",
              style: { fontFamily: "'JetBrains Mono', monospace" }
            })
          ),
          
          // Additional Options
          React.createElement("div", { className: "flex flex-wrap gap-4 pt-2 border-t border-gray-200" },
            React.createElement("div", { className: "flex items-center" },
              React.createElement("input", { 
                type: "checkbox", 
                id: "showGrid", 
                name: "showGrid", 
                checked: chartConfig.showGrid, 
                onChange: handleChange,
                className: "mr-2"
              }),
              React.createElement("label", { htmlFor: "showGrid", className: "text-sm text-gray-700" }, "Show Grid")
            ),
            
            React.createElement("div", { className: "flex items-center" },
              React.createElement("input", { 
                type: "checkbox", 
                id: "showLegend", 
                name: "showLegend", 
                checked: chartConfig.showLegend, 
                onChange: handleChange,
                className: "mr-2"
              }),
              React.createElement("label", { htmlFor: "showLegend", className: "text-sm text-gray-700" }, "Show Legend")
            ),
            
            React.createElement("div", { className: "flex items-center" },
              React.createElement("label", { htmlFor: "fontSize", className: "mr-2 text-sm text-gray-700" }, "Font Size:"),
              React.createElement("input", { 
                type: "number", 
                id: "fontSize", 
                name: "fontSize", 
                value: chartConfig.fontSize, 
                onChange: handleChange,
                min: "8",
                max: "24",
                className: "w-16 p-1 border border-gray-300 rounded-md",
                style: { fontFamily: "'JetBrains Mono', monospace" }
              })
            )
          )
        )
      ),
      
      // Right side: Preview and Code
      React.createElement("div", { className: "space-y-6" },
        // Chart Preview
        React.createElement("div", { className: "bg-white p-4 rounded-lg shadow-sm border border-gray-200" },
          React.createElement("h2", { className: "text-lg font-medium mb-3 text-gray-800" }, "Preview"),
          React.createElement("div", { className: "border border-gray-200 rounded-md overflow-hidden bg-gray-50 p-2" },
            renderChartPreview()
          )
        ),
        
        // Generated Code
        React.createElement("div", { className: "bg-white p-4 rounded-lg shadow-sm border border-gray-200" },
          React.createElement("div", { className: "flex justify-between items-center mb-3" },
            React.createElement("h2", { className: "text-lg font-medium text-gray-800" }, "Python Code"),
            React.createElement("button", { 
              className: "bg-gray-100 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-200 border border-gray-300 text-sm",
              onClick: () => {
                navigator.clipboard.writeText(generatedCode);
                alert('Code copied to clipboard!');
              }
            }, "Copy")
          ),
          React.createElement("div", { className: "bg-gray-900 p-3 rounded-md overflow-x-auto border border-gray-700 h-64" },
            React.createElement("pre", { 
              className: "text-green-400 text-sm overflow-auto h-full", 
              style: { fontFamily: "'JetBrains Mono', monospace" }
            }, generatedCode)
          )
        )
      )
    )
  );
};
