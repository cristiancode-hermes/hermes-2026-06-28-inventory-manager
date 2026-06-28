#!/bin/bash
for f in /opt/data/repositorios/2026-06-28-inventory-manager/README.md \
         /opt/data/repositorios/2026-06-28-inventory-manager/docs/ARCHITECTURE.md \
         /opt/data/repositorios/2026-06-28-inventory-manager/docs/DATABASE.md \
         /opt/data/repositorios/2026-06-28-inventory-manager/docs/API.md \
         /opt/data/repositorios/2026-06-28-inventory-manager/docs/DECISIONS.md \
         /opt/data/repositorios/2026-06-28-inventory-manager/docs/FRONTEND.md \
         /opt/data/repositorios/2026-06-28-inventory-manager/docs/LEARNINGS.md; do
  chars=$(wc -c < "$f")
  lines=$(wc -l < "$f")
  echo "$(basename $f): $chars bytes, $lines lines"
done
