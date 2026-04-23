import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/crm", "/api/"],
      },
    ],
    sitemap: "https://budasdelmediterraneo.com/sitemap.xml",
  };
}
