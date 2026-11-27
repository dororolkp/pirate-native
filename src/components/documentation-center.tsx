import { useState } from "react";
import { Link } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { useCatalogSearch } from "../hooks/use-catalog-search";
import { useGuidedTour } from "../hooks/use-guided-tour";
import { GUIDE_ARTICLES } from "../lib/workspace-catalog";
import { useLayoutWidth } from "../hooks/use-layout-width";
import { Badge, Button, colors, maximalist, s } from "./ui";
import { WorkspaceBanner } from "./workspace-banner";

export function DocumentationCenter() {
  const search = useCatalogSearch(GUIDE_ARTICLES);
  const [expanded, setExpanded] = useState<string | null>(null);
  const width = useLayoutWidth();
  const tour = useGuidedTour();
  return (
    <View style={s.stack}>
      <WorkspaceBanner
        title="A little clarity. A lot of confidence."
        description="A searchable, self-hosted documentation centre for the React Native workspace. Free, readable and built around the real robot API."
      >
        <View style={s.row}>
          <Button label="Start guided tour" onPress={() => tour?.start()} />
          <Link
            href="/integrations"
            style={[
              s.text,
              { color: maximalist.lime, padding: 14, minHeight: 44 },
            ]}
          >
            Explore free stack studio
          </Link>
        </View>
      </WorkspaceBanner>
      <TextInput
        editable={width > 0}
        accessibilityLabel="Search documentation"
        value={search.query}
        onChangeText={search.setQuery}
        placeholder="Search setup, cancellation, privacy..."
        placeholderTextColor={colors.muted}
        maxLength={120}
        style={s.input}
      />
      <View style={s.row}>
        {["All", "Getting started", "Safety", "Privacy", "Development"].map(
          (category) => (
            <Button
              key={category}
              label={category === "All" ? "All topics" : category}
              selected={search.category === category}
              onPress={() => search.setCategory(category)}
            />
          ),
        )}
        <Button label="Clear documentation search" onPress={search.reset} />
      </View>
      <Text accessibilityLiveRegion="polite" style={s.caption}>
        {search.results.length} guides / Search stays on this device and is
        never tracked.
      </Text>
      {search.results.length === 0 && (
        <Text style={s.text}>
          No matching guides. Clear the filters or try backend, safety or
          privacy.
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: 18,
        }}
      >
        {search.results.map((article, index) => (
          <View
            key={article.id}
            style={{
              flexBasis: width < 900 ? "100%" : "48%",
              flexGrow: 1,
              minWidth: 0,
              padding: 20,
              gap: 12,
              borderWidth: 2,
              borderColor: maximalist.outline,
              borderRadius: 22,
              backgroundColor: [
                maximalist.pink,
                maximalist.teal,
                maximalist.yellow,
                maximalist.lime,
              ][index % 4],
              boxShadow: "4px 5px 0 #34204b",
            }}
          >
            <Badge label={article.category.toUpperCase()} />
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={s.panelTitle}
            >
              {article.title}
            </Text>
            <Text style={s.text}>{article.summary}</Text>
            <Button
              label={`${expanded === article.id ? "Close" : "Read"} ${article.title}`}
              expanded={expanded === article.id}
              onPress={() =>
                setExpanded(expanded === article.id ? null : article.id)
              }
            />
            {expanded === article.id && (
              <Text
                style={[
                  s.text,
                  {
                    padding: 14,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                  },
                ]}
              >
                {article.body}
              </Text>
            )}
          </View>
        ))}
      </View>
      <View style={s.row}>
        <Link
          href="https://github.com/dororolkp/pirate-native/blob/main/docs/FRONTEND_GUIDE.md"
          style={[s.text, { padding: 14, minHeight: 44 }]}
        >
          Full button and setup reference (GitHub)
        </Link>
        <Link
          href="https://github.com/davidcheungo123/ros_backend"
          style={[s.text, { padding: 14, minHeight: 44 }]}
        >
          David&apos;s backend source (GitHub)
        </Link>
      </View>
      <Text style={s.caption}>
        External references leave this app. No documentation SaaS, third-party
        search script or chat widget is embedded.
      </Text>
    </View>
  );
}
