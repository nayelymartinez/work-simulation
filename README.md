# Blueprint AI Work Simulation Exercise

This repository contains a full-stack application scaffold for a work simulation exercise. The goal is to evaluate your ability to work with AI technologies and build a simple question-answering agent.

## Project Overview

The project consists of:

- A React frontend (`client`)
- A NestJS backend (`api`)
- A PostgreSQL database
- A sample transcript for the AI agent to analyze

## Setup

0. Under the root directory, create your .env file and populate with the following:
   ```
   OPENAI_API_KEY={YOUR_OPENAI_API_KEY}
   DATABASE_URL=postgres://postgres:postgres@db:5432/appdb
   MAX_SUMMARY_TOKENS=6000
   AGENT_LLM=gpt-4-turbo
   SUMMARIZER_LLM=gpt-4.1
   ```
1. From the root of the project, start the application:
   ```bash
   docker compose up --build
   ```
2. In a new terminal, run the database migrations:
   ```bash
   docker compose run api npm run migration:up
   ```
3. In /api:

   ```
   docker compose run --rm api npx ts-node scripts/loadTranscript.ts
   ```

   This will load the transcript into the DB

4. Visit [localhost:5173](http://localhost:5173) to verify the application is running

## Frontend:

#### Core Technologies

- **React** – JavaScript library for building user interfaces.
- **TypeScript** – Typed superset of JavaScript for safer, scalable code.
- **Vite** – Fast development server and bundler for modern web apps.

#### UI & Styling

- **Chakra UI** – Accessible, composable component library.

#### HTTP & State

- **Axios** – Promise-based HTTP client for the browser.

## Backend:

This API is built with **NestJS**. Additional frameworks and libraries added include:

#### AI & Language Processing

- **LangChain** (`langchain`, `@langchain/core`, `@langchain/openai`) – Framework for building language model applications.
- **OpenAI SDK** (`openai`) – Interacts with OpenAI's models for generating completions, embeddings, etc.
- **GPT-3 Encoder** (`gpt-3-encoder`) – Tokenization utility for managing LLM input/output lengths.

#### Database & ORM

- **Kysely** – Type-safe SQL query builder for TypeScript.
- **pg** – PostgreSQL driver for Node.js.
- **db-migrate / db-migrate-pg** – Lightweight, CLI-driven database migration tool.

#### Validation & Transformation

- **class-validator** – Declarative validation for objects.
- **class-transformer** – Transforms plain objects into class instances.

#### Caching & Queuing

- **ioredis** – Fast Redis client, often used for caching, pub/sub, or queues.

## The Challenge

Your task is to create a simple AI agent that can answer questions about the contents of a provided transcript. The transcript will be available in the `api/data/transcript.txt` file.

### Requirements

1. Create an endpoint in the API that accepts questions about the transcript
2. Implement a basic agent that can:
   - Read and understand the transcript
   - Answer questions about its contents
   - Provide relevant quotes or references when appropriate
3. Add a simple interface in the frontend to:
   - Display the transcript
   - Allow users to ask questions
   - Show the agent's responses

### Evaluation Criteria

Your solution will be evaluated on:

- Code organization and quality
- Implementation of the AI agent
- User interface design and experience
- Error handling and edge cases
- Documentation and comments

### Time Expectations

Plan to spend about 4 hours to complete this exercise. Focus on delivering a working solution that demonstrates your understanding of AI concepts and software engineering principles.

## Project Structure

- `/api` - Backend Node.js application
- `/client` - Frontend React application
- `/api/data` - Contains the transcript file
- `docker-compose.yml` - Docker configuration for all services

## Available Scripts

In the API directory:

- `npm run dev` - Start the development server
- `npm run migration:up` - Run database migrations
- `npm run test` - Run tests

In the Client directory:

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run test` - Run tests

## Submission

When you're done:

1. Push your changes to your fork of this repository and make it public
2. Send us the link to your repository
3. Include any additional notes or documentation about your implementation

Good luck!
