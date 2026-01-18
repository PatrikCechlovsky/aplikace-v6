#!/bin/bash

# FILE: scripts/auto-commit-push.sh
# PURPOSE: Automatický commit a push změn na větvi feature/ai-spoluprace
# USAGE: ./scripts/auto-commit-push.sh "Popis změn"

set -e

BRANCH="feature/ai-spoluprace"
MESSAGE="${1:-Auto-commit: změny z AI spolupráce}"

# Zkontrolovat, jestli jsme na správné větvi
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "⚠️  Aktuální větev: $CURRENT_BRANCH"
  echo "⚠️  Očekávaná větev: $BRANCH"
  read -p "Chceš přepnout na větev $BRANCH? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git checkout "$BRANCH" || git checkout -b "$BRANCH"
  else
    echo "❌ Zrušeno. Zůstáváme na větvi $CURRENT_BRANCH"
    exit 1
  fi
fi

# Zkontrolovat, jestli jsou nějaké změny
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ Žádné změny k commitnutí"
  exit 0
fi

# Přidat všechny změny
echo "📦 Přidávám změny..."
git add -A

# Commit
echo "💾 Commituji změny: $MESSAGE"
git commit -m "$MESSAGE"

# Push
echo "🚀 Pushuji na origin $BRANCH..."
git push origin "$BRANCH"

echo "✅ Hotovo! Změny byly úspěšně commitnuty a pushnuty na $BRANCH"

