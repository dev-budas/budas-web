import type { Metadata } from "next";
import { LegalLayout } from "@/components/landing/LegalLayout";

export const metadata: Metadata = {
  title: "Política de Cookies | Budas del Mediterráneo",
  description: "Información sobre el uso de cookies en budasdelmediterraneo.com.",
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies" lastUpdated="Abril 2025">

      <h2>1. ¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos de texto que los sitios web almacenan en tu
        dispositivo al visitarlos. Permiten que el sitio recuerde tus preferencias y
        mejora tu experiencia de navegación.
      </p>

      <h2>2. Cookies que utilizamos</h2>

      <h3>Cookies técnicas (necesarias)</h3>
      <p>
        Son imprescindibles para el funcionamiento del sitio. Sin ellas, el sitio no
        puede funcionar correctamente. No requieren tu consentimiento.
      </p>
      <ul>
        <li>Gestión de sesión y preferencias del usuario</li>
        <li>Seguridad y prevención de fraude</li>
      </ul>

      <h3>Cookies analíticas</h3>
      <p>
        Nos permiten conocer cómo interactúan los usuarios con el sitio para mejorar
        su funcionamiento. Actualmente este sitio no utiliza herramientas de analítica
        de terceros.
      </p>

      <h3>Cookies de terceros — Meta (Facebook/Instagram)</h3>
      <p>
        Si accedes a este sitio a través de un anuncio de Meta Ads, Facebook o Instagram
        pueden instalar cookies en tu dispositivo para medir la efectividad de sus
        campañas publicitarias. Estas cookies están sujetas a la{" "}
        <a href="https://www.facebook.com/policy/cookies" target="_blank" rel="noopener noreferrer">
          política de cookies de Meta
        </a>
        .
      </p>

      <h2>3. Cómo gestionar las cookies</h2>
      <p>
        Puedes configurar tu navegador para aceptar, rechazar o eliminar las cookies.
        Ten en cuenta que deshabilitar ciertas cookies puede afectar al funcionamiento
        del sitio. A continuación encontrarás los enlaces para gestionar las cookies en
        los principales navegadores:
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
            Google Chrome
          </a>
        </li>
        <li>
          <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web" target="_blank" rel="noopener noreferrer">
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
            Safari
          </a>
        </li>
        <li>
          <a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">
            Microsoft Edge
          </a>
        </li>
      </ul>

      <h2>4. Actualizaciones de esta política</h2>
      <p>
        Podemos actualizar esta política de cookies en cualquier momento. Te recomendamos
        revisarla periódicamente. El uso continuado del sitio tras la publicación de
        cambios implica la aceptación de los mismos.
      </p>

      <h2>5. Contacto</h2>
      <p>
        Si tienes preguntas sobre el uso de cookies en este sitio, puedes escribirnos a{" "}
        <a href="mailto:info@budasdelmediterraneo.com">info@budasdelmediterraneo.com</a>.
      </p>

    </LegalLayout>
  );
}
