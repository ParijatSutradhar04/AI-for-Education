#!/usr/bin/env python3
"""
Simple HTTP Server to serve the frontend files
Run this to serve the HTML files on port 5598
"""

import http.server
import socketserver
import os
import sys

# Change to the directory containing the HTML files
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 5599

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def start_server():
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"\n{'='*60}")
        print(f"🌐 FRONTEND SERVER STARTING")
        print(f"{'='*60}")
        print(f"Server running on port {PORT}")
        print(f"📱 Main app: http://localhost:{PORT}/")
        print(f"🧪 Simple test: http://localhost:{PORT}/test_simple.html")
        print(f"🔗 Backend: http://localhost:5000/")
        print(f"{'='*60}\n")
        print("Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped by user")
            sys.exit(0)

if __name__ == "__main__":
    start_server()
