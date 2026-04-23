import type { Metadata } from "next";
import { LegalLayout } from "@/components/landing/LegalLayout";

export const metadata: Metadata = {
  title: "Aviso Legal | Budas del Mediterráneo",
  description: "Aviso legal e información corporativa de Budas del Mediterráneo S.L.",
};

export default function AvisoLegalPage() {
  return (
    <LegalLayout title="Aviso Legal" lastUpdated="Abril 2025">

      <h2>1. Datos identificativos</h2>
      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios
        de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se informa:
      </p>
      <ul>
        <li><strong>Denominación social:</strong> Budas del Mediterráneo S.L.</li>
        <li><strong>NIF:</strong> B75595801</li>
        <li><strong>Domicilio social:</strong> José María Haro 61, Valencia</li>
        <li><strong>Actividad:</strong> Intermediación inmobiliaria</li>
        <li><strong>Correo electrónico:</strong> info@budasdelmediterraneo.com</li>
        <li><strong>Sitio web:</strong> budasdelmediterraneo.com</li>
      </ul>

      <h2>2. Objeto y ámbito de aplicación</h2>
      <p>
        El presente Aviso Legal regula el acceso, navegación y uso del sitio web
        budasdelmediterraneo.com. El acceso al sitio implica la aceptación de las
        presentes condiciones.
      </p>

      <h2>3. Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos del sitio web — incluyendo textos, imágenes, logotipos,
        diseño gráfico y código fuente — son propiedad de Budas del Mediterráneo S.L.
        o de sus licenciantes, y están protegidos por la legislación española e
        internacional sobre propiedad intelectual e industrial.
      </p>
      <p>
        Queda prohibida su reproducción, distribución, comunicación pública o
        transformación sin autorización expresa y por escrito.
      </p>

      <h2>4. Limitación de responsabilidad</h2>
      <p>
        Budas del Mediterráneo S.L. no se responsabiliza de los daños o perjuicios que
        pudieran derivarse del uso del sitio web, de la imposibilidad de acceso al mismo
        o de la inexactitud de la información contenida.
      </p>
      <p>
        Las valoraciones ofrecidas a través del formulario tienen carácter orientativo
        y no constituyen oferta de compraventa ni compromiso alguno.
      </p>

      <h2>5. Hipervínculos</h2>
      <p>
        Este sitio puede contener enlaces a páginas de terceros. Budas del Mediterráneo
        S.L. no asume responsabilidad alguna sobre los contenidos de dichos sitios ni
        garantiza su disponibilidad.
      </p>

      <h2>6. Ley aplicable y jurisdicción</h2>
      <p>
        Las presentes condiciones se rigen por la legislación española. Para la
        resolución de cualquier controversia derivada del uso de este sitio web,
        las partes se someten a los Juzgados y Tribunales correspondientes,
        renunciando expresamente a cualquier otro fuero que pudiera corresponderles.
      </p>

    </LegalLayout>
  );
}
