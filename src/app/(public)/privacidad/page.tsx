import type { Metadata } from "next";
import { LegalLayout } from "@/components/landing/LegalLayout";

export const metadata: Metadata = {
  title: "Política de Privacidad | Budas del Mediterráneo",
  description: "Información sobre el tratamiento de tus datos personales por Budas del Mediterráneo S.L.",
};

export default function PrivacidadPage() {
  return (
    <LegalLayout title="Política de Privacidad" lastUpdated="Abril 2025">

      <h2>1. Responsable del tratamiento</h2>
      <p>
        <strong>Budas del Mediterráneo S.L.</strong><br />
        NIF: B75595801<br />
        Domicilio: José María Haro 61, Valencia<br />
        Correo electrónico: <a href="mailto:info@budasdelmediterraneo.com">info@budasdelmediterraneo.com</a><br />
        Web: budasdelmediterraneo.com
      </p>

      <h2>2. Datos que recogemos</h2>
      <p>A través del formulario de valoración gratuita recopilamos los siguientes datos:</p>
      <ul>
        <li>Nombre y apellidos</li>
        <li>Número de teléfono (WhatsApp)</li>
        <li>Dirección de correo electrónico (opcional)</li>
        <li>Ciudad o zona donde se ubica la propiedad</li>
        <li>Tipo de propiedad y características</li>
      </ul>

      <h2>3. Finalidad del tratamiento</h2>
      <ul>
        <li>Prestarte el servicio de valoración inmobiliaria gratuita que has solicitado</li>
        <li>Contactarte por WhatsApp o email para gestionar tu solicitud</li>
        <li>Informarte sobre nuestros servicios inmobiliarios, si has dado tu consentimiento</li>
      </ul>

      <h2>4. Legitimación</h2>
      <p>
        La base legal para el tratamiento de tus datos es el consentimiento que nos otorgas
        al marcar la casilla de aceptación en el formulario, de conformidad con el
        artículo 6.1.a del Reglamento General de Protección de Datos (RGPD).
      </p>
      <p>
        Puedes retirar tu consentimiento en cualquier momento, sin que ello afecte a la
        licitud del tratamiento previo a su retirada.
      </p>

      <h2>5. Conservación de los datos</h2>
      <p>
        Tus datos se conservarán mientras mantengan su finalidad o durante el tiempo
        necesario para atender posibles responsabilidades legales. Una vez concluida la
        relación, los datos se bloquearán y se eliminarán pasados los plazos legales aplicables.
      </p>

      <h2>6. Destinatarios</h2>
      <p>
        No cedemos tus datos a terceros, salvo obligación legal. Para la prestación del
        servicio utilizamos proveedores de confianza (alojamiento de datos, envío de
        comunicaciones) que actúan como encargados del tratamiento y están sujetos a las
        mismas garantías de protección.
      </p>

      <h2>7. Tus derechos</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li><strong>Acceso:</strong> saber qué datos tenemos sobre ti</li>
        <li><strong>Rectificación:</strong> corregir datos inexactos</li>
        <li><strong>Supresión:</strong> solicitar que eliminemos tus datos</li>
        <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado</li>
        <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos</li>
        <li><strong>Limitación:</strong> solicitar que restrinjamos el tratamiento</li>
      </ul>
      <p>
        Para ejercer cualquiera de estos derechos, escríbenos a{" "}
        <a href="mailto:info@budasdelmediterraneo.com">info@budasdelmediterraneo.com</a>.
        También puedes presentar una reclamación ante la{" "}
        <strong>Agencia Española de Protección de Datos (AEPD)</strong> en{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
      </p>

    </LegalLayout>
  );
}
