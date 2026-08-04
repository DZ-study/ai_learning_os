import type { Quiz } from "../types";

interface QuizCardProps {
  quiz: Quiz;
}

export default function QuizCard({ quiz }: QuizCardProps) {
  return <div className="border p-4 rounded-lg">{quiz.title} (stub)</div>;
}
