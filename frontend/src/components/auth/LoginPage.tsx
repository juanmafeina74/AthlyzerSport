import { useState } from "react";
import Card from "../ui/card";
import Button from "../ui/button";
import FormInput from "../ui/FormInput";
import { login } from "../services/auth.service";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const user = await login(email, password);
      localStorage.setItem("athlyzer_user", JSON.stringify(user));
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err?.message ?? "No se pudo iniciar sesión.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light px-6">
      <div className="w-full max-w-md">
      <Card title="AthLyzer Sports Train" description="Inicia sesión para continuar">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FormInput
            label="Contraseña"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="rounded-lg bg-alert-danger px-4 py-3 text-sm text-red-800">{error}</p>}
          <Button color="black" type="submit">
            Entrar
          </Button>
        </form>
      </Card>
      </div>
    </div>
  );
}
