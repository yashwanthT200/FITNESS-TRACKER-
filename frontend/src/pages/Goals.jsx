import { useEffect, useState } from "react";
import axios from "axios";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    GoalType: "",
    TargetValue: "",
    Deadline: ""
  });

  const fetchGoals = async () => {
    try {
      const res = await axios.get("/api/goals");
      setGoals(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
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
      await axios.post("/api/goals", {
        GoalType: form.GoalType,
        TargetValue: Number(form.TargetValue),
        Deadline: form.Deadline
      });

      setForm({
        GoalType: "",
        TargetValue: "",
        Deadline: ""
      });

      await fetchGoals();

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to create goal"
      );
    }
  };

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">
        Goals
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-5">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 mb-8">

        <h2 className="text-xl font-bold mb-5">
          Add Goal
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >

          <div>
            <label className="block mb-1 font-medium">
              Goal Type
            </label>

            <select
              name="GoalType"
              value={form.GoalType}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            >
              <option value="">Select goal</option>
              <option value="Running Distance">
                Running Distance
              </option>
              <option value="Cycling Distance">
                Cycling Distance
              </option>
              <option value="Daily Calories Burned">
                Daily Calories Burned
              </option>
              <option value="Steps">
                Steps
              </option>
              <option value="Workout Duration">
                Workout Duration
              </option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Target Value
            </label>

            <input
              type="number"
              name="TargetValue"
              value={form.TargetValue}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Deadline
            </label>

            <input
              type="date"
              name="Deadline"
              value={form.Deadline}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-garmin-blue text-white px-6 py-3 rounded-lg font-semibold"
            >
              Add Goal
            </button>
          </div>

        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-xl font-bold mb-5">
          My Goals
        </h2>

        {loading ? (
          <p>Loading goals...</p>
        ) : goals.length === 0 ? (
          <p className="text-gray-500">
            No goals found.
          </p>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b">
                  <th className="p-3">Goal</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Deadline</th>
                </tr>
              </thead>

              <tbody>
                {goals.map((goal) => (
                  <tr
                    key={goal.GOALID}
                    className="border-b"
                  >
                    <td className="p-3">
                      {goal.GOALTYPE}
                    </td>

                    <td className="p-3">
                      {goal.TARGETVALUE}
                    </td>

                    <td className="p-3">
                      {goal.DEADLINE}
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