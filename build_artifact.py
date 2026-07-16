import re, base64, os

BASE = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(os.path.join(BASE, path), 'r', encoding='utf-8') as f:
        return f.read()

def read_bin(path):
    with open(os.path.join(BASE, path), 'rb') as f:
        return f.read()

def b64(path, mime):
    data = base64.b64encode(read_bin(path)).decode('ascii')
    return f"data:{mime};base64,{data}"

html = read('index.html')
css = read('styles.css')
js = read('script.js')

# --- Fonts as data URIs ---
bebas_uri = b64('bebas.woff2', 'font/woff2')
sourcesans_uri = b64('sourcesans3.woff2', 'font/woff2')

font_face_css = f"""
@font-face {{
  font-family: 'Bebas Neue';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url({bebas_uri}) format('woff2');
}}
@font-face {{
  font-family: 'Source Sans 3';
  font-style: normal;
  font-weight: 400 900;
  font-display: swap;
  src: url({sourcesans_uri}) format('woff2');
}}
"""

# --- Images as data URIs ---
asset_files = [f for f in os.listdir(os.path.join(BASE, 'assets')) if f.endswith('.jpg')]
for fname in asset_files:
    uri = b64(os.path.join('assets', fname), 'image/jpeg')
    css = css.replace(f'assets/{fname}', uri)
    html = html.replace(f'assets/{fname}', uri)

# --- Extract <title> ---
title_match = re.search(r'<title>(.*?)</title>', html, re.S)
title = title_match.group(1) if title_match else 'Urban Cutz Barbershop'

# --- Extract JSON-LD structured data script ---
ldjson_match = re.search(r'<script type="application/ld\+json">.*?</script>', html, re.S)
ldjson = ldjson_match.group(0) if ldjson_match else ''

# --- Extract body content (everything between <body> and </body>) ---
body_match = re.search(r'<body>(.*)</body>', html, re.S)
body = body_match.group(1) if body_match else ''

# Remove the external stylesheet link and script src reference (already inlined below)
body = body.replace('<script src="script.js"></script>', '')

final = f"""<title>{title}</title>
<meta name="description" content="Urban Cutz Barbershop: skin fades, hair fixing, braids &amp; beard trims in Mirdif (Dubai), Muwaileh (Sharjah) &amp; Al Jerf 2 (Ajman).">
{ldjson}
<style>
{font_face_css}
{css}
</style>
{body}
<script>
{js}
</script>
"""

with open(os.path.join(BASE, 'urban-cutz-artifact.html'), 'w', encoding='utf-8') as f:
    f.write(final)

print('Built artifact:', len(final), 'chars')
