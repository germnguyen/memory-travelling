# Memory Travelling

> **A modern travel-memory platform for saving places, experiences, photos, videos, and personal travel albums.**

Memory Travelling is a full-stack web application that allows users to record and organize their travel experiences based on real-world locations. The system uses an interactive map of Vietnam as the central interface, allowing users to discover locations, create memories, attach photos/videos, organize memories into albums, and share their experiences.

The project is designed with **scalability, maintainability, SOLID principles, and Design Patterns** as core architectural requirements.

---

## 1. Project Overview

People often visit many places but gradually forget the details of those journeys. Photos may be scattered across devices, while travel experiences are not organized around the places where they actually happened.

**Memory Travelling** aims to solve this problem by connecting:

```text
Location
   ↓
Travel Memory
   ↓
Photos / Videos
   ↓
Personal Album
   ↓
Sharing
```

The main interface is an interactive map of Vietnam. Users can search for a location and create a memory associated with that location.

For example:

```text
Tà Xùa
   ↓
Bắc Yên
   ↓
Sơn La
   ↓
Latitude / Longitude
   ↓
Map Marker
   ↓
Travel Memory
   ├── Photos
   ├── Videos
   └── Experience
```

---

## 2. Main Objectives

The project focuses on four major objectives:

### Product Objective

Build a platform where users can:

* Explore locations on a map.
* Save places they have visited.
* Record travel experiences.
* Upload photos and videos.
* Organize memories into albums.
* Share memories with others.

### Technical Objective

Build the application using a modern full-stack architecture:

* React
* TypeScript
* Spring Boot
* PostgreSQL
* Object Storage
* Docker

### Architecture Objective

The system must be:

* Maintainable
* Modular
* Extensible
* Testable
* Loosely coupled

### Software Engineering Objective

Apply:

* SOLID principles
* Design Patterns
* Separation of concerns
* Dependency Inversion
* Interface-based programming
* Modular architecture

throughout the system rather than adding Design Patterns only after the application has been implemented.

---

# 3. Core Features

The current version focuses only on the following core features.

## 3.1 User

Users can access the system and manage their travel memories.

Basic user information includes:

* User ID
* Name
* Email
* Account information

---

## 3.2 Interactive Vietnam Map

The map is the central element of Memory Travelling.

The system provides:

* Interactive map of Vietnam
* Location markers
* Location search
* Map zoom
* Map navigation
* Display of locations associated with memories

Example:

```text
                 VIETNAM MAP

             ● Hà Giang
                   ●

          ● Tà Xùa
                   ●

              ● Hà Nội

                    ● Đà Nẵng

                       ● Đà Lạt
```

Locations with memories can be represented by visual markers on the map.

---

## 3.3 Location

A memory is associated with a real-world location.

The location can contain hierarchical information:

```text
Place
  ↓
Commune / Ward
  ↓
District
  ↓
Province / City
```

Example:

```text
Place:       Tà Xùa
Commune:     Tà Xùa
District:    Bắc Yên
Province:    Sơn La
```

The system can convert location information into geographic coordinates:

```text
Location
   ↓
Geocoding
   ↓
Latitude + Longitude
   ↓
Map
```

---

## 3.4 Memory

A **Memory** represents a user's travel experience at a particular location.

A memory may contain:

* Title
* Description / experience
* Location
* Photos
* Videos
* Creation time
* Owner

Example:

```text
┌────────────────────────────────────┐
│ My first trip to Tà Xùa            │
│                                    │
│ 📍 Tà Xùa, Bắc Yên, Sơn La         │
│                                    │
│ The clouds were everywhere...      │
│ The journey was difficult but      │
│ completely worth it.               │
│                                    │
│ 📷 12 photos   🎥 2 videos         │
└────────────────────────────────────┘
```

---

## 3.5 Photos and Videos

Users can attach media to their memories.

Supported media types:

```text
Memory
 ├── Image
 ├── Image
 ├── Image
 ├── Video
 └── Video
```

Media files will be stored in **Object Storage**, while the database stores their metadata.

The system will not store large image/video binary data directly inside PostgreSQL.

---

## 3.6 Personal Albums

Users can organize memories into albums.

Example:

```text
My Travel Albums

├── Northern Vietnam
│   ├── Hà Giang
│   ├── Tà Xùa
│   └── Mộc Châu
│
├── Central Vietnam
│   ├── Đà Nẵng
│   └── Hội An
│
└── Summer Trip 2026
    ├── Đà Lạt
    └── Nha Trang
```

An album can contain multiple memories, and a memory can belong to multiple albums.

---

## 3.7 Sharing

Users can share their memories or albums.

The sharing architecture will be designed so that additional sharing mechanisms can be introduced later without modifying the core memory logic.

---

# 4. User Flow

The main application flow is:

```text
                    ┌──────────┐
                    │   User   │
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │  Login   │
                    └────┬─────┘
                         │
                         ▼
                ┌──────────────────┐
                │   Vietnam Map    │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Search Location  │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Location Input   │
                │ Place / Ward /   │
                │ District / City  │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │    Geocoding     │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Latitude /       │
                │ Longitude        │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Map Zoom +       │
                │ Location Marker  │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Create Memory    │
                └────────┬─────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           Photos      Videos    Experience
              │          │          │
              └──────────┼──────────┘
                         ▼
                ┌──────────────────┐
                │ Save Memory      │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Personal Memory  │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │      Album       │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │      Share       │
                └──────────────────┘
```

---

# 5. UI / UX Direction

The frontend will follow a modern, minimal, editorial-style travel interface.

The provided visual reference establishes the overall **layout direction**, not a direct copy of the original website.

The main principles are:

* Large typography
* Generous whitespace
* Strong visual hierarchy
* Large map as the hero visual
* Rounded cards
* Travel photography
* Minimal navigation
* Clear call-to-action sections
* Long-form landing page
* Responsive design

The homepage structure is planned around:

```text
Navbar
   ↓
Hero
   ↓
Interactive Vietnam Map
   ↓
Discover / Overview
   ↓
Memory & Location Cards
   ↓
Featured Memory
   ↓
FAQ
   ↓
Call To Action
   ↓
Footer
```

The final visual design will be created and refined in **Figma** before implementation.

---

# 6. Frontend Architecture

The frontend will use:

* React
* TypeScript
* MapLibre GL JS

Proposed structure:

```text
frontend/
│
├── src/
│   │
│   ├── app/
│   │
│   ├── design-system/
│   │   ├── components/
│   │   ├── tokens/
│   │   └── styles/
│   │
│   ├── features/
│   │   ├── map/
│   │   ├── location/
│   │   ├── memory/
│   │   ├── media/
│   │   ├── album/
│   │   └── sharing/
│   │
│   ├── pages/
│   │
│   ├── services/
│   │
│   ├── hooks/
│   │
│   ├── models/
│   │
│   └── utils/
│
├── public/
│
├── Dockerfile
├── package.json
└── README.md
```

The `design-system` will contain reusable UI components based on the final Figma design.

Examples:

```text
Button
Input
Navbar
Modal
MemoryCard
AlbumCard
MapMarker
LocationCard
MediaGallery
```

---

# 7. Backend Architecture

The backend will use:

* Java
* Spring Boot
* REST API
* PostgreSQL

Proposed structure:

```text
backend/
└── src/main/java/com/memorytravelling/
    │
    ├── config/
    │
    ├── common/
    │   ├── exception/
    │   ├── response/
    │   └── util/
    │
    ├── user/
    │   ├── controller/
    │   ├── service/
    │   ├── repository/
    │   ├── entity/
    │   └── dto/
    │
    ├── location/
    │   ├── controller/
    │   ├── service/
    │   ├── repository/
    │   ├── entity/
    │   ├── dto/
    │   └── strategy/
    │
    ├── memory/
    │   ├── controller/
    │   ├── service/
    │   ├── repository/
    │   ├── entity/
    │   ├── dto/
    │   └── event/
    │
    ├── media/
    │   ├── controller/
    │   ├── service/
    │   ├── entity/
    │   ├── factory/
    │   └── storage/
    │
    ├── album/
    │   ├── controller/
    │   ├── service/
    │   ├── repository/
    │   └── entity/
    │
    └── sharing/
        ├── controller/
        ├── service/
        └── strategy/
```

The backend will separate:

```text
Controller
     ↓
Service
     ↓
Repository
     ↓
Database
```

Business logic will not be placed directly inside controllers.

---

# 8. System Architecture

The overall system is planned as:

```text
                         INTERNET
                            │
                            ▼
                  ┌──────────────────┐
                  │ React + TypeScript│
                  │     Frontend     │
                  └────────┬─────────┘
                           │
                     HTTPS / REST
                           │
                           ▼
                  ┌──────────────────┐
                  │   Spring Boot    │
                  │    Backend API   │
                  └────────┬─────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
      ┌────────────┐ ┌───────────┐ ┌─────────────┐
      │ PostgreSQL │ │  Object   │ │ External    │
      │            │ │  Storage  │ │ Services    │
      │ Metadata   │ │  Media    │ │ Geocoding   │
      └────────────┘ └───────────┘ └─────────────┘
```

---

# 9. Database Design

The initial database consists of:

```text
users
locations
memories
media
albums
album_memories
shares
```

## Relationships

```text
User 1 ───────── N Memory

User 1 ───────── N Album

User 1 ───────── N Share

Memory N ──────── 1 Location

Memory 1 ──────── N Media

Album N ───────── M Memory
```

Conceptually:

```text
┌──────────┐
│   User   │
└────┬─────┘
     │
     ├───────────────┐
     │               │
     ▼               ▼
┌──────────┐     ┌──────────┐
│ Memories │     │  Albums  │
└────┬─────┘     └────┬─────┘
     │                │
     ▼                │
┌──────────┐           │
│ Location │           │
└──────────┘           │
                       │
                ┌──────▼──────┐
                │Album_Memory │
                └─────────────┘

Memory
  │
  └── Media
       ├── Image
       └── Video
```

---

# 10. Media Storage

Large media files will not be stored directly in PostgreSQL.

Instead:

```text
                    ┌──────────────┐
                    │   Frontend   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Spring Boot  │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
          ┌───────────┐        ┌────────────┐
          │ PostgreSQL│        │Object Store│
          │ Metadata  │        │Photo/Video │
          └───────────┘        └────────────┘
```

Development environment:

**MinIO**

Production can later use an S3-compatible object storage provider without changing the core business logic.

---

# 11. Design Patterns

Design Patterns are a fundamental requirement of Memory Travelling.

Patterns will be introduced where they solve real architectural problems rather than being added artificially.

## Repository Pattern

Used to separate business logic from database access.

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
PostgreSQL
```

---

## Strategy Pattern

Used where multiple implementations may exist.

Potential applications:

```text
GeocodingStrategy
├── ProviderA
└── ProviderB
```

and:

```text
SharingStrategy
├── PublicSharing
└── ...
```

This allows new implementations to be introduced without modifying the main business logic.

---

## Factory Pattern

Used for creating different types of media.

```text
MediaFactory
     │
     ├── Image
     └── Video
```

The design can later support additional media types without heavily modifying existing code.

---

## Builder Pattern

Used when constructing complex domain objects such as `Memory`.

Conceptually:

```text
MemoryBuilder
    ↓
Title
Location
Description
Media
Metadata
    ↓
Memory
```

---

## Adapter Pattern

Used to isolate external systems from application logic.

For example, geocoding:

```text
Application
     │
     ▼
GeocodingService
     │
     ▼
GeocodingAdapter
     │
 ┌───┴────┐
 ▼        ▼
Provider A Provider B
```

The same principle applies to object storage:

```text
MediaStorage
     ▲
     │
 ┌───┴───────────┐
 │               │
MinioStorage   S3Storage
```

Business logic should depend on the abstraction rather than directly depending on MinIO or a specific cloud provider.

---

## Observer / Event-driven Pattern

The system can use domain events such as:

```text
MemoryCreated
```

Other components can react to the event without tightly coupling themselves to `MemoryService`.

Conceptually:

```text
MemoryService
      │
      │ publishes
      ▼
MemoryCreated
      │
 ┌────┼─────┐
 ▼    ▼     ▼
Map  Album  Other
```

This creates room for future extensions without modifying the core memory creation process.

---

# 12. SOLID Principles

The system will follow SOLID principles.

### Single Responsibility Principle

Each component should have one primary responsibility.

```text
MemoryController
    → HTTP/API handling

MemoryService
    → Business logic

MemoryRepository
    → Persistence
```

### Open/Closed Principle

Components should be open for extension but closed for unnecessary modification.

Example:

```text
GeocodingStrategy
```

allows another geocoding provider to be added without rewriting the memory system.

### Liskov Substitution Principle

Implementations should be replaceable through their abstractions.

### Interface Segregation Principle

Interfaces should remain focused rather than becoming large collections of unrelated methods.

### Dependency Inversion Principle

High-level business logic should depend on abstractions.

For example:

```text
MemoryService
      ↓
MediaStorage
      ↓
MinioStorage
```

instead of:

```text
MemoryService
      ↓
MinioClient
```

---

# 13. Technology Stack

| Layer               | Technology     |
| ------------------- | -------------- |
| Frontend            | React          |
| Language            | TypeScript     |
| Map                 | MapLibre GL JS |
| Backend             | Spring Boot    |
| Backend Language    | Java           |
| API                 | REST           |
| Database            | PostgreSQL     |
| Object Storage      | MinIO          |
| Containerization    | Docker         |
| Local Orchestration | Docker Compose |
| Reverse Proxy       | Nginx          |
| Version Control     | Git / GitHub   |
| Design              | Figma          |

---

# 14. Docker

The application is designed to be containerized.

Project structure:

```text
memory-travelling/
│
├── frontend/
│   └── Dockerfile
│
├── backend/
│   └── Dockerfile
│
├── docker-compose.yml
│
└── README.md
```

The local environment can eventually be started with:

```bash
docker compose up
```

Expected services:

```text
┌──────────────────────────┐
│       Docker Compose     │
│                          │
│  ┌────────────────────┐  │
│  │ Frontend           │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ Spring Boot        │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ PostgreSQL         │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ MinIO              │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

---

# 15. Deployment Architecture

The application is designed to support deployment to a cloud/VPS environment.

Target architecture:

```text
                    Internet
                       │
                       ▼
                  HTTPS Domain
                       │
                       ▼
                 Cloudflare / DNS
                       │
                       ▼
                     Nginx
                   /       \
                  /         \
                 ▼           ▼
            Frontend       /api
                              │
                              ▼
                         Spring Boot
                         /    |     \
                        /     |      \
                       ▼      ▼       ▼
                 PostgreSQL MinIO  External APIs
```

A custom domain is optional during development.

The application can initially be developed and tested locally before deployment.

---

# 16. Development Roadmap

The project will be developed incrementally.

### Phase 1 — Project Foundation

* Project repository
* Frontend setup
* Backend setup
* Docker setup
* Basic architecture
* Database configuration

### Phase 2 — User

* User entity
* Authentication
* User API
* Frontend authentication flow

### Phase 3 — Location

* Location model
* Location hierarchy
* Location search
* Geocoding
* Map integration

### Phase 4 — Memory

* Memory entity
* Create memory
* Edit memory
* View memory
* Delete memory
* Associate memory with location

### Phase 5 — Media

* Image upload
* Video upload
* Object Storage
* Media metadata
* Media display

### Phase 6 — Album

* Create album
* Add memories to album
* Remove memories from album
* View personal albums

### Phase 7 — Sharing

* Share memory
* Share album
* Sharing architecture

### Phase 8 — UI / UX

* Figma design
* Design System
* Responsive implementation
* Map-focused homepage
* Final visual refinement

### Phase 9 — Testing

* Unit testing
* Integration testing
* API testing
* Frontend testing
* Architecture verification

### Phase 10 — Deployment

* Docker production configuration
* Nginx
* HTTPS
* Database deployment
* Object Storage deployment
* Production environment

---

# 17. Project Principles

Memory Travelling follows these principles throughout development:

```text
                    MEMORY TRAVELLING
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
      SOLID           DESIGN PATTERNS     MODULARITY
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                    MAINTAINABILITY
                           │
                           ▼
                     EXTENSIBILITY
```

### Principle 1 — Separation of Concerns

Frontend, backend, persistence, storage, and external services should remain separated.

### Principle 2 — Low Coupling

Components should communicate through abstractions rather than concrete implementations whenever appropriate.

### Principle 3 — High Cohesion

Each module should focus on a clear responsibility.

### Principle 4 — Extensibility

Adding a new implementation should require minimal modification to existing business logic.

### Principle 5 — Testability

Business logic should be independently testable.

### Principle 6 — UI Independence

Changing the Figma design or frontend components should not require rewriting the backend business logic.

---

# 18. Repository Structure

The final repository is expected to follow this structure:

```text
memory-travelling/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
│
├── docs/
│   ├── architecture/
│   ├── database/
│   ├── api/
│   └── design/
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# 19. Current Project Scope

At the current stage, the official scope is:

```text
┌─────────────────────────────────────┐
│         MEMORY TRAVELLING           │
├─────────────────────────────────────┤
│                                     │
│ User                                │
│   │                                 │
│   ├── Vietnam Map                   │
│   │      │                          │
│   │      └── Location               │
│   │             │                   │
│   │             └── Geocoding       │
│   │                                 │
│   ├── Memory                        │
│   │      ├── Experience             │
│   │      ├── Photos                 │
│   │      └── Videos                 │
│   │                                 │
│   ├── Personal Album                │
│   │                                 │
│   └── Sharing                       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ React + TypeScript + MapLibre       │
│                ↓                    │
│          Spring Boot API            │
│          ↓          ↓               │
│     PostgreSQL     Object Storage   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ SOLID + Design Patterns             │
│                                     │
│ Repository · Strategy · Factory     │
│ Builder · Adapter · Observer        │
│                                     │
└─────────────────────────────────────┘
```

> **Note:** This README describes the current agreed scope. New product features should only be added when explicitly selected during the project's development.
