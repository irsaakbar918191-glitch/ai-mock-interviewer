# AI Mock Interviewer

An AI-powered mock interview platform that generates adaptive interview questions, evaluates candidate answers, transcribes spoken responses, and stores performance history for review.

## Features

- Firebase email authentication
- Interview setup by job title, industry, and career seniority
- Adaptive interview questions powered by Groq
- Text and microphone-based answers
- Speech-to-text transcription with Groq Whisper
- AI feedback for technical accuracy and communication clarity
- Improved answer examples using the STAR structure
- Interview scores and historical performance tracking
- Reopen completed interviews to review transcripts and feedback
- Delete interview history from the dashboard

## Technology Stack

- Next.js 14 with the App Router
- React 18 and TypeScript
- Tailwind CSS
- Firebase Authentication and Firestore
- Groq API with `groq/compound-mini`
- Groq Whisper with `whisper-large-v3-turbo`
- Lucide React icons

## Requirements

- Node.js 18 or newer
- A Firebase project
- A Groq API key

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```

3. Add the required values to `.env.local`:

```env
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup

Enable the following Firebase services:

1. Authentication: enable Email/Password sign-in.
2. Firestore Database: create a database in production or test mode.
3. Add your local development domain to Firebase Authentication authorized domains if required.

Interview records are stored in the `interviews` Firestore collection. Each record belongs to the authenticated Firebase user who created it.

## Available Scripts

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run start    # Start the production server
npm run lint     # Run ESLint
```

## Deployment

The project can be deployed to Vercel:

1. Import the repository into Vercel.
2. Add all variables from `.env.local` in the Vercel project settings.
3. Deploy the application.
4. Add the Vercel production domain to Firebase Authentication authorized domains.

Never commit `.env.local` or expose `GROQ_API_KEY`. Local environment files, dependencies, and Next.js build output are excluded by `.gitignore`.

## Project Structure

```text
src/
  app/
    api/
      evaluate/       # Evaluate candidate answers
      interview/      # Generate adaptive questions
      transcribe/     # Convert recorded audio to text
    dashboard/        # Interview setup and history
    interview/[id]/   # Live and saved interview review
    login/            # Firebase authentication
  components/         # Shared UI components
  context/            # Authentication context
  lib/                # Firebase and Groq configuration
```

## Privacy and Security

- Keep `GROQ_API_KEY` server-side and store it only in environment variables.
- Do not commit `.env.local` to GitHub.
- Configure Firebase Authentication and Firestore Security Rules before production use.
- Rotate any API key that has previously been exposed.
