from http.server import BaseHTTPRequestHandler
import json
import pandas as pd
import io
import numpy as np
import base64

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Get content length
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            # Find the file content in the multipart data
            file_data_start = post_data.find(b'\r\n\r\n') + 4
            file_data_end = post_data.rfind(b'--')
            file_data = post_data[file_data_start:file_data_end].strip()
            
            # Create a pandas DataFrame from the CSV data
            df = pd.read_csv(io.BytesIO(file_data))
            
            # Generate basic statistics
            analysis = {
                'columns': list(df.columns),
                'row_count': len(df),
                'column_count': len(df.columns),
                'missing_values': df.isnull().sum().to_dict(),
                'data_types': {col: str(df[col].dtype) for col in df.columns},
                'summary': {}
            }
            
            # Calculate statistics for numeric columns
            for column in df.select_dtypes(include=[np.number]).columns:
                analysis['summary'][column] = {
                    'min': float(df[column].min()),
                    'max': float(df[column].max()),
                    'mean': float(df[column].mean()),
                    'median': float(df[column].median()),
                    'std': float(df[column].std())
                }
            
            # Calculate most common values for text columns
            for column in df.select_dtypes(include=['object']).columns:
                value_counts = df[column].value_counts().head(5).to_dict()
                analysis['summary'][column] = {
                    'unique_values': int(df[column].nunique()),
                    'most_common': {str(k): int(v) for k, v in value_counts.items()}
                }
            
            # Create a basic HTML report
            html_report = f"""
            <html>
            <head>
                <title>Data Analysis Report</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; }}
                    h1, h2, h3 {{ color: #2563eb; }}
                    table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f2f7ff; }}
                    tr:nth-child(even) {{ background-color: #f9f9f9; }}
                    .missing {{ color: #e53e3e; }}
                    .summary {{ margin-bottom: 30px; }}
                </style>
            </head>
            <body>
                <h1>Data Analysis Report</h1>
                <div class="summary">
                    <h2>Dataset Overview</h2>
                    <p>This dataset contains {len(df)} rows and {len(df.columns)} columns.</p>
                    
                    <h3>Columns:</h3>
                    <ul>
                        {' '.join(f'<li>{col} ({df[col].dtype})</li>' for col in df.columns)}
                    </ul>
                </div>
                
                <h2>Missing Values</h2>
                <table>
                    <tr>
                        <th>Column</th>
                        <th>Missing Count</th>
                        <th>Missing Percentage</th>
                    </tr>
                    {' '.join(f'<tr><td>{col}</td><td class="missing">{missing}</td><td>{missing/len(df)*100:.2f}%</td></tr>' for col, missing in df.isnull().sum().items())}
                </table>
                
                <h2>Numerical Columns Summary</h2>
                {''.join(f'''
                <h3>{col}</h3>
                <table>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
                    <tr><td>Min</td><td>{df[col].min()}</td></tr>
                    <tr><td>Max</td><td>{df[col].max()}</td></tr>
                    <tr><td>Mean</td><td>{df[col].mean():.2f}</td></tr>
                    <tr><td>Median</td><td>{df[col].median()}</td></tr>
                    <tr><td>Std Dev</td><td>{df[col].std():.2f}</td></tr>
                </table>
                ''' for col in df.select_dtypes(include=[np.number]).columns)}
                
                <h2>Categorical Columns Summary</h2>
                {''.join(f'''
                <h3>{col}</h3>
                <p>Total unique values: {df[col].nunique()}</p>
                <table>
                    <tr>
                        <th>Value</th>
                        <th>Count</th>
                        <th>Percentage</th>
                    </tr>
                    {''.join(f'<tr><td>{val}</td><td>{count}</td><td>{count/len(df)*100:.2f}%</td></tr>' 
                        for val, count in df[col].value_counts().head(5).items())}
                </table>
                ''' for col in df.select_dtypes(include=['object']).columns)}
            </body>
            </html>
            """
            
            # Return the response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'html_content': html_report
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                'error': str(e)
            }
            
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
