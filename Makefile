FRONTEND := apps/frontend

.PHONY: install install-frontend dev build

install: install-frontend

install-frontend:
	npm ci --include=dev --prefix "$(FRONTEND)"

dev:
	npm run dev --prefix "$(FRONTEND)"

build:
	npm run build --prefix "$(FRONTEND)"
