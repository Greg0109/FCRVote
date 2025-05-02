# Makefile for FastAPI Voting App Backend

VENV=.venv
PYTHON=$(VENV)/bin/python
UV=/Users/greg/.cargo/bin/uv
RUN=$(UV) run
ROOT_DIR=$(shell pwd)

.PHONY: help venv install run format reset-db build-front run-app

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

clean:
	-rm -r $(VENV)
	-rm -r src/front/node_modules
	-rm -r src/front/build
	-rm -r build
	-rm -r dist
	-rm -r *.egg-info
	-rm -r node_modules
	-rm -r voting.db

venv:
	$(UV) venv .venv

front:
	cd $(ROOT_DIR)/src/front/ && yarn start

back:
	$(RUN) uvicorn src.back.main:app --host 0.0.0.0 --reload

build-front:
	cd $(ROOT_DIR)/src/front/ && yarn run build

run-app: build-front
	$(RUN) uvicorn src.back.main:app --host 0.0.0.0 --reload

format:
	$(UV)x ruff check --fix

reset-db:
	rm -f voting.db
	$(PYTHON) -c "from main import Base, engine; Base.metadata.create_all(bind=engine)"
	@echo "Database reset."

test:
	$(PYTHON) ${ROOT_DIR}/src/tests/add.py
