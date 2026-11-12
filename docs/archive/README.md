# DevVerse

DevVerse is an **AI-native Unified Developer Operating System** designed to revolutionize the way developers and students learn, build, collaborate, and deploy software. Powered by the AWS ecosystem and integrated AI agents, DevVerse delivers everything from a full cloud IDE to intelligent mentoring, project hosting, technical blogging, and one-click deployment — all in a single, seamless platform.

---

## What is DevVerse?

> “The only platform where learning, coding, collaboration, and deployment exist as a single, continuous AI-guided workflow.”

DevVerse tackles the modern developer's **Fragmentation Fatigue** by eliminating the need to juggle multiple disconnected platforms like code editors, StackOverflow, Udemy, GitHub, and AWS Console.

---

## Core Features

| Module                 | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| 💻 Cloud IDE          | Browser-based coding environment with inline AI code suggestions            |
| 🧠 AI Mentor          | Real-time context-aware debugging, explanation, and learning suggestions    |
| 📘 Learning Hub       | Track weaknesses, gain insights, and explore AI-curated resources           |
| 🌍 Community          | Developer Q&A, project showcases, collaborative debugging                   |
| ✍️ Blog System        | AI-assisted technical blogging with community visibility                    |
| 🚀 One-Click Deploy   | Instantly deploy microservices to AWS (Lambda, Fargate, Amplify, etc.)       |

---

## Powered By AWS

DevVerse is 100% AWS-native and uses:

- **Amazon Bedrock** – LLMs for AI mentoring, blogging, and semantic search
- **Amazon CodeCatalyst / Cloud9** – IDE hosting and runtime
- **Amazon S3 & EBS** – Code, asset, and project storage
- **Amazon DynamoDB** – User metadata, project states
- **Amazon Cognito** – Authentication and user roles
- **AWS Lambda / Fargate** – Zero-config backend execution
- **Amazon OpenSearch** – Contextual vector search
- **CloudWatch / X-Ray** – Logs and observability
- **Amazon Amplify / CloudFront** – Web hosting and global delivery

---

## Tech Stack

- **Frontend:** React, TypeScript, Monaco Editor
- **Backend:** FastAPI, AWS Lambda, DynamoDB
- **AI Layer:** Bedrock (LLMs, Titan), OpenSearch
- **DevOps:** CodeCatalyst, Amplify, Fargate
- **Security:** IAM, Cognito, Secrets Manager

---

## Getting Started (For Devs)

```bash
# Clone this repo
git clone https://github.com/devverse/devverse.git

# Install dependencies
cd devverse && npm install

# Launch locally (dev mode)
npm run dev
