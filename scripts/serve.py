import sys, os
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(root), str(root / "backend")]
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ascension.settings")

# Run migrations and seed data on startup if not yet applied
try:
    import django
    django.setup()
    from django.core.management import call_command
    call_command("setup_deployment")
except Exception as e:
    print(f"[Ascension] Notice during setup_deployment check: {e}")

from ascension.wsgi import application

port = int(os.environ.get("PORT", 9008))

try:
    from waitress import serve
    print(f"[Ascension] Serving via waitress on 0.0.0.0:{port}...")
    serve(application, host="0.0.0.0", port=port, threads=4)
except ImportError:
    from wsgiref.simple_server import make_server
    print(f"[Ascension] Waitress not found, serving via standard WSGI server on 0.0.0.0:{port}...")
    httpd = make_server("0.0.0.0", port, application)
    httpd.serve_forever()

