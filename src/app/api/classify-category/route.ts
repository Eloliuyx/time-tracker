import { NextRequest, NextResponse } from "next/server";
import { CATEGORIES } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: "Missing OPENAI_MODEL" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const label = typeof body?.label === "string" ? body.label.trim() : "";

    if (!label) {
      return NextResponse.json(
        { error: "Missing label" },
        { status: 400 }
      );
    }

    const systemPrompt = [
      "You are a strict time-tracking category classifier.",
      `You must classify the user's activity into exactly one of these categories: ${CATEGORIES.join(", ")}.`,
      "Choose based on the primary purpose of the activity.",
      "Return JSON only.",
      "Do not explain your reasoning.",
      "If the label is ambiguous, choose the single most likely category.",
      "Guidance:",
      "- Work: project execution, writing, building, startup work, meetings that advance work",
      "- Learning: studying, reading docs, tutorials, research for understanding",
      "- Admin: email, scheduling, forms, setup, logistics, account management",
      "- Life: meals, chores, errands, commute, daily living tasks",
      "- Self-Care: bath, standing meditation, gentle restorative walk, skincare, recovery-oriented care",
      "- Exercise: workout, run, gym, training, intentional physical exercise",
      "- Entertainment: shows, gaming, casual leisure content",
      "- Rest: nap, lying down, doing nothing, passive recovery",
    ].join("\n");
    console.log("Using model:", model);
console.log("Classifying label:", label);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Activity label: ${label}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "time_tracker_category",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                category: {
                  type: "string",
                  enum: [...CATEGORIES],
                },
              },
              required: ["category"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
  const text = await response.text();
  console.error("OpenAI request failed:", text);
  return NextResponse.json(
    { error: `OpenAI request failed: ${text}` },
    { status: 500 }
  );
}

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid OpenAI response shape" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    const category = parsed?.category;

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Model returned invalid category" },
        { status: 500 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
