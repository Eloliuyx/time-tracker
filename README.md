# 时间沙漏

一个极简的个人时间追踪 Web App。

你只需要输入“刚刚在做什么”，系统就会把这段时间记录下来，并自动用 AI 归类。你还可以在回顾页按日期查看当天记录、分类汇总和时间分布图。

## Features

### Tracking
- Continuous session timer
- Quick text-based time logging
- Automatic start/end time capture
- AI-powered category classification (you need to add your own API key)
- Inline editing for record labels
- Inline category editing on record cards
- Undo latest record

### Review
- Separate 记录 / 回顾 tabs
- Daily review by date
- Total tracked time for the selected day
- Category summary
- Donut chart for time distribution
- Chinese category labels in the UI

### Storage and Auth
- Supabase-backed persistence
- Login required
- Cross-device access to the same data

## Categories

The app classifies each record into one of the following categories:

- 工作
- 学习
- 事务
- 生活
- 自我照料
- 运动
- 娱乐
- 休息

AI assigns a category automatically when a record is created. Categories can be edited manually later.

## Tech Stack

- Next.js
- React
- Tailwind CSS
- Supabase
- OpenAI API
- Recharts

## Project Structure

```text
src/
  app/
    api/
      classify-category/
        route.ts
  components/
    AuthGate.tsx
    CurrentSession.tsx
    DailyReview.tsx
    RecordInput.tsx
    TimeTracker.tsx
    Timeline.tsx
  hooks/
    useTimeRecords.ts
  lib/
    db.ts
    supabase.ts
    time.ts
  types/
    index.ts


## How It Works

### Record flow
- The app keeps track of the current ongoing session.
- You enter what you were just doing.
- The app sends the label to a server-side API route.
- The server calls OpenAI to classify the label into a fixed category set.
- The record is saved to Supabase with: label, start time, end time, category

### Review flow
- Select a date in the 回顾 tab.
- The app filters records for that day.
- It shows:all records for the day, total tracked duration, category breakdown, donut chart, Environment Variables



## Create a .env.local file in the project root:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-nano



## Install dependencies:

npm install

## Start the dev server:

npm run dev

Then open:

http://localhost:3000
Authentication

The app uses Supabase Auth.

Current setup:

email-based sign-in
authenticated users can only access their own records via RLS policies
AI Classification

Category assignment is handled server-side through src/app/api/classify-category/route.ts.
