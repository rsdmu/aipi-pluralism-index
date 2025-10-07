
    .PHONY: build api dev-frontend

    build:
	python -m aipi.cli build

    api:
	uvicorn api.main:app --reload --port 8000

    dev-frontend:
	cd frontend && npm install && npm run dev
