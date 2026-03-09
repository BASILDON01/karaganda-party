import type { MetadataRoute } from "next";
import { getParties } from "@/lib/parties-store";
import { getAllOrganizers } from "@/lib/organizers-store";

const BASE_URL = "https://factorkz.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const parties = getParties();
  const organizers = getAllOrganizers();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/all`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/calendar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/docs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/create-party`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/organizers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/cookie`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  const partyPages: MetadataRoute.Sitemap = parties.map((party) => ({
    url: `${BASE_URL}/party/${party.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const organizerPages: MetadataRoute.Sitemap = organizers.map((org) => ({
    url: `${BASE_URL}/organizer/${org.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...partyPages, ...organizerPages];
}
