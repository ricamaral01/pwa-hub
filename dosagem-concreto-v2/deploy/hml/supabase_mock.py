"""Minimal Supabase user endpoint for isolated Release 1 browser tests."""
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
            return
        if (self.path == "/auth/v1/user"
                and self.headers.get("Authorization") == "Bearer hml-hub-token"
                and self.headers.get("apikey") == "local-hml-only"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"email":"r1-hub@example.test"}')
            return
        self.send_response(401)
        self.end_headers()


HTTPServer(("0.0.0.0", 18310), Handler).serve_forever()
