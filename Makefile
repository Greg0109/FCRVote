# Makefile for FastAPI Voting App Backend

VENV=.venv
PYTHON=$(VENV)/bin/python
UV=/Users/greg/.cargo/bin/uv
RUN=$(UV) run
ROOT_DIR=$(shell pwd)

.PHONY: help venv install run format reset-db

help:
	@echo "Available commands:"
	@echo "  make venv         - Create virtual environment"
	@echo "  make install      - Install dependencies"
	@echo "  make run          - Start FastAPI server with reload"
	@echo "  make format       - Format code with black"
	@echo "  make reset-db     - Delete and recreate the SQLite DB"

venv:
	$(UV) venv .venv

front:
	cd $(ROOT_DIR)/src/front/ && npm start

back:
	$(RUN) uvicorn src.back.main:app --reload

format:
	$(UV)x ruff check --fix

reset-db:
	rm -f voting.db
	$(PYTHON) -c "from main import Base, engine; Base.metadata.create_all(bind=engine)"
	@echo "Database reset."