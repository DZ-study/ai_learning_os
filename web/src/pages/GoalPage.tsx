import { Button } from "@/components/ui/button";
import AddGoalDialog from "@/components/AddGoalDialog";
import { useState } from 'react';

export default function GoalPage() {

  const [showAddGoal, setShowAddGoal] = useState(true);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Learning Goals</h1>
      <p className="text-muted-foreground">Manage your learning goals and track progress.</p>
      {/* Goals list stub */}
      <Button onClick={() => setShowAddGoal(true)}>创建</Button>
      <AddGoalDialog
        open={showAddGoal}
        onOpenChange={setShowAddGoal}
      />
    </div>
  );
}
