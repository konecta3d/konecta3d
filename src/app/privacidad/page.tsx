import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Konecta3D",
  description: "Política de privacidad y protección de datos de Konecta3D conforme al RGPD y la LOPD-GDD.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#f7fcfc]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Cabecera */}
        <div className="mb-12">
          <p className="text-sm font-semibold text-[#39a1a9] uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold text-[#0a323c] mb-4">Política de Privacidad</h1>
          <p className="text-[#0a323c]/60 text-sm">Última actualización: junio de 2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-[#0a323c]/80 space-y-8 text-sm leading-relaxed">

          {/* I. */}
          <section>
            <h2 className="text-xl font-bold text-[#0a323c] mb-4">
              I. Política de privacidad y protección de datos
            </h2>
            <p>
              Respetando lo establecido en la legislación vigente, <strong>Konecta3D</strong> se compromete a adoptar
              las medidas técnicas y organizativas necesarias, según el nivel de seguridad adecuado al riesgo de los
              datos recogidos.
            </p>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Leyes que incorpora esta política</h3>
            <ul className="space-y-2 list-disc list-inside text-[#0a323c]/70">
              <li>Reglamento (UE) 2016/679 (RGPD), de 27 de abril de 2016.</li>
              <li>Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales (LOPD-GDD).</li>
              <li>Real Decreto 1720/2007, de 21 de diciembre (RDLOPD).</li>
              <li>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información (LSSI-CE).</li>
            </ul>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Identidad del responsable del tratamiento</h3>
            <p>
              El responsable del tratamiento es <strong>Miguel David Pileta Miranda</strong>, con NIF 79044275Z,
              operando bajo la marca <strong>Konecta3D</strong>.
            </p>
            <div className="bg-white rounded-xl border border-[#0a323c]/10 p-4 mt-3 space-y-1">
              <p><span className="font-medium">Dirección:</span> Calle Cristal de Riviera, Bloque 5, N.º 8, Piso L</p>
              <p><span className="font-medium">Teléfono:</span> +34 623 75 94 51</p>
              <p><span className="font-medium">Email:</span>{" "}
                <a href="mailto:info@konecta3d.com" className="text-[#39a1a9] underline">info@konecta3d.com</a>
              </p>
            </div>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Registro de datos</h3>
            <p>
              En cumplimiento del RGPD y la LOPD-GDD, los datos personales recabados mediante los formularios de
              Konecta3D quedarán incorporados y serán tratados con el fin de facilitar, agilizar y cumplir los
              compromisos establecidos entre Konecta3D y el usuario, o para atender solicitudes o consultas del mismo.
            </p>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Principios aplicables al tratamiento</h3>
            <ul className="space-y-2 list-disc list-inside text-[#0a323c]/70">
              <li><strong>Licitud, lealtad y transparencia:</strong> se requiere consentimiento previo con información clara sobre los fines.</li>
              <li><strong>Limitación de la finalidad:</strong> datos recogidos con fines determinados, explícitos y legítimos.</li>
              <li><strong>Minimización de datos:</strong> solo los estrictamente necesarios.</li>
              <li><strong>Exactitud:</strong> los datos deben ser exactos y estar actualizados.</li>
              <li><strong>Limitación del plazo de conservación:</strong> solo durante el tiempo necesario para los fines del tratamiento.</li>
              <li><strong>Integridad y confidencialidad:</strong> tratamiento que garantice seguridad y confidencialidad.</li>
              <li><strong>Responsabilidad proactiva:</strong> el Responsable asegura el cumplimiento de los principios anteriores.</li>
            </ul>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Categorías de datos personales</h3>
            <p>
              En Konecta3D se tratan únicamente <strong>datos identificativos</strong> (nombre, teléfono, email,
              empresa). En ningún caso se tratan categorías especiales de datos personales en el sentido del
              artículo 9 del RGPD.
            </p>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Base legal para el tratamiento</h3>
            <p>
              La base legal es el <strong>consentimiento expreso</strong> del usuario. Este podrá retirar su
              consentimiento en cualquier momento de forma sencilla, sin que ello condicione el uso del servicio.
            </p>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Fines del tratamiento</h3>
            <p>
              Los datos se recaban para facilitar, agilizar y cumplir los compromisos con el usuario, así como para
              fines comerciales de personalización, operativos y estadísticos propios del objeto social de Konecta3D.
            </p>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Períodos de retención</h3>
            <p>
              Los datos se conservarán durante un máximo de <strong>24 meses</strong> desde el último contacto, o
              hasta que el usuario solicite su supresión.
            </p>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">
              Konecta3D como encargado del tratamiento (formularios de negocios clientes)
            </h3>
            <p>
              Cuando un negocio cliente de Konecta3D utiliza la plataforma para captar leads a través de sus propios
              formularios, ese negocio actúa como <strong>responsable del tratamiento</strong> de los datos de sus
              clientes finales. Konecta3D actúa en ese caso como <strong>encargado del tratamiento</strong>,
              procesando los datos exclusivamente para prestar el servicio contratado, conforme al artículo 28 del RGPD.
              Los datos de los leads nunca serán usados por Konecta3D para fines propios ajenos a la prestación del
              servicio.
            </p>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Datos personales de menores</h3>
            <p>
              Solo los mayores de 14 años podrán otorgar su consentimiento de forma lícita. Para menores de 14 años
              se requerirá el consentimiento de padres o tutores.
            </p>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Secreto y seguridad</h3>
            <p>
              Konecta3D adopta las medidas técnicas y organizativas adecuadas al riesgo. El sitio cuenta con
              certificado SSL. Ante una brecha de seguridad con alto riesgo para los derechos de los usuarios, se
              comunicará sin dilación indebida. Los datos son tratados como confidenciales.
            </p>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">Derechos del usuario</h3>
            <p>El usuario puede ejercer frente al Responsable los siguientes derechos:</p>
            <ul className="space-y-1 list-disc list-inside text-[#0a323c]/70 mt-2">
              <li><strong>Acceso:</strong> obtener confirmación sobre el tratamiento y sus datos concretos.</li>
              <li><strong>Rectificación:</strong> modificar datos inexactos o incompletos.</li>
              <li><strong>Supresión («derecho al olvido»):</strong> obtener la eliminación cuando los datos ya no sean necesarios.</li>
              <li><strong>Limitación del tratamiento:</strong> limitar el tratamiento en los casos previstos por el RGPD.</li>
              <li><strong>Portabilidad:</strong> recibir los datos en formato estructurado y de lectura mecánica.</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos.</li>
              <li><strong>No a decisiones automatizadas:</strong> no ser objeto de decisiones basadas solo en tratamiento automatizado.</li>
            </ul>

            <div className="bg-white rounded-xl border border-[#0a323c]/10 p-4 mt-4 space-y-1 text-sm">
              <p className="font-medium text-[#0a323c] mb-2">Ejercicio de derechos — enviar solicitud a:</p>
              <p><span className="font-medium">Referencia:</span> «RGPD - app.konecta3d.com»</p>
              <p><span className="font-medium">Dirección postal:</span> Calle Cristal de Riviera, Bloque 5, N.º 8, Piso L</p>
              <p><span className="font-medium">Email:</span>{" "}
                <a href="mailto:info@konecta3d.com" className="text-[#39a1a9] underline">info@konecta3d.com</a>
              </p>
              <p className="text-[#0a323c]/50 text-xs mt-2">
                Incluye: nombre, apellidos y copia del DNI, petición con motivos específicos, domicilio de notificaciones,
                fecha y firma.
              </p>
            </div>

            <h3 className="text-base font-semibold text-[#0a323c] mt-6 mb-2">
              Reclamaciones ante la autoridad de control
            </h3>
            <p>
              Si considera que existe una infracción normativa, puede presentar reclamación ante la{" "}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-[#39a1a9] underline">
                Agencia Española de Protección de Datos (AEPD)
              </a>.
            </p>
          </section>

          {/* II. */}
          <section className="border-t border-[#0a323c]/10 pt-8">
            <h2 className="text-xl font-bold text-[#0a323c] mb-4">
              II. Aceptación y cambios en esta política
            </h2>
            <p>
              El uso de la plataforma implica la aceptación de esta Política de Privacidad. Konecta3D se reserva el
              derecho a modificarla conforme a cambios legislativos o de criterio propio. Se recomienda consultar esta
              página periódicamente. Los cambios relevantes se comunicarán en la medida de lo posible a través de la
              propia plataforma.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[#0a323c]/10 flex items-center justify-between">
          <a href="https://app.konecta3d.com" className="text-sm text-[#39a1a9] hover:underline">
            ← Volver a Konecta3D
          </a>
          <p className="text-xs text-[#0a323c]/30">© 2026 Konecta3D</p>
        </div>
      </div>
    </div>
  );
}
