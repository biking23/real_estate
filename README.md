# AI Financial Analyst

An interactive financial dashboard with an embedded AI financial analyst that enables users to ask questions about their financial data and receive answers grounded in the underlying data.

## The Problem

Most financial reporting is static. Reports and slides are generated, reviewed, and distributed, but follow-up questions often require leaving the report, working in another application such as Excel, or asking an analyst to investigate and respond later.

## The Solution

An interactive financial dashboard that allows users to ask questions about their underlying financial data and receive responses grounded in that data.
Instead of treating the monthly business review as a static report, the AI Financial Analyst turns it into an interactive experience where users can investigate performance and ask follow-up questions.

## Demo

[Live Application]
[10-minute Demo Video]

## Product Documentation
https://app.notion.com/p/Real-Estate-Financial-Analyst-PRD-3e5e7060762480d99b65c1bcc7812d52

## How It Works

Architecture diagram

## Tech Stack

Lovable
Supabase / PostgreSQL
n8n
RAG
LLM
...

## Example Questions

"What caused NOI to change this month?"
...

## Product Decisions

Why RAG?
Why structured financial data?
How did we handle hallucinations?

## Limitations

What the MVP doesn't do yet.

## Next Iteration

Data ingestion
...

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
