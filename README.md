# GitHub Access Report API

A production-ready Express.js backend service that generates an access report for a given GitHub organization using a Personal Access Token (PAT).

## Features

- **GitHub API Integration**: Authenticates securely via PAT to fetch repositories and collaborators.
- **Aggregation Logic**: Maps each user to the repositories they have access to, along with their permission level limit handling.
- **Caching**: Uses in-memory `node-cache` to optimize performance and reduce repeated GitHub API requests (TTL 10 mins).
- **Concurrency**: Parallelly fetches repo collaborators in chunks to respect API limits but ensure fast responses.
- **Containerized**: Includes a Dockerfile for easy deployments.
- **Swagger Documentation**: Interactive OpenAPI interface to test the endpoint.

## Setup Instructions

### Prerequisites
- Node.js (v18 or above)
- GitHub Personal Access Token (Classic or Fine-grained) with `read:org`, `repo`, and `read:user` permissions.

### Local Development

1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env` file in the root directory:
   ```env
   PORT=3000
   GITHUB_PAT=your_github_personal_access_token_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Production Build

1. Build the TypeScript source code:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```

### Running with Docker

1. Build the Docker image:
   ```bash
   docker build -t github-access-report .
   ```
2. Run the Docker container:
   ```bash
   docker run -p 3000:3000 -e GITHUB_PAT=your_token_here github-access-report
   ```

## API Usage Example

Once the server is running, you can hit the endpoint to get the access report.

**Endpoint**: `GET /api/access-report?org={orgName}`

**Example using cURL**:
```bash
curl -X GET "http://localhost:3000/api/access-report?org=your-org-name"
```

**Success Response (200 OK)**:
```json
{
  "organization": "your-org-name",
  "total_users": 150,
  "total_repositories": 45,
  "users": [
    {
      "username": "octocat",
      "repositories": [
        {
          "repo": "hello-world",
          "permission": "admin"
        }
      ]
    }
  ]
}
```

### Swagger Documentation
You can interact with the API using Swagger UI by navigating to:
`http://localhost:3000/api-docs`

## Design Decisions

- **TypeScript**: Typed language for fewer runtime errors and great IDE intellisense.
- **Batching & Promises (`Promise.all`)**: Repositories are fetched sequentially to fetch lists of collaborators but batched inside to strike a balance between speed and getting blocked by GitHub secondary rate limits.
- **Winston for Logging**: Industry standard to handle logs. Replaces basic `console.log`.
- **Node-Cache**: Super simple in-memory caching to protect our GitHub quota if multiple identical requests occur back-to-back. Redis could be swapped in simply for multi-instance deployments.
- **User Profile Graceful Fallback**: If an organization is not found (404), the API intelligently attempts to scan it as a standard User profile instead, pulling personal repositories to aid in testing and flexibility.
