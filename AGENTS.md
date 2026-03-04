# AGENTS.md

## Docker

Quando lavori sul supporto Docker di questo repository, produci sempre una configurazione completa e coerente. Non lasciare mai modifiche parziali.

Devono essere sempre presenti:

- `Dockerfile`
- `docker-compose.yml`
- `deploy.sh`
- `run.sh`

Se uno di questi file manca, crealo. Se esiste ma non e coerente con gli altri, aggiornalo.

## Dockerfile

Il `Dockerfile` deve:

- installare le dipendenze necessarie
- copiare i file richiesti dal progetto
- eseguire sempre la build applicativa nell'immagine quando il progetto la richiede
- non dipendere da build manuali esterne gia eseguite
- esporre la porta del servizio finale
- preferire un runtime di produzione rispetto a un dev server quando possibile

Per frontend statici, preferisci build multi-stage e serving dei file compilati tramite `nginx`.

## Compose

`docker-compose.yml` deve essere sempre generato o mantenuto aggiornato e deve includere almeno:

- build dal `Dockerfile`
- nome servizio coerente con il progetto
- policy di restart
- mapping porte esplicito
- environment, volumi o network solo se necessari

La configurazione deve permettere l'avvio con `docker compose up --build` senza passaggi manuali nascosti.

## Scripts

`deploy.sh` deve:

- entrare nella directory del progetto
- costruire l'immagine Docker
- usare variabili configurabili per registry, image name e tag
- eseguire push se il flusso del progetto prevede un registry
- usare `set -euo pipefail`

`run.sh` deve:

- usare variabili configurabili per immagine, tag, nome container e porte
- se trova un container esistente con lo stesso nome, deve sempre fermarlo e rimuoverlo prima di avviarne uno nuovo
- eseguire `docker pull` quando l'immagine proviene da registry
- avviare il container con il mapping porte corretto
- stampare un riepilogo finale chiaro
- usare `set -euo pipefail`

## Coerenza finale

Prima di chiudere un task Docker, verifica sempre:

1. presenza di `Dockerfile`, `docker-compose.yml`, `deploy.sh`, `run.sh`
2. build applicativa inclusa nell'immagine, se necessaria
3. coerenza delle porte tra `Dockerfile`, `docker-compose.yml` e `run.sh`
4. avvio previsto con `docker compose up --build`
5. assenza di configurazioni incomplete o basate su dev server in produzione quando evitabile
