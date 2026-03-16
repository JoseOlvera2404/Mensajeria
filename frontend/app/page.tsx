import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}

      <header className="border-b bg-white">

        <div className="max-w-6xl mx-auto flex items-center justify-between p-4">

          <h1 className="font-bold text-xl">
            Sistema de Mensajería
          </h1>

          <div className="flex gap-2">

            <Link href="/login">
              <Button variant="outline">
                Login
              </Button>
            </Link>

            <Link href="/register">
              <Button>
                Registro
              </Button>
            </Link>

          </div>

        </div>

      </header>

      {/* Hero */}

      <section className="flex-1 flex items-center justify-center">

        <div className="max-w-2xl text-center space-y-6">

          <h2 className="text-4xl font-bold">
            Aplicación de Mensajería en Tiempo Real
          </h2>

          <p className="text-gray-600 text-lg">
            Esta aplicación forma parte de una práctica de la materia
            <strong> Computación en la Nube</strong>.
            Permite a los usuarios comunicarse en tiempo real utilizando
            WebSockets, almacenamiento en la nube y una arquitectura moderna
            basada en microservicios.
          </p>

          <div className="flex justify-center gap-4" flex-wrap>

            <a href="/downloads/ChatApp.apk" download>
              <Button size="lg" variant="secondary">
                Descargar APK
              </Button>
            </a>

            <Link href="/register">
              <Button size="lg">
                Crear cuenta
              </Button>
            </Link>

            <Link href="/login">
              <Button size="lg" variant="outline">
                Iniciar sesión
              </Button>
            </Link>

          </div>

        </div>

      </section>

      {/* Footer */}

      <footer className="border-t bg-white">

        <div className="max-w-6xl mx-auto p-4 text-center text-sm text-gray-500">

          Proyecto académico · Computación en la Nube

        </div>

      </footer>

    </main>
  );
}