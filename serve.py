import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

print(f"Starting PocketPe server at http://localhost:{PORT} ...")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"PocketPe prototype is live! Press Ctrl+C to stop.")
    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception:
        pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
        httpd.shutdown()
