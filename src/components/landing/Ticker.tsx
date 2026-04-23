const items = [
  "Valoración gratuita sin compromiso",
  "Expertos en la costa mediterránea",
  "Respuesta en menos de 24h",
  "Sin letra pequeña ni permanencia",
  "+60 propiedades vendidas",
  "Menos de 28 días de media hasta la venta",
];

export function Ticker() {
  const doubled = [...items, ...items];

  return (
    <div className="bg-accent overflow-hidden py-3.5 select-none">
      <div className="flex whitespace-nowrap">
        <div className="flex items-center animate-marquee">
          {doubled.map((item, i) => (
            <span key={i} className="flex items-center flex-shrink-0">
              <span className="eyebrow text-white/85 px-5 tracking-[0.1em]">{item}</span>
              <span className="text-white/30 text-sm">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
