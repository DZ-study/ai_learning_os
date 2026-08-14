# React Component Development Rules

## 1. Component Responsibility
Every component should have a single responsibility.

A component should focus on one of:
 - UI rendering
 - User interaction
 - Data presentation
 - Layout composition

Avoid putting multiple responsibilities into one component.

Bad:

UserDashboard.tsx
- fetch user data
- manage filters
- handle modal
- validate forms
- render table

Good:

UserDashboard.tsx
|
|- UserFilter
|- UserTable
|- UserFormDialog
|- useUsers()

---

## 2.Component Structure

Preferred structure:

ComponentName/
|- index.ts
|- ComponentName.tsx
|- types.ts
|- components/

## 3. Component Size

Preferred:

- 50-200 lines

Warning:

- More than 300 lines

Need refactoring:

- More than 500 lines


## 4. Props Design

Keep props simple and meaningful.

Avoid excessive props.

Bad:

<Card
 title=""
 description=""
 icon=""
 color=""
 size=""
 loading=""
 disabled=""
/>


Prefer composition:

<Card>
  <CardHeader />
  <CardContent />
</Card>


---

## 5. Business Logic

Components should not contain complex business logic.

Bad:


function LearningGoalPage(){

 const createGoal = async()=>{
   ...
 }

 const updateGoal = async()=>{
   ...
 }

}


Good:


function LearningGoalPage(){

 const {
   createGoal,
   updateGoal
 } = useLearningGoal()

}


Rules:

- API calls belong to services
- Business logic belongs to hooks
- Global state belongs to Zustand


---



