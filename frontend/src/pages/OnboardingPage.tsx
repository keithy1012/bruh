import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowRight, Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { api } from "../services/api";
import { useUser } from "../hooks/useUser";

interface Debt {
  type: string;
  amount: number;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { setUserId } = useUser();

  const [step, setStep] = useState(1);
  const [age, setAge] = useState<number | "">("");
  const [annualIncome, setAnnualIncome] = useState<number | "">("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDebtChange = (
    index: number,
    field: keyof Debt,
    value: string
  ) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        setError("Please upload a CSV file");
        return;
      }
      setCsvFile(file);
      setError(null);
    }
  };

  const removeFile = () => {
    setCsvFile(null);
  };

  const handleSubmit = async () => {
    if (!age || !annualIncome) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append("age", String(age));
      formData.append("annual_income", String(annualIncome));
      formData.append(
        "debts",
        JSON.stringify(debts.filter((d) => d.type && d.amount > 0))
      );
      
      // Add CSV file if it exists
      if (csvFile) {
        formData.append("transactions_csv", csvFile);
      }

      const result = await api.onboardUser(formData);

      setUserId(result.user_id);
      navigate("/goals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to onboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2d4f7f] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a5f] rounded-full mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">
            Welcome to MoneyTree
          </h1>
          <p className="text-gray-600 mt-2">
            Let's get started with your financial journey
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s <= step ? "bg-[#1e3a5f]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How old are you?
              </label>
              <Input
                type="number"
                placeholder="Enter your age"
                value={age}
                onChange={(e) =>
                  setAge(e.target.value ? parseInt(e.target.value) : "")
                }
              />
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!age}
              className="w-full bg-[#1e3a5f] hover:bg-[#2d4f7f]"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What's your annual income?
              </label>
              <Input
                type="number"
                placeholder="Enter your annual income"
                value={annualIncome}
                onChange={(e) =>
                  setAnnualIncome(
                    e.target.value ? parseFloat(e.target.value) : ""
                  )
                }
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!annualIncome}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2d4f7f]"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any debts? (Optional)
              </label>
              {debts.map((debt, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Type (e.g., student loan)"
                    value={debt.type}
                    onChange={(e) =>
                      handleDebtChange(index, "type", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={debt.amount || ""}
                    onChange={(e) =>
                      handleDebtChange(index, "amount", e.target.value)
                    }
                    className="w-28"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDebt(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addDebt}
                className="w-full mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Debt
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={isLoading}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2d4f7f]"
              >
                {isLoading ? "Setting up..." : "Get Started"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
               {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Bank Transactions (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Upload a CSV file of your recent bank statement to get
                personalized insights
              </p>
              {!csvFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#1e3a5f] transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Click to upload CSV
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      or drag and drop
                    </span>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#1e3a5f] rounded p-2">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {csvFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(csvFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2d4f7f]"
              >
                {isLoading ? "Setting up..." : "Get Started"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      
      </Card>
    </div>
  );
}

export default OnboardingPage;
