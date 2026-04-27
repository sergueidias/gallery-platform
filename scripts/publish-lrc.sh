#!/bin/bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  ./publish-lrc.sh "/caminho/vitrine" "/caminho/pasta-com-galerias"

Variaveis opcionais:
  PUBLISH_REMOTE_HOST           Padrao: root@76.13.174.156
  PUBLISH_REMOTE_VITRINE_ROOT   Padrao: /var/www/gallery/vitrine
  PUBLISH_REMOTE_GALERIA_ROOT   Padrao: /var/www/gallery/galeria
EOF
}

if [ "$#" -ne 2 ]; then
  usage >&2
  exit 1
fi

SHOWCASE_SOURCE="$(cd "$1" && pwd)"
GALLERIES_SOURCE="$(cd "$2" && pwd)"

if [ ! -d "$SHOWCASE_SOURCE" ]; then
  echo "ERRO: vitrine nao encontrada: $SHOWCASE_SOURCE" >&2
  exit 1
fi

if [ ! -d "$GALLERIES_SOURCE" ]; then
  echo "ERRO: pasta de galerias nao encontrada: $GALLERIES_SOURCE" >&2
  exit 1
fi

REMOTE_HOST="${PUBLISH_REMOTE_HOST:-root@76.13.174.156}"
REMOTE_VITRINE_ROOT="${PUBLISH_REMOTE_VITRINE_ROOT:-/var/www/gallery/vitrine}"
REMOTE_GALERIA_ROOT="${PUBLISH_REMOTE_GALERIA_ROOT:-/var/www/gallery/galeria}"
REMOTE_SHOWCASE_CURRENT="${REMOTE_VITRINE_ROOT}/current"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

PATCHED_SHOWCASE="${WORK_DIR}/showcase"
PATCHED_MAIN_JS="${PATCHED_SHOWCASE}/assets/js/main.js"
PATCH_PAYLOAD="${WORK_DIR}/publish-lrc-patch.js"
MANIFEST_FILE="${WORK_DIR}/gallery-manifest.tsv"

cp -R "$SHOWCASE_SOURCE" "$PATCHED_SHOWCASE"

if [ ! -f "$PATCHED_MAIN_JS" ]; then
  echo "ERRO: assets/js/main.js nao encontrado na vitrine: $PATCHED_MAIN_JS" >&2
  exit 1
fi

python3 - <<'PY' "$GALLERIES_SOURCE" "$MANIFEST_FILE" "$PATCH_PAYLOAD"
from pathlib import Path
import json
import re
import sys

galleries_root = Path(sys.argv[1])
manifest_path = Path(sys.argv[2])
patch_path = Path(sys.argv[3])

def normalize_token(value: str) -> str:
    token = value.strip().lower()
    token = re.sub(r"\.[^.]+$", "", token)
    token = re.sub(r"([_-]capa| capa)$", "", token, flags=re.IGNORECASE)
    token = token.replace("&", " and ")
    token = re.sub(r"[\s_]+", "-", token)
    token = re.sub(r"[^a-z0-9-]", "-", token)
    token = re.sub(r"-{2,}", "-", token)
    return token.strip("-")

manifest_rows = []
redirect_map = {}

for item in sorted(galleries_root.iterdir()):
    if not item.is_dir():
        continue

    normalized_name = normalize_token(item.name)
    if not normalized_name:
        continue

    slug = normalized_name
    manifest_rows.append((str(item), slug))
    redirect_map[normalized_name] = slug

manifest_path.write_text(
    "".join(f"{source}\t{slug}\n" for source, slug in manifest_rows),
    encoding="utf-8",
)

patch = f"""
;(function() {{
  var __galleryRedirectMap = {json.dumps(redirect_map, ensure_ascii=True, sort_keys=True)};

  function __normalizeGalleryKey(value) {{
    if (!value) {{
      return "";
    }}

    var token = String(value)
      .split("?")[0]
      .split("#")[0]
      .split("/")
      .pop()
      .trim()
      .toLowerCase();

    token = token.replace(/\\.[^.]+$/, "");
    token = token.replace(/([_-]capa| capa)$/i, "");
    token = token.replace(/&/g, " and ");
    token = token.replace(/[\\s_]+/g, "-");
    token = token.replace(/[^a-z0-9-]/g, "-");
    token = token.replace(/-{{2,}}/g, "-");
    return token.replace(/^-+|-+$/g, "");
  }}

  function __resolveLoupeSlug() {{
    if (typeof _$loupeImg === "undefined" || !_$loupeImg || typeof _$loupeImg.attr !== "function") {{
      return "";
    }}

    var loupeSource = _$loupeImg.attr("src") || _$loupeImg.attr("data-src") || "";
    var normalizedKey = __normalizeGalleryKey(loupeSource);
    return __galleryRedirectMap[normalizedKey] || "";
  }}

  if (typeof _$loupeImg !== "undefined" && _$loupeImg && typeof _$loupeImg.off === "function" && typeof _$loupeImg.on === "function") {{
    _$loupeImg.off("click.publishLrcRedirect");
    _$loupeImg.on("click.publishLrcRedirect", function() {{
      var slug = __resolveLoupeSlug();

      if (!slug) {{
        return;
      }}

      window.location.href = "/galeria/" + encodeURIComponent(slug) + "/";
    }});
  }}
}})();
"""

patch_path.write_text(patch.strip() + "\n", encoding="utf-8")
PY

cat "$PATCH_PAYLOAD" >> "$PATCHED_MAIN_JS"

ssh "$REMOTE_HOST" "mkdir -p '$REMOTE_VITRINE_ROOT' '$REMOTE_GALERIA_ROOT' && rm -rf '$REMOTE_SHOWCASE_CURRENT'"
scp -r "$PATCHED_SHOWCASE" "$REMOTE_HOST:$REMOTE_SHOWCASE_CURRENT"

while IFS=$'\t' read -r source_dir slug; do
  [ -n "$source_dir" ] || continue
  ssh "$REMOTE_HOST" "rm -rf '$REMOTE_GALERIA_ROOT/$slug'"
  scp -r "$source_dir" "$REMOTE_HOST:$REMOTE_GALERIA_ROOT/$slug"
done < "$MANIFEST_FILE"

echo "PUBLICACAO_CONCLUIDA"
echo "HOST=$REMOTE_HOST"
echo "VITRINE=$REMOTE_SHOWCASE_CURRENT"
echo "GALERIAS=$(wc -l < "$MANIFEST_FILE" | tr -d ' ')"
