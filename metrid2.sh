#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8202}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo " METRIDIUM v2"
echo " http://localhost:${PORT}"
echo " Serving ${DIR}"
echo " Clean URL rewriting enabled (/labs -> /labs.html)"
echo " Press Ctrl+C to stop"
echo ""

export METRID2_PORT="${PORT}"
export METRID2_DIR="${DIR}"

python3 - <<'PYEOF'
import http.server, os, sys, os

PORT = int(os.environ['METRID2_PORT'])
DIR = os.environ['METRID2_DIR']

class RewritingHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def do_GET(self):
        path = self.path.split('?')[0].split('#')[0]
        if path == '/':
            self.path = '/index.html'
        elif '.' not in path.rsplit('/', 1)[-1]:
            candidate = path + '.html'
            target = os.path.join(DIR, candidate.lstrip('/'))
            if os.path.isfile(target):
                self.path = candidate
        super().do_GET()

with http.server.HTTPServer(('', PORT), RewritingHandler) as httpd:
    httpd.serve_forever()
PYEOF