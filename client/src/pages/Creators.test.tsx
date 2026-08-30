import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en" }),
}));

import Creators from "./Creators";

describe("Creators page", () => {
  it("renders the three named creators and the free/useful community mission", () => {
    const html = renderToStaticMarkup(<Creators />);

    expect(html).toContain("Dana Gailan");
    expect(html).toContain("Amad Shekha");
    expect(html).toContain("Hazim Ali");
    expect(html).toContain("We are trying to create a community where everything is free and useful.");
  });

  it("keeps the supplied Telegram and Instagram links as external destinations", () => {
    const html = renderToStaticMarkup(<Creators />);

    expect(html).toContain('href="https://t.me/NovaTechKrdd"');
    expect(html).toContain('href="https://www.instagram.com/novatech.krd/"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
  });

  it("renders each creator with a personal statement", () => {
    const html = renderToStaticMarkup(<Creators />);

    expect(html).toContain("creator-statement");
    expect(html).toContain("We build quiet things");
    expect(html).toContain("A good interface disappears");
    expect(html).toContain("Simple systems, honest code");
  });

  it("renders the translated people section heading", () => {
    const html = renderToStaticMarkup(<Creators />);

    expect(html).toContain("Three perspectives.");
    expect(html).toContain("One open signal.");
  });

  it("shows the NovaTech KRD attribution in the footer", () => {
    const html = renderToStaticMarkup(<Creators />);

    expect(html).toContain("2026 NovaTech KRD");
    expect(html).toContain("Kurdistan, Iraq");
  });

  it("renders the decorative art image in the hero", () => {
    const html = renderToStaticMarkup(<Creators />);

    expect(html).toContain("/creators-art.png");
    expect(html).toContain("Anonymous by design");
  });
});
