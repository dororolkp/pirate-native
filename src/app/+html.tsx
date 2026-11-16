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
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
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
