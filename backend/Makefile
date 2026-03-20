COMPOSE := docker compose -f deployment/docker-compose.yml
COMPOSE_DEV := docker compose -f deployment/docker-compose.dev.yml -p lotushack-dev

## up: Start all services (app + postgres)
up:
	$(COMPOSE) up -d --build

## dev: Start only postgres for local development
dev:
	$(COMPOSE_DEV) up -d

## down: Stop all services
down:
	$(COMPOSE) down
	$(COMPOSE_DEV) down

## clean: Stop all services and remove volumes
clean:
	$(COMPOSE) down -v
	$(COMPOSE_DEV) down -v

## logs: Tail logs for all services
logs:
	$(COMPOSE) logs -f

## ps: Show running containers
ps:
	$(COMPOSE) ps
	$(COMPOSE_DEV) ps

.PHONY: up dev down clean logs ps
