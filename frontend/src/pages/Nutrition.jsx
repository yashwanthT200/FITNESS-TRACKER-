import { useEffect, useState } from "react";
import axios from "axios";

export default function Nutrition() {
  const [nutrition, setNutrition] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    MealType: "",
    Calories: "",
    Quantity: "",
    Date: "",
    FoodItems: ""
  });

  const fetchNutrition = async () => {
    try {
      const res = await axios.get("/api/nutrition");
      setNutrition(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load nutrition data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNutrition();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const foodItems = form.FoodItems
        .split(",")
        .map(item => item.trim())
        .filter(item => item);

      await axios.post("/api/nutrition", {
        MealType: form.MealType,
        Calories: Number(form.Calories),
        Quantity: Number(form.Quantity),
        Date: form.Date,
        FoodItems: foodItems
      });

      setForm({
        MealType: "",
        Calories: "",
        Quantity: "",
        Date: "",
        FoodItems: ""
      });

      await fetchNutrition();

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to add nutrition"
      );
    }
  };

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">
        Nutrition
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-5">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <h2 className="text-xl font-bold mb-5">
          Add Nutrition
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >

          <div>
            <label className="block mb-1 font-medium">
              Meal Type
            </label>

            <select
              name="MealType"
              value={form.MealType}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            >
              <option value="">Select meal</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Calories
            </label>

            <input
              type="number"
              name="Calories"
              value={form.Calories}
              onChange={handleChange}
              required
              min="0"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Quantity
            </label>

            <input
              type="number"
              name="Quantity"
              value={form.Quantity}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Date
            </label>

            <input
              type="date"
              name="Date"
              value={form.Date}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">
              Food Items
            </label>

            <input
              type="text"
              name="FoodItems"
              value={form.FoodItems}
              onChange={handleChange}
              placeholder="Example: Oatmeal, Banana, Milk"
              className="w-full border rounded-lg p-3"
            />

            <p className="text-sm text-gray-500 mt-1">
              Separate multiple food items with commas.
            </p>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-garmin-blue text-white px-6 py-3 rounded-lg font-semibold"
            >
              Add Nutrition
            </button>
          </div>

        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-xl font-bold mb-5">
          My Nutrition
        </h2>

        {loading ? (
          <p>Loading nutrition...</p>
        ) : nutrition.length === 0 ? (
          <p className="text-gray-500">
            No nutrition records found.
          </p>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b">
                  <th className="p-3">Meal</th>
                  <th className="p-3">Calories</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Food Items</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {nutrition.map((item) => (
                  <tr
                    key={item.NUTRITIONID}
                    className="border-b"
                  >
                    <td className="p-3">
                      {item.MEALTYPE}
                    </td>

                    <td className="p-3">
                      {item.CALORIES}
                    </td>

                    <td className="p-3">
                      {item.QUANTITY}
                    </td>

                    <td className="p-3">
                      {Array.isArray(item.FOODITEMS)
                        ? item.FOODITEMS.join(", ")
                        : item.FOODITEMS || "-"}
                    </td>

                    <td className="p-3">
                      {item.Date || item.DATE}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}