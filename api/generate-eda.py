from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs
import json
import pandas as pd
import io
import base64
from ydata_profiling import ProfileReport

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Get content length
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        # Parse multipart form data
        try:
            # This is a simplified approach - in production use a proper multipart parser
            # Find the file content in the multipart data
            file_data_start = post_data.find(b'\r\n\r\n') + 4
            file_data_end = post_data.rfind(b'--')
            file_data = post_data[file_data_start:file_data_end].strip()
            
            # Create a pandas DataFrame from the CSV data
            df = pd.read_csv(io.BytesIO(file_data))
            
            # Create a minimal profile report (for speed and to fit in serverless constraints)
            profile = ProfileReport(df, minimal=True, title="Data Analysis Report")
            
            # Get the HTML as a string
            html_str = profile.to_html()
            
            # Return the HTML
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'html_content': html_str
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
