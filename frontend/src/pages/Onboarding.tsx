import React, { useState } from "react";

interface Debt {
  type: string;
  amount: number;
}

const Onboarding: React.FC = () => {
  const [age, setAge] = useState<number | "">("");
  const [annualIncome, setAnnualIncome] = useState<number | "">("");
  const [debts, setDebts] = useState<Debt[]>([{ type: "", amount: 0 }]);
  const [submitted, setSubmitted] = useState(false);

  const handleDebtChange = (index: number, field: keyof Debt, value: string) => {
    const updated = [...debts];
    if (field === "amount") {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setDebts(updated);
  };

  const addDebt = () => {
    setDebts([...debts, { type: "", amount: 0 }]);
  };

  const removeDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // POST to backend (adjust URL as needed)
    const response = await fetch("/api/users/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age,
        annual_income: annualIncome,
        debts,
      }),
    });
    if (response.ok) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return <div style={styles.container}><h2>Onboarding Complete!</h2></div>;
  }

  return (
    <div style={styles.container}>
      <h1>Welcome to MoneyMap</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Age:
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : "")}
            required
            style={styles.input}
          />
        </label>
        <label style={styles.label}>
          Annual Income ($):
          <input
            type="number"
            value={annualIncome}
            onChange={(e) => setAnnualIncome(e.target.value ? parseFloat(e.target.value) : "")}
            required
            style={styles.input}
          />
        </label>
        <fieldset style={styles.fieldset}>
          <legend>Debts</legend>
          {debts.map((debt, index) => (
            <div key={index} style={styles.debtRow}>
              <input
                type="text"
                placeholder="Type (e.g., student loan)"
                value={debt.type}
                onChange={(e) => handleDebtChange(index, "type", e.target.value)}
                style={styles.input}
              />
              <input
                type="number"
                placeholder="Amount"
                value={debt.amount}
                onChange={(e) => handleDebtChange(index, "amount", e.target.value)}
                style={styles.input}
              />
              <button type="button" onClick={() => removeDebt(index)} style={styles.removeBtn}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addDebt} style={styles.addBtn}>
            + Add Debt
          </button>
        </fieldset>
        <button type="submit" style={styles.submitBtn}>
          Submit
        </button>
      </form>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: 500,
    margin: "40px auto",
    padding: 24,
    fontFamily: "sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontWeight: 500,
  },
  input: {
    padding: 8,
    fontSize: 16,
    marginTop: 4,
    borderRadius: 4,
    border: "1px solid #ccc",
  },
  fieldset: {
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: 12,
  },
  debtRow: {
    display: "flex",
    gap: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  addBtn: {
    marginTop: 8,
    padding: "6px 12px",
    cursor: "pointer",
  },
  removeBtn: {
    padding: "6px 12px",
    cursor: "pointer",
    background: "#eee",
    border: "none",
    borderRadius: 4,
  },
  submitBtn: {
    padding: "12px 24px",
    fontSize: 18,
    cursor: "pointer",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 4,
  },
};

export default Onboarding;
