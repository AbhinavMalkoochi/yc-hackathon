# Welcome to your Convex + Next.js + Clerk app

This is a [Convex](https://convex.dev/) project created with [`npm create convex`](https://www.npmjs.com/package/create-convex).

After the initial setup (<2 minutes) you'll have a working full-stack app using:

- Convex as your backend (database, server logic)
- FastAPI as your additional API backend (REST API endpoints)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [Next.js](https://nextjs.org/) for optimized web hosting and page routing
- [Tailwind](https://tailwindcss.com/) for building great looking accessible UI
- [Clerk](https://clerk.com/) for authentication
- [Zod](https://zod.dev/) for runtime type validation

## Get started

If you just cloned this codebase and didn't use `npm create convex`, run:

```bash
npm install
```

### Running the Full Stack

The project now includes both Convex and FastAPI backends. To run everything:

```bash
npm run dev
```

This will start:

- Next.js frontend on `http://localhost:3000`
- Convex backend
- FastAPI server on `http://localhost:8000`

### Running Components Separately

You can also run components individually:

```bash
# Frontend only
npm run dev:frontend

# Convex backend only
npm run dev:backend

# FastAPI server only
npm run dev:fastapi
```

### FastAPI Setup

Before running the FastAPI server, install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### Testing the Connection

The main page includes a FastAPI connection test component with buttons to:

- Test the `/api/message` endpoint
- Check the health of the FastAPI server

You can also access the FastAPI documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

If you're reading this README on GitHub and want to use this template, run:

```
npm create convex@latest -- -t nextjs-clerk
```

Then:

1. Open your app. There should be a "Claim your application" button from Clerk in the bottom right of your app.
2. Follow the steps to claim your application and link it to this app.
3. Follow step 3 in the [Convex Clerk onboarding guide](https://docs.convex.dev/auth/clerk#get-started) to create a Convex JWT template.
4. Uncomment the Clerk provider in `convex/auth.config.ts`
5. Paste the Issuer URL as `CLERK_JWT_ISSUER_DOMAIN` to your dev deployment environment variable settings on the Convex dashboard (see [docs](https://docs.convex.dev/auth/clerk#configuring-dev-and-prod-instances))

If you want to sync Clerk user data via webhooks, check out this [example repo](https://github.com/thomasballinger/convex-clerk-users-table/).

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
