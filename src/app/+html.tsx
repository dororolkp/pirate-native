import { PropsWithChildren } from "react";
import {
  ScrollViewStyleReset,
  useServerDocumentContext,
} from "expo-router/html";
import { siteStructuredData } from "../lib/site-metadata";

export default function RootHtml({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } =
    useServerDocumentContext();
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ScrollViewStyleReset />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteStructuredData()).replace(
              /</g,
              "\\u003c",
            ),
          }}
        />
        {headNodes}
        <style>{`
          :focus-visible { outline: 3px solid #443c91 !important; outline-offset: 3px; }
          .skip-link { position: fixed; top: -100px; left: 16px; z-index: 9999; padding: 14px 20px; border-radius: 10px; color: white; background: #443c91; font: 600 14px system-ui; }
          .skip-link:focus { top: 16px; }
          /* Uiverse-inspired sheen and offset-card interaction. See THIRD_PARTY_NOTICES.md. */
          [data-ui="button"] { position: relative; overflow: hidden; transition: border-color 160ms ease, box-shadow 160ms ease; }
          [data-ui="button"][data-variant="regular"]::after {
            content: ""; position: absolute; inset: 0; pointer-events: none;
            background: linear-gradient(120deg, transparent 25%, #ffffff45 50%, transparent 75%);
            transform: translateX(-120%); transition: transform 450ms ease;
          }
          [data-ui="button"][data-variant="regular"]:not([aria-disabled="true"]):focus-visible::after { transform: translateX(120%); }
          #main-content { background-image: radial-gradient(#8053a51c 1px, transparent 1px); background-size: 18px 18px; }
          [data-testid="maximalist-hero"] {
            background-image: radial-gradient(circle at 85% 20%, #ad54e766, transparent 45%), linear-gradient(135deg, #5020a0, #39116f);
          }
          [data-ui="panel"] { box-shadow: 5px 6px 0 #e4c9ee; }
          [data-ui="metric"] { position: relative; overflow: hidden; box-shadow: 4px 5px 0 #34204b; }
          [data-guide-highlight="true"] { outline: 4px solid #5020a0 !important; outline-offset: 3px; }
          @media (hover: hover) {
            [data-ui="button"][data-variant="regular"]:not([aria-disabled="true"]):hover { border-color: #7664c5; }
            [data-ui="button"][data-variant="regular"]:not([aria-disabled="true"]):hover::after { transform: translateX(120%); }
          }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
            [data-ui="button"]::after { display: none; }
          }
        `}</style>
      </head>
      <body {...bodyAttributes}>
        <a href="#main-content" className="skip-link">
          Skip to workspace
        </a>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
