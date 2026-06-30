import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, isStepCount, streamText, tool } from "ai";
import { z } from "zod";
import { connectDB, BrandModel, ProductModel } from "@apt/db";

export const maxDuration = 30;

const COMPANY_KNOWLEDGE: Record<string, string> = {
  general:
    "APT Ghana (Automation & Plant Technologies Ltd) is an authorised industrial equipment distributor based in Accra, Ghana. Founded in 2009, we serve manufacturing, oil & gas, mining, utilities, and construction sectors across West Africa with genuine OEM products.",
  contact:
    "Visit us at Ring Road West Industrial Area, Accra, Ghana. Phone: +233 30 273 2570. Email: info@aptghana.com. Office hours: Monday–Friday 8am–5pm GMT.",
  warranty:
    "All products come with full manufacturer warranty. Schneider Electric products carry 12–24 month warranty. APT Ghana provides local warranty support and liaises directly with manufacturers for any claims.",
  leadtime:
    "In-stock items ship within 1–3 business days in Accra. Non-stocked items typically arrive in 2–6 weeks depending on manufacturer lead time and shipping mode. Express airfreight options are available for urgent requirements.",
  rfq:
    "Customers can submit a Request for Quote at /rfq on our store. Include the product name, part number, quantity, and any specifications. Our team responds within 4 business hours. For urgent requirements, call us directly.",
  brands:
    "APT Ghana distributes 26+ global industrial brands including Schneider Electric (flagship partner — Partner of Year 2021 & Marketing Excellence 2024), Camozzi, WEG, Festo, Omron, SICK, Siemens, ABB, Parker Hannifin, WAGO, ifm electronic, Phoenix Contact, Pepperl+Fuchs, Endress+Hauser, Eaton, Rittal, SKF, Bosch Rexroth, Danfoss, Murrelektronik, Turck, Balluff, Weidmüller, LAPP, Hikvision, and Legrand.",
  accreditations:
    "APT Ghana is an Official Certified Schneider Electric Distributor (since 2009), Schneider Electric Partner of the Year 2021, and recipient of the Schneider Marketing Excellence Award 2024. We operate ISO-compliant procurement and quality processes.",
  payment:
    "We accept bank transfer, mobile money (MTN Momo, Vodafone Cash), and corporate account credit (for approved customers). Proforma invoice is issued before payment. We do not accept cash for orders above GHS 500.",
  shipping:
    "We deliver within Greater Accra same-day or next-day for in-stock items. National delivery is available via courier partners. For large or heavy items we arrange freight. We also export to neighbouring West African countries.",
};

function buildSystem(pageContext: { pathname?: string } | null) {
  const page = pageContext?.pathname ?? "/";
  return `You are APT Ghana's AI procurement assistant — a specialist in industrial automation, electrical, pneumatic, hydraulic, and mechanical power transmission equipment.

APT Ghana is an authorised distributor for 26+ global industrial brands. We have been Schneider Electric's certified partner since 2009 (Partner of the Year 2021, Marketing Excellence 2024). We are based in Accra, Ghana and serve West Africa.

Your responsibilities:
- Help visitors find the right product from the APT Ghana catalogue for their application
- Answer technical questions about products, specifications, voltage ratings, certifications, and compatibility
- Explain lead times, warranty, pricing process, and how to submit an RFQ
- Guide users through the RFQ process when they need a quote
- Provide information about our brand partners and their product ranges

Current page the user is on: ${page}

Rules:
- Always search the catalogue before recommending a specific product
- When you find products, describe them concisely and include the product link as /products/{slug}
- If you cannot find a product, suggest submitting an RFQ at /rfq
- Keep responses concise and mobile-friendly — use short paragraphs and bullet points
- Be professional and technically accurate
- Never guess at specifications — use the database or acknowledge uncertainty
- If asked about pricing, explain that we issue proforma invoices and the user should submit an RFQ for a formal quote`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, pageContext } = body as {
    messages: unknown[];
    pageContext?: { pathname?: string } | null;
  };

  const modelMessages = await convertToModelMessages(messages as any);

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: buildSystem(pageContext ?? null),
    messages: modelMessages,
    stopWhen: isStepCount(5),
    tools: {
      searchProducts: tool({
        description:
          "Search APT Ghana's product catalogue by keyword, part number, or description. Use this whenever the user asks about a specific product or product type.",
        inputSchema: z.object({
          query: z
            .string()
            .describe("Search keywords, product name, part number, or description"),
          brand: z
            .string()
            .optional()
            .describe("Filter by brand name (e.g. 'Schneider Electric')"),
          limit: z
            .number()
            .optional()
            .default(5)
            .describe("Maximum number of results to return"),
        }),
        execute: async ({ query, brand, limit = 5 }) => {
          try {
            await connectDB();
            const filter: Record<string, unknown> = {
              status: "active",
              $text: { $search: query },
            };
            if (brand) {
              filter.brandName = { $regex: brand, $options: "i" };
            }

            const products = await (ProductModel as any)
              .find(filter, { _score: { $meta: "textScore" } })
              .sort({ _score: { $meta: "textScore" } })
              .limit(Math.min(limit, 8))
              .select(
                "name slug sku shortDescription brandName brandSlug pricing.listPrice pricing.currency categories"
              )
              .lean();

            if (!products.length) {
              return {
                found: false,
                message: `No products found for "${query}"${brand ? ` from ${brand}` : ""}. Consider submitting an RFQ at /rfq.`,
              };
            }

            return {
              found: true,
              count: products.length,
              products: products.map((p: any) => ({
                name: p.name,
                sku: p.sku,
                slug: p.slug,
                href: `/products/${p.slug}`,
                description: p.shortDescription ?? "",
                brand: p.brandName ?? p.brandSlug ?? "",
                category: p.categories?.[0]?.name ?? "",
              })),
            };
          } catch (err) {
            console.error("[chat/searchProducts]", err);
            return { found: false, message: "Search temporarily unavailable." };
          }
        },
      }),

      getBrandInfo: tool({
        description:
          "Get detailed information about a specific brand that APT Ghana distributes — use when the user asks about a brand's products, partnership status, or specialty.",
        inputSchema: z.object({
          slug: z
            .string()
            .describe(
              "Brand slug e.g. 'schneider-electric', 'weg', 'camozzi', 'festo', 'omron'"
            ),
        }),
        execute: async ({ slug }) => {
          try {
            await connectDB();
            const brand = await (BrandModel as any)
              .findOne({ slug, status: "active" })
              .select(
                "name slug country specialty isPartner productCount shortDescription description website founded"
              )
              .lean();

            if (!brand) {
              return {
                found: false,
                message: `Brand "${slug}" not found in our directory.`,
              };
            }

            return {
              found: true,
              name: brand.name,
              country: brand.country ?? "",
              specialty: brand.specialty ?? "",
              isPartner: brand.isPartner ?? false,
              productCount: brand.productCount ?? 0,
              description: brand.shortDescription || brand.description || "",
              href: `/brands/${brand.slug}`,
            };
          } catch (err) {
            console.error("[chat/getBrandInfo]", err);
            return { found: false, message: "Brand lookup temporarily unavailable." };
          }
        },
      }),

      getCompanyInfo: tool({
        description:
          "Get factual information about APT Ghana — use for questions about contact details, warranty, lead times, payment, shipping, brands carried, or company background.",
        inputSchema: z.object({
          topic: z
            .enum([
              "general",
              "contact",
              "warranty",
              "leadtime",
              "rfq",
              "brands",
              "accreditations",
              "payment",
              "shipping",
            ])
            .describe("The topic the user is asking about"),
        }),
        execute: async ({ topic }) => {
          return { topic, content: COMPANY_KNOWLEDGE[topic] ?? COMPANY_KNOWLEDGE.general };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
