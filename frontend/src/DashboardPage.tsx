import { Card } from "./components/ui/card";
import LinkButton from "./components/ui/LinkButton";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <div className="lg:col-span-2 space-y-6">
        <Card title="Mi plan activo">
          <p className="text-gray-600">Aún no tienes un plan asignado.</p>

          <div className="bg-blue-100 p-4 rounded-lg text-blue-900">
            Cuando un administrador te asigne un plan, sus fases, días y ejercicios aparecerán aquí.
          </div>

          <LinkButton color="black" to="/admin">Ir al panel de administración</LinkButton>
        </Card>
      </div>

      <Card title="Progreso del plan">
        <p className="text-gray-600">Resumen de ejemplo pendiente de conectarse con tus entrenamientos.</p>

        <div className="space-y-3">
          <div>
            <p className="font-medium">Semana actual: 5 de 12</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: "42%" }} />
            </div>
          </div>

          <p>Sesiones completadas: <strong>14 / 48</strong></p>
          <p>Adherencia: <strong>82%</strong></p>
          <p>Fase actual: <strong>Hipertrofia</strong></p>
          <p>Próximo objetivo: <strong>Completar 4 sesiones</strong></p>

          <div className="bg-yellow-100 p-3 rounded-lg text-yellow-900">
            Registra tus sesiones para que este panel pueda mostrar tu evolución real.
          </div>
        </div>
      </Card>

    </div>
  );
}
