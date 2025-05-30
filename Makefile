# Makefile for FastAPI Voting App Backend

VENV=.venv
PYTHON=$(VENV)/bin/python
UV=/Users/greg/.cargo/bin/uv
RUN=$(UV) run
ROOT_DIR=$(shell pwd)

.PHONY: help venv install run format reset-db build-front run-app clean docker-build

help:
	@echo "Available commands:"
	@echo "  make clean        - Remove all build artifacts"
	@echo "  make venv         - Create virtual environment"
	@echo "  make install      - Install dependencies"
	@echo "  make run          - Start FastAPI server with reload"
	@echo "  make format       - Format code with black"
	@echo "  make reset-db     - Delete and recreate the SQLite DB"
	@echo "  make build-front  - Build the frontend"
	@echo "  make run-app      - Build frontend and run backend"
	@echo "  make docker-build - Build Docker image"

clean:
	-rm -r src/front/build
	-rm -r build
	-rm -r dist
	-rm -r *.egg-info

clean-all:
	-rm -r $(VENV)
	-rm -r src/front/node_modules
	-rm -r src/front/build
	-rm -r build
	-rm -r dist
	-rm -r *.egg-info
	-rm -r node_modules

venv:
	$(UV) venv .venv

front-install:
	cd $(ROOT_DIR)/src/front/ && yarn install

front:
	cd $(ROOT_DIR)/src/front/ && yarn start

back:
	$(RUN) uvicorn src.back.main:app --host 0.0.0.0 --reload

format:
	$(UV)x ruff check --fix

reset-db:
	rm -f voting.db
	$(PYTHON) -c "from main import Base, engine; Base.metadata.create_all(bind=engine)"
	@echo "Database reset."

test:
	$(PYTHON) ${ROOT_DIR}/src/tests/add.py

docker-run: docker-stop
	docker run -p 8000:8000 fcrvote

docker-stop:
	docker ps -q --filter ancestor=fcrvote | xargs -r docker stop

docker-clean: docker-stop
	docker ps -aq --filter ancestor=fcrvote | xargs -r docker rm

docker-rm: docker-clean
	docker rmi fcrvote || true

build-front: front-install
	cd $(ROOT_DIR)/src/front/ && yarn run build

dist: clean
	uv build

docker-build: dist build-front docker-rm
	docker build -t fcrvote -f docker/Dockerfile .

docker-compose:
	docker compose -f docker/docker-compose.yml up --force-recreate