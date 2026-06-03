"use client";

import { useRouter } from "next/navigation";
import CourseForm from "@/components/admin/CourseForm";
import { useState } from "react";

export default function NewCoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: Parameters<typeof CourseForm>[0]["initial"] & object) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        throw new Error(err.message ?? "Failed to create course");
      }
      router.push("/admin/courses");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold">New Course</h1>
      <CourseForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
