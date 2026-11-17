
import type {
  BusinessCategory,
  ExportRequirementCategory,
  ExportRequirementPriority,
} from "@/app/generated/prisma/client";

export interface ExportRequirementDefinition {
  id: string;
  title: string;
  description: string;
  category: ExportRequirementCategory;
  priority: ExportRequirementPriority;
  countryCode: string;
  originCountryCode: string;
  productCategory: BusinessCategory | null;
  applicability: string;
  sourceName: string;
  sourceUrl: string;
}

const DGFT_SOURCE =
  "https://content.dgft.gov.in/Website/dgftprod/0b7f61b2-2f58-4cb5-9f54-22df36426a0f/%5BUPDATED%5D%20CHAPTER%202%20OF%20FTP.pdf";

const destinations = ["AE", "GB", "US"] as const;

const indianExportRequirements: ExportRequirementDefinition[] =
  destinations.flatMap((countryCode) => [
    {
      id: `${countryCode.toLowerCase()}-india-iec`,
      title: "Obtain or verify your Importer-Exporter Code (IEC)",
      description:
        "An IEC is generally required to export goods from India. Verify that your business has an active IEC before arranging a commercial export. Specific exemptions may apply under the Foreign Trade Policy.",
      category: "EXPORT_REGISTRATION",
      priority: "REQUIRED",
      countryCode,
      originCountryCode: "IN",
      productCategory: null,
      applicability:
        "For exports of goods from India, subject to applicable IEC exemptions.",
      sourceName: "Directorate General of Foreign Trade (DGFT)",
      sourceUrl: DGFT_SOURCE,
    },
    {
      id: `${countryCode.toLowerCase()}-india-export-documents`,
      title: "Prepare the core export documents",
      description:
        "Prepare the applicable transport document (such as a bill of lading or airway bill), commercial invoice cum packing list, and shipping bill or bill of export. The exact documents depend on the shipment and transport method.",
      category: "DOCUMENTATION",
      priority: "REQUIRED",
      countryCode,
      originCountryCode: "IN",
      productCategory: null,
      applicability:
        "Core documents for goods exported from India. Confirm the exact document set with your customs broker and carrier.",
      sourceName: "Directorate General of Foreign Trade (DGFT)",
      sourceUrl: DGFT_SOURCE,
    },
    {
      id: `${countryCode.toLowerCase()}-destination-import-check`,
      title: "Confirm destination-country import requirements",
      description:
        "Ask your destination-country importer or customs broker to confirm product-specific permits, standards, labelling rules and any additional documents before shipping. Requirements can vary by product and shipment.",
      category: "PRODUCT_COMPLIANCE",
      priority: "INFORMATIONAL",
      countryCode,
      originCountryCode: "IN",
      productCategory: null,
      applicability:
        "Confirm requirements for the exact product, materials, intended use and destination before accepting an order.",
      sourceName: "Directorate General of Foreign Trade (DGFT)",
      sourceUrl: DGFT_SOURCE,
    },
  ]);

const textileCategories: BusinessCategory[] = [
  "HANDLOOM",
  "APPAREL",
];

const ukTextileRequirements: ExportRequirementDefinition[] =
  textileCategories.map((productCategory) => ({
    id: `gb-${productCategory.toLowerCase()}-fibre-label`,
    title: "Check textile fibre-content labelling",
    description:
      "Textile products placed on the market in England, Scotland and Wales must show their fibre content. Where a product has multiple components with different fibre contents, the content of each must be shown.",
    category: "PACKAGING_LABELING",
    priority: "REQUIRED",
    countryCode: "GB",
    originCountryCode: "IN",
    productCategory,
    applicability:
      "For covered textile products sold in England, Scotland and Wales. Check separate rules and arrangements where goods are placed on the Northern Ireland market.",
    sourceName: "UK Government — Textile labelling",
    sourceUrl: "https://www.gov.uk/guidance/textile-labelling",
  }));

const usTextileRequirements: ExportRequirementDefinition[] =
  textileCategories.map((productCategory) => ({
    id: `us-${productCategory.toLowerCase()}-textile-label`,
    title: "Check US textile product labelling",
    description:
      "Most covered textile products require labels disclosing fibre content, country of origin, and the identity of the manufacturer or another responsible business. Confirm product coverage, exemptions and the applicable label details before shipment.",
    category: "PACKAGING_LABELING",
    priority: "REQUIRED",
    countryCode: "US",
    originCountryCode: "IN",
    productCategory,
    applicability:
      "For most products covered by the US Textile Fiber Products Identification Act and related rules. Product-specific exemptions may apply.",
    sourceName: "US Federal Trade Commission (FTC)",
    sourceUrl:
      "https://www.ftc.gov/business-guidance/resources/threading-your-way-through-labeling-requirements-under-textile-wool-acts",
  }));

export const EXPORT_REQUIREMENTS: ExportRequirementDefinition[] = [
  ...indianExportRequirements,
  ...ukTextileRequirements,
  ...usTextileRequirements,
];
