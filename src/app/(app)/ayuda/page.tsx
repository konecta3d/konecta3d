"use client";

import Link from "next/link";

export default function AyudaPage() {
  const sections = [
    {
      title: "Landing",
      description: "Tu página web pública",
      whatIs: "Es la página que tus clientes ven cuando acceden a tu enlace público. Muestra quién eres, qué ofreces y cómo contactarte.",
      uses: [
        "Presentar tu negocio a nuevos clientes",
        "Mostrar tu información de contacto",
        "Direccionar a tus clientes a WhatsApp u otras redes",
        "Dar a conocer tus beneficios y ofertas",
      ],
      steps: [
        "Accede a Landing desde el menú",
        "Añade tu logo y nombre de negocio",
        "Personaliza los colores y estilo",
        "Configura los botones (WhatsApp, Instagram, etc)",
        "Guarda los cambios",
        "Comparte el enlace público",
      ],
    },
    {
      title: "Beneficios VIP",
      description: "Crea descuentos y ofertas exclusivas",
      whatIs: "Son documentos PDF personalizados que puedes regalar a tus clientes. Incluyen un código de descuento exclusivo.",
      uses: [
        "Recompensar a tus clientes faithful",
        "Atraer nuevos clientes",
        "Hacer promociones temporales",
        "Enviar beneficios por WhatsApp o email",
      ],
      steps: [
        "Accede a Beneficios VIP desde el menú",
        "Crea un nuevo beneficio (título, valor, código)",
        "Personaliza el diseño del PDF",
        "Descarga el PDF o genera un enlace",
        "Envía el beneficio a tu cliente",
      ],
    },
    {
      title: "WhatsApp",
      description: "Enlaces directos a tu WhatsApp",
      whatIs: "Son enlaces especiales que abren WhatsApp directamente con un mensaje ya escrito. Tu cliente solo tiene que enviarlo.",
      uses: [
        "Facilitar que te contacten",
        "Automatizar mensajes de bienvenida",
        "Enviar presupuestos rápidos",
        "Atender consultas de clientes",
      ],
      steps: [
        "Accede a WhatsApp desde el menú",
        "Ingresa tu número de WhatsApp",
        "Escribe el mensaje de bienvenida",
        "Copia el enlace y compártelo",
      ],
    },
    {
      title: "Clientes",
      description: "Gestiona tu lista de clientes",
      whatIs: "Aquí guardas los datos de tus clientes: nombre, teléfono, email, notas y los beneficios que les has enviado.",
      uses: [
        "Recordar información de clientes",
        "Historial de beneficios enviados",
        "Segmentar clientes (VIP, Nuevo, Frecuente)",
        "Seguimiento de clientes",
      ],
      steps: [
        "Accede a Clientes desde Mi Negocio",
        "Añade un nuevo cliente",
        "Agrega sus datos (nombre, teléfono, email)",
        "Asigna etiquetas para organizar",
        "Consulta el historial de beneficios",
      ],
    },
    {
      title: "Catálogo",
      description: "Tus productos y servicios",
      whatIs: "Es donde registras todo lo que ofreces: servicios, productos, precios normales y precios oferta.",
      uses: [
        "Tener un inventario de lo que ofreces",
        "Mostrar precios actuales y ofertas",
        "Seleccionar productos al crear beneficios",
        "Organizar por categorías",
      ],
      steps: [
        "Accede a Catálogo desde Mi Negocio",
        "Añade un nuevo producto o servicio",
        "Indica nombre, precio y precio oferta",
        "Agrega categoría y características",
        "Marca como destacado si lo deseas",
      ],
    },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guía de Uso</h1>
        <p className="mt-1 text-sm text-[var(--brand-1)]">
          Aprende a usar cada sección del sistema
        </p>
      </div>

      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
        >
          <div>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="text-sm text-[var(--brand-1)]">{section.description}</p>
          </div>

          <div className="mt-4">
            <h3 className="font-medium">Qué es</h3>
            <p className="mt-1 text-sm text-[var(--brand-1)]">{section.whatIs}</p>
          </div>

          <div className="mt-4">
            <h3 className="font-medium">Para qué sirve</h3>
            <ul className="mt-2 list-disc list-inside text-sm text-[var(--brand-1)] space-y-1">
              {section.uses.map((use, i) => (
                <li key={i}>{use}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="font-medium">Cómo usarla</h3>
            <ol className="mt-2 list-decimal list-inside text-sm text-[var(--brand-1)] space-y-1">
              {section.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold">¿Necesitas más ayuda?</h2>
        <p className="mt-2 text-sm text-[var(--brand-1)]">
          Si tienes alguna duda, contacta con soporte o pregunta a tu administrador.
        </p>
      </div>
    </div>
  );
}
