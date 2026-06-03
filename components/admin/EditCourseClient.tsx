"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CourseForm from "./CourseForm";

interface Props {
  course: {
    id: string;
    name: string;
    description?: string;
    duration?: string;
    target_audience?: string;
    prerequisites?: string;
    pricing?: string;
    status: "active" | "archived";
  };
}

export default function EditCourseClient({ course }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: Parameters<typeof CourseForm>[0]["initial"] & object) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? "Failed to update course");
      }
      router.push("/admin/courses");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <CourseForm
      initial={course}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}
