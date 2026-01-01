# Product Roadmap

The Product Roadmap module is an internal tool for tracking the development progress of the InventoryPro system. It allows team members to propose features, report issues, and discuss project priorities.

## Key Features

- **Roadmap Items**: Track feature requests and development tasks with titles, descriptions, status, and priority.
- **Categorization**: Use tags to group related items (e.g., `feature`, `bug`, `priority`).
- **Progress Tracking**: Update status (e.g., `Planned`, `In Progress`, `Completed`) and set target dates.
- **Collaboration**: Commenting system for items to facilitate discussion among team members.
- **Reporting**: Priority-based filtering to focus on critical tasks.

## API Endpoints

- `GET /api/roadmap`: List all roadmap items with filters.
- `POST /api/roadmap`: Create a new roadmap item.
- `GET /api/roadmap/[id]`: Get item details and comments.
- `PATCH /api/roadmap/[id]`: Update an item's status, priority, or details.
- `DELETE /api/roadmap/[id]`: Remove an item.
- `POST /api/roadmap/[id]/comments`: Add a comment to an item.

## Technical Details

- **Service**: `RoadmapService` in `services/roadmap.service.ts`.
- **Database Models**: `RoadmapItem` and `RoadmapComment`.
- **Authentication**: Requires authenticated user for all actions; author details are tracked for each item and comment.
