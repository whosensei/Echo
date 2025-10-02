import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailTemplate } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

// GET - Fetch all templates for user
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const templates = await db
      .select()
      .from(emailTemplate)
      .where(eq(emailTemplate.userId, userId));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const { name, type, subject, bodyContent, isDefault } = body;

    if (!name || !type || !subject || !bodyContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults of same type
    if (isDefault) {
      await db
        .update(emailTemplate)
        .set({ isDefault: false })
        .where(
          and(eq(emailTemplate.userId, userId), eq(emailTemplate.type, type))
        );
    }

    const [newTemplate] = await db
      .insert(emailTemplate)
      .values({
        userId,
        name,
        type,
        subject,
        body: bodyContent,
        isDefault: isDefault || false,
      })
      .returning();

    return NextResponse.json({ template: newTemplate }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// PUT - Update template
export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const { id, name, type, subject, bodyContent, isDefault } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults of same type
    if (isDefault) {
      await db
        .update(emailTemplate)
        .set({ isDefault: false })
        .where(
          and(
            eq(emailTemplate.userId, userId),
            eq(emailTemplate.type, type)
          )
        );
    }

    const [updatedTemplate] = await db
      .update(emailTemplate)
      .set({
        name,
        type,
        subject,
        body: bodyContent,
        isDefault,
        updatedAt: new Date(),
      })
      .where(and(eq(emailTemplate.id, id), eq(emailTemplate.userId, userId)))
      .returning();

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(emailTemplate)
      .where(
        and(eq(emailTemplate.id, templateId), eq(emailTemplate.userId, userId))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
