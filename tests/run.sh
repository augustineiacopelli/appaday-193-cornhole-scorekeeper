#!/usr/bin/env bash
# Validation gates for AppADay 193. Run from the repo root: bash tests/run.sh
set -u
cd "$(dirname "$0")/.."
FAIL=0
step() { echo; echo "== $1"; }

step "Engine tests"
node test.js || FAIL=1

step "Syntax check on the inline script"
TMP="$(mktemp -d)"
node -e '
const fs=require("fs");const h=fs.readFileSync("index.html","utf8");
const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;let m,out="";
while((m=re.exec(h)))out+=m[1]+"\n";fs.writeFileSync(process.argv[1],out);' "$TMP/app.js"
if node --check "$TMP/app.js"; then echo "  ok   node --check"; else echo "  FAIL node --check"; FAIL=1; fi
rm -rf "$TMP"

step "ASCII scan"
for f in index.html README.md test.js tests/run.sh; do
  BAD=$(node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");let n=0;for(const ch of s)if(ch.codePointAt(0)>127)n++;console.log(n)' "$f")
  if [ "$BAD" = "0" ]; then echo "  ok   $f"; else echo "  FAIL $f has $BAD non-ASCII characters"; FAIL=1; fi
done

step "Forbidden APIs"
for pat in 'roundRect' 'ellipse' 'window\.confirm' '\.remove()'; do
  if grep -n "$pat" index.html >/dev/null; then echo "  FAIL found $pat"; grep -n "$pat" index.html; FAIL=1; else echo "  ok   no $pat"; fi
done

step "Head tags, exactly one each"
count() { grep -o "$1" index.html | wc -l | tr -d ' '; }
check() { local n; n=$(count "$1"); if [ "$n" = "1" ]; then echo "  ok   $2"; else echo "  FAIL $2 appears $n times"; FAIL=1; fi; }
check 'name="viewport"' 'viewport'
check 'rel="apple-touch-icon" href="https://augustineiacopelli.github.io/appaday/icons/193.png"' 'apple-touch-icon 193'
check 'name="apple-mobile-web-app-title" content="Cornhole"' 'apple-mobile-web-app-title Cornhole'
check 'name="apple-mobile-web-app-capable"' 'apple-mobile-web-app-capable'
check 'name="mobile-web-app-capable"' 'mobile-web-app-capable'
check 'name="apple-mobile-web-app-status-bar-style" content="black"' 'status-bar-style black'
check 'rel="manifest" href="https://augustineiacopelli.github.io/appaday/manifests/193.webmanifest"' 'manifest 193'
check 'src="https://augustineiacopelli.github.io/appaday/save.js" defer' 'save.js defer'
check '<title>Cornhole Scorekeeper | AppADay 193</title>' 'title'
BL=$(count 'href="https://augustineiacopelli.github.io/appaday/"')
if [ "$BL" = "2" ]; then echo "  ok   portfolio backlink in header and footer"; else echo "  FAIL backlink count $BL"; FAIL=1; fi
VP=$(grep -n 'name="viewport"' index.html | cut -d: -f1); AT=$(grep -n 'apple-touch-icon' index.html | cut -d: -f1)
if [ "$AT" = "$((VP+1))" ]; then echo "  ok   apple-touch-icon directly after viewport"; else echo "  FAIL head order"; FAIL=1; fi

echo
if [ "$FAIL" = "0" ]; then echo "ALL GATES PASSED"; else echo "GATES FAILED"; fi
exit $FAIL
