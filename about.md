## Inspiration
Applying for universities is a tedious process of manually going through the acceptance criteria of each university. Often, students end up missing opportunities because they are unaware of all the programs that they are eligible for, or can be eligible by taking an additional test, or course. We want to make sure everyone can reach their potential.

## What it does
Skills Bridge creates a path from where the student is right now, to where they want to reach. Our AI agents extract information about students through their marksheets and CV/resume, extract admission criteria from universities, and prepare a roadmap that allows students to apply to programs they are eligible for, and bridge the gaps to open access to more programs.

### Profile extraction
Student gives us their academic data — either by uploading a marks sheet (we OCR it and pull grades out with an LLM) or typing grades manually. We also ask one question: "what do you want to become?" From that career choice, we infer which majors to search. "I want to be an AI Engineer" maps to Computer Science, Data Science, AI & ML. That's the input — grades + target majors. We normalize everything to a universal format: GPA on a 4.0 scale, subject names mapped to international equivalents (Toán → Mathematics), test scores standardized.

### Matching

This is the engine. We maintain a database of university programs — scraped and structured — where each program has concrete admission criteria: minimum GPA, required test scores, prerequisite subjects, tuition, deadlines. For every program in the database, we run the student's profile against those criteria. Simple comparison: does your GPA meet the minimum? Do you have the required test scores? Have you taken the prerequisite courses? Each requirement gets a pass/fail. Programs where you pass everything go into the "eligible" list. Programs where you fail 1-2 closeable requirements go into "almost there." The gap is specific and measurable — not "you need to be better at math" but "you need IELTS 7.0, you have 6.0" or "you're missing a Probability & Statistics course."

### Bridge the Gap

Create a study plan to open more opportunities. This is where it gets useful. Look across all 41 "almost there" programs and notice that 28 of them need IELTS 7.0. That one improvement unlocks 28 programs. That's your priority 1. Then 12 programs need a statistics course — priority 2. We sort gaps by how many programs they unlock, estimate time to close each gap, and lay it out as a timeline. The study plan isn't generic advice — it's a weighted list of exactly what to do, in what order, to maximize the number of programs you qualify for within your remaining time before application deadlines.

## How we built it
Our app is split into two parts:

### Frontend
We used Figma Make to build an MVP in React.

### Backend

We used Codex and OpenAI to build the backend in Python using FastAPI. We leveraged TinyFish to source job market data and university admissions criteria. We use a custom built agent that connects the two datasets and user preferences.

## Challenges we ran into

The biggest challenge we ran into was the lack of free access to AI tools to build prototypes. We wanted to leverage openrouter, but did not have credits so ended up using the models directly.

## Accomplishments that we're proud of

We were able to put together an MVP very fast.

## What we learned

## What's next for Skills Bridge
Our solution fits perfectly into what eTest is trying to accomplish. Next, we'd like to integrate with eTest and similar products to enhance the user experience and offer more to their existing user base.

Additionally, we can expand from students entering undergrad programs to professionals looking to switch careers, or professionals looking to upgrade their skills and open up doors to additional opportunities.

We'd also like to gamify the roadmap to increase retention and make it easier for users to upgrade skills without burning out.

