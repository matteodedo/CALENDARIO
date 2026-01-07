# Gestione Assenze - Product Requirements Document

## Data creazione: 7 Gennaio 2025

## Problem Statement
App con calendario condiviso per gestire le assenze del personale (ferie, permessi, malattie). Ogni richiesta dovrà essere gestita (approvata, rifiutata, in attesa) dagli utenti autorizzati. Ogni utente può vedere tutto il calendario.

## User Personas
1. **Admin**: Gestisce tutto il sistema, approva tutte le richieste, gestisce utenti e impostazioni
2. **Manager**: Approva le richieste del proprio team
3. **Dipendente**: Richiede assenze, visualizza calendario condiviso

## Core Requirements
- Autenticazione JWT (email/password)
- Tre ruoli: Admin, Manager, Employee
- Tipi assenza: Ferie, Permessi, Malattia
- Calendario condiviso visibile a tutti
- Sistema di approvazione richieste
- Upload logo aziendale
- Notifiche email (Resend)

## What's Been Implemented ✅

### Backend (FastAPI + MongoDB)
- Auth completa (register, login, JWT)
- CRUD Utenti con controllo ruoli
- CRUD Richieste assenza
- Workflow approvazione/rifiuto
- Statistiche dashboard
- Upload logo aziendale (base64)
- Integrazione Resend per email (richiede API key)

### Frontend (React + Shadcn)
- Login/Registrazione
- Dashboard con calendario interattivo
- Vista assenze per data selezionata
- Statistiche (dipendenti, richieste in attesa, approvate)
- Le mie richieste
- Approvazioni (Manager/Admin)
- Gestione Utenti (Admin)
- Impostazioni azienda (Admin)

## Prioritized Backlog

### P0 (Completato)
- [x] Autenticazione utenti
- [x] Calendario condiviso
- [x] Creazione richieste
- [x] Approvazione/Rifiuto
- [x] Gestione ruoli

### P1 (Da fare)
- [ ] Filtri calendario per tipo assenza
- [ ] Export calendario (PDF/Excel)
- [ ] Notifiche in-app

### P2 (Future)
- [ ] Calcolo giorni ferie disponibili per utente
- [ ] Report mensili automatici
- [ ] Integrazione calendario Google/Outlook

## Technical Stack
- Backend: FastAPI + MongoDB (Motor async)
- Frontend: React 19 + Shadcn/UI + TailwindCSS
- Auth: JWT
- Email: Resend (API key non configurata)

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET/PUT/DELETE /api/users
- GET/POST /api/absences
- GET /api/absences/my
- GET /api/absences/pending
- PUT /api/absences/{id}/action
- GET/PUT /api/settings
- POST /api/settings/logo
- GET /api/stats
