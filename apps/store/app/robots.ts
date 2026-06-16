import type { MetadataRoute } from "next";
import { STORE_URL } from "@apt/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // {
      //   userAgent: "*",
      //   allow: "/",
      //   disallow: ["/api/", "/account/", "/cart", "/rfq", "/request-approval", "/pay/"],
      // },
    ],
    sitemap: `${STORE_URL}/sitemap.xml`,
  };
}
