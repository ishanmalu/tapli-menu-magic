import { useParams } from "react-router-dom";

export default function MealDetails() {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Meal Details</h1>
      <p>ID: {id}</p>
    </div>
  );
}