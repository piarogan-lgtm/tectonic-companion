import { useState } from "react";
import { queryServer } from "./api";

type PrecedentCard = {
  name: string;
  architect: string;
  image: string;
};

function App() {
  const [detail, setDetail] = useState("");
  const [projectType, setProjectType] = useState("");
  const [location, setLocation] = useState("");
  const [climate, setClimate] = useState("");
  const [structure, setStructure] = useState("");
  const [materialPalette, setMaterialPalette] = useState("");
  const [designIntent, setDesignIntent] = useState("");
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQueryGuide, setShowQueryGuide] = useState(false);

  const [precedentCards, setPrecedentCards] = useState<PrecedentCard[]>([]);

  async function handleGenerate() {
    if (!detail.trim()) return;

    const fullPrompt = `
Detail:
${detail}

Project Type:
${projectType}

Location:
${location}

Climate:
${climate}

Structure:
${structure}

Material Palette:
${materialPalette}

Design Intent:
${designIntent}
    `.trim();

    setLoading(true);
    setResponseText("");
    setPrecedentCards([]);

    try {
      const data = await queryServer(fullPrompt);
      setResponseText(data.reply);
      setPrecedentCards(data.precedents || []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error contacting server.";
      setResponseText(message);
      setPrecedentCards([]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function getQueryFeedback() {
    const trimmedDetail = detail.trim();
    const trimmedProjectType = projectType.trim();
    const trimmedLocation = location.trim();
    const trimmedClimate = climate.trim();
    const trimmedStructure = structure.trim();
    const trimmedMaterialPalette = materialPalette.trim();
    const trimmedDesignIntent = designIntent.trim();

    let score = 0;
    const tips: string[] = [];
    const examples: string[] = [];

    const combinedText =
      `${trimmedDetail} ${trimmedProjectType} ${trimmedLocation} ${trimmedClimate} ${trimmedStructure} ${trimmedMaterialPalette} ${trimmedDesignIntent}`.toLowerCase();

    const hasNamedDetailType =
      /\b(threshold|junction|roof edge|window head|window sill|deck junction|cladding interface|screen|opening|flashing|fascia|gutter|plinth|base|wall base|stair|balustrade|track|door head|door sill|door threshold|wall to roof|deck to wall)\b/i.test(
        trimmedDetail
      );

    const hasPreciseJunctionLanguage =
      /\b(between|meeting|at the base of|at the head of|onto|to|against|interface|transition|meeting a|meeting an)\b/i.test(
        trimmedDetail
      );

    const hasTechnicalIssue =
      /\b(drainage|moisture|water|water ingress|weathering|durability|flashing|fall|drip|ventilation|movement|corrosion|salt air|wind-driven rain|ponding|overflow|splashback|end grain|level change|sealant|threshold track|concealed drainage|minimal visible flashing)\b/i.test(
        combinedText
      );

    const hasArchitecturalIntent =
      /\b(refined|expressed|minimal|robust|tectonic|quiet|lightweight|layered|durable|honest|smooth transition|seamless|clear datum|shadow gap|thin profile|concealed drainage|minimal visible flashing|refined transition|expressed threshold)\b/i.test(
        trimmedDesignIntent
      );

    if (trimmedDetail.length >= 45) {
      score += 2;
    } else if (trimmedDetail.length >= 20) {
      score += 1;
      tips.push(
        "Make the Detail field more specific by describing the exact junction more precisely."
      );
    } else if (trimmedDetail.length > 0) {
      tips.push(
        "The Detail field is too brief. Name the exact junction or edge condition more clearly."
      );
    } else {
      tips.push(
        "Start by describing the exact detail condition, for example: 'Sliding door threshold between internal concrete slab and external timber deck.'"
      );
    }

    if (hasNamedDetailType) {
      score += 2;
    } else if (trimmedDetail.length > 0) {
      tips.push(
        "Name the exact detail type, such as threshold, roof edge, wall base, window head, deck junction, or cladding interface."
      );
    }

    if (hasPreciseJunctionLanguage) {
      score += 1;
    } else if (trimmedDetail.length > 0) {
      tips.push(
        "Describe how materials or elements meet, for example: 'between internal concrete slab and external deck' or 'timber cladding meeting sandstone plinth'."
      );
    }

    if (trimmedClimate) {
      score += 1;
    } else {
      tips.push(
        "Add Climate so the advice can respond to rain, coastal exposure, heat, wind, or thermal performance."
      );
    }

    if (trimmedStructure) {
      score += 1;
    } else {
      tips.push(
        "Add Structure so the advice can align with how the detail is actually built."
      );
    }

    if (trimmedMaterialPalette) {
      score += 1;
    } else {
      tips.push(
        "Add Material Palette so the response can address movement, weathering, fixing strategy, and material hierarchy."
      );
    }

    if (!trimmedLocation) {
      tips.push(
        "Add Location so the response can better frame NCC relevance and environmental conditions."
      );
    }

    if (!trimmedProjectType) {
      tips.push(
        "Add Project Type so the advice can better reflect the broader design context."
      );
    }

    if (hasArchitecturalIntent) {
      score += 2;
    } else if (trimmedDesignIntent) {
      score += 1;
      tips.push(
        "Strengthen the Design Intent by describing the architectural quality more precisely, for example: refined, lightweight, expressed, quiet, robust, or layered."
      );
    } else {
      tips.push(
        "Add Design Intent so the response can balance technical performance with the architectural expression you want."
      );
    }

    if (hasTechnicalIssue) {
      score += 2;
    } else if (trimmedDetail || trimmedDesignIntent) {
      tips.push(
        "Mention the main technical challenge, for example: drainage, water ingress, corrosion, splashback, movement, or durability."
      );
    }

    if (score <= 4) {
      examples.push(
        "Example: 'Sliding door threshold between internal concrete slab and external spotted gum deck for a coastal NSW house. Timber-framed construction. I want a minimal level change, concealed drainage, durable weather protection, and a refined expressed threshold.'"
      );
      examples.push(
        "Example: 'Timber cladding meeting sandstone plinth at wall base in a temperate climate. Blackbutt cladding, stainless steel flashing, timber frame. I want a clear horizontal datum, splashback protection, and a refined heavy-to-light material transition.'"
      );
    } else if (score <= 8) {
      examples.push(
        "To strengthen this query, add the likely failure point or technical challenge, for example: wind-driven rain, exposed end grain, gutter overflow risk, corrosion, or trapped moisture."
      );
      examples.push(
        "You can also sharpen the architectural intent, for example: 'thin roof edge', 'expressed frame', 'quiet junction', 'shadow-gap transition', or 'minimal visible flashing'."
      );
    } else {
      examples.push(
        "Your query is already strong. To make it even better, add sequencing or construction priorities, for example: 'easy to build', 'avoid sealant reliance', 'allow for timber movement', or 'coordinate flashing before cladding installation'."
      );
    }

    const qualifiesForStrong =
      score >= 9 &&
      hasNamedDetailType &&
      hasArchitecturalIntent &&
      hasTechnicalIssue;

    let appraisal = "Strong";

    if (score <= 4) {
      appraisal = "Needs more detail";
    } else if (!qualifiesForStrong) {
      appraisal = "Good, but could be sharper";
    }

    return { score, appraisal, tips, examples };
  }

  function renderQueryGuide() {
    return (
      <div style={styles.queryGuideBox}>
        <div style={styles.queryGuideTitle}>
          How to formulate strong design queries
        </div>
        <div style={styles.queryGuideContent}>
          A strong query usually includes:
          {"\n\n"}
          1. The exact detail or junction
          {"\n"}
          Example: window head, roof edge, threshold, wall base, deck junction
          {"\n\n"}
          2. The construction system
          {"\n"}
          Example: timber frame, concrete slab, masonry wall, steel structure
          {"\n\n"}
          3. The material palette
          {"\n"}
          Example: spotted gum, zinc, sandstone, stainless steel
          {"\n\n"}
          4. The environmental context
          {"\n"}
          Example: coastal, high rainfall, alpine, temperate, wind-driven rain
          {"\n\n"}
          5. The architectural intent
          {"\n"}
          Example: refined, expressed, minimal, durable, layered, lightweight
          {"\n\n"}
          6. The performance issue
          {"\n"}
          Example: drainage, moisture control, movement, weathering, durability
          {"\n\n"}
          Strong example:
          {"\n"}
          "Sliding door threshold between internal concrete slab and external timber deck in coastal NSW. Aluminium frame, spotted gum decking, stainless steel fixings. I want a seamless indoor-outdoor transition with minimal level change, clear drainage, and long-term durability."
        </div>
      </div>
    );
  }

  function renderQueryTipsBox() {
    const feedback = getQueryFeedback();

    return (
      <details style={styles.queryTipsDetails}>
        <summary style={styles.queryTipsSummary}>
          Get design query tips
          <span style={styles.queryTipsBadge}>{feedback.appraisal}</span>
        </summary>

        <div style={styles.queryTipsContent}>
          <div style={styles.queryTipsSectionTitle}>Query appraisal</div>
          <div style={styles.queryTipsText}>
            {feedback.appraisal} query formulation.
          </div>

          {feedback.tips.length > 0 && (
            <>
              <div style={styles.queryTipsSectionTitle}>
                How to improve this query
              </div>
              <div style={styles.queryTipsText}>
                {feedback.tips.map((tip, index) => (
                  <div key={index} style={styles.queryTipItem}>
                    • {tip}
                  </div>
                ))}
              </div>
            </>
          )}

          {feedback.examples.length > 0 && (
            <>
              <div style={styles.queryTipsSectionTitle}>Helpful examples</div>
              <div style={styles.queryTipsText}>
                {feedback.examples.map((example, index) => (
                  <div key={index} style={styles.queryTipItem}>
                    • {example}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </details>
    );
  }

  function renderNccSection(content: string) {
    const primaryLabel = "PRIMARY NCC REQUIREMENTS";
    const practicalLabel = "PRACTICAL MEANING";
    const moreLabel = "MORE NCC REFERENCES";

    const primaryIndex = content.indexOf(primaryLabel);
    const practicalIndex = content.indexOf(practicalLabel);
    const moreIndex = content.indexOf(moreLabel);

    if (primaryIndex === -1 || practicalIndex === -1 || moreIndex === -1) {
      return <div style={styles.sectionContent}>{content}</div>;
    }

    const primaryContent = content
      .slice(primaryIndex + primaryLabel.length, practicalIndex)
      .trim();

    const practicalContent = content
      .slice(practicalIndex + practicalLabel.length, moreIndex)
      .trim();

    const moreContent = content
      .slice(moreIndex + moreLabel.length)
      .trim();

    return (
      <div>
        <div style={styles.sectionContent}>{primaryContent}</div>

        <div style={styles.nccPracticalBox}>
          <div style={styles.nccPracticalTitle}>Practical meaning</div>
          <div style={styles.nccPracticalContent}>{practicalContent}</div>
        </div>

        <details style={styles.nccDetails}>
          <summary style={styles.nccSummary}>More NCC references</summary>
          <div style={styles.nccExpandedContent}>{moreContent}</div>
        </details>
      </div>
    );
  }

  function renderResponseSections(text: string) {
    if (!text) {
      return (
        <div style={styles.placeholderBox}>
          Your response will appear here.
        </div>
      );
    }

    const sectionTitles = [
      "1. NCC REQUIREMENTS",
      "2. RELEVANT PRECEDENTS",
      "3. MATERIAL STRATEGIES",
      "4. DETAILING APPROACH",
      "5. LEARNING INSIGHT"
    ];

    const sections: { title: string; content: string }[] = [];

    for (let i = 0; i < sectionTitles.length; i++) {
      const currentTitle = sectionTitles[i];
      const nextTitle = sectionTitles[i + 1];

      const startIndex = text.indexOf(currentTitle);
      if (startIndex === -1) continue;

      const contentStart = startIndex + currentTitle.length;
      const endIndex = nextTitle ? text.indexOf(nextTitle) : text.length;

      const content = text
        .slice(contentStart, endIndex === -1 ? text.length : endIndex)
        .trim();

      sections.push({
        title: currentTitle.replace(/^\d+\.\s*/, ""),
        content
      });
    }

    if (sections.length === 0) {
      return <div style={styles.responseBox}>{text}</div>;
    }

    return (
      <div style={styles.sectionsWrapper}>
        {sections.map((section) => (
          <div key={section.title} style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>{section.title}</h3>
            {section.title === "NCC REQUIREMENTS" ? (
              renderNccSection(section.content)
            ) : (
              <div style={styles.sectionContent}>{section.content}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>Architectural Learning Companion</p>
            <h1 style={styles.title}>Tectonic Companion</h1>
            <p style={styles.subtitle}>
              A design support tool for detailed architectural thinking,
              precedent guidance, material awareness, and NCC-oriented design
              decisions.
            </p>
          </div>
        </header>

        <div style={styles.mainGrid}>
          <section style={styles.leftPanel}>
            <div style={styles.card}>
              <div style={styles.designQueryHeader}>
                <h2 style={styles.cardTitle}>Design Query</h2>
                <button
                  type="button"
                  onClick={() => setShowQueryGuide(!showQueryGuide)}
                  style={styles.helpButton}
                  aria-label="How to formulate strong design queries"
                  title="How to formulate strong design queries"
                >
                  ?
                </button>
              </div>

              <p style={styles.cardIntro}>
                Describe the detail you are working on as clearly as possible.
              </p>

              {showQueryGuide && renderQueryGuide()}

              <label style={styles.label}>Detail</label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={6}
                style={styles.textarea}
                placeholder="Example: External sliding door threshold between interior concrete slab and spotted gum deck for a coastal house"
              />

              <div style={styles.fieldGrid}>
                <div>
                  <label style={styles.label}>Project Type</label>
                  <input
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    style={styles.input}
                    placeholder="Residential alteration / new build"
                  />
                </div>

                <div>
                  <label style={styles.label}>Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={styles.input}
                    placeholder="Victoria / NSW / Queensland"
                  />
                </div>

                <div>
                  <label style={styles.label}>Climate</label>
                  <input
                    value={climate}
                    onChange={(e) => setClimate(e.target.value)}
                    style={styles.input}
                    placeholder="Coastal / temperate / alpine"
                  />
                </div>

                <div>
                  <label style={styles.label}>Structure</label>
                  <input
                    value={structure}
                    onChange={(e) => setStructure(e.target.value)}
                    style={styles.input}
                    placeholder="Timber frame / steel / masonry"
                  />
                </div>
              </div>

              <label style={styles.label}>Material Palette</label>
              <input
                value={materialPalette}
                onChange={(e) => setMaterialPalette(e.target.value)}
                style={styles.input}
                placeholder="Spotted gum, zinc, concrete"
              />

              <label style={styles.label}>Design Intent</label>
              <textarea
                value={designIntent}
                onChange={(e) => setDesignIntent(e.target.value)}
                rows={4}
                style={styles.textarea}
                placeholder="Expressed timber joinery, minimal visible flashing, refined threshold transition"
              />

              {renderQueryTipsBox()}

              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  ...styles.button,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Generating..." : "Generate Guidance"}
              </button>
            </div>
          </section>

          <section style={styles.rightPanel}>
            <div style={styles.card}>
              <div style={styles.resultsHeader}>
                <h2 style={styles.cardTitle}>Design Guidance</h2>
                <span style={styles.resultsTag}>Structured Output</span>
              </div>

              {renderResponseSections(responseText)}

              {precedentCards.length > 0 && (
                <div style={styles.precedentGallery}>
                  <h3 style={styles.galleryTitle}>Referenced Precedents</h3>
                  <div style={styles.precedentGrid}>
                    {precedentCards.map((precedent) => (
                      <div key={precedent.name} style={styles.precedentCard}>
                        <img
                          src={precedent.image}
                          alt={precedent.name}
                          style={styles.precedentImage}
                        />
                        <div style={styles.precedentMeta}>
                          <div style={styles.precedentName}>
                            {precedent.name}
                          </div>
                          <div style={styles.precedentArchitect}>
                            {precedent.architect}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f1e8",
    color: "#1f1f1b",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "32px 20px"
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto"
  },
  header: {
    marginBottom: "28px"
  },
  kicker: {
    margin: "0 0 8px 0",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "#7a6f5a"
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "42px",
    lineHeight: 1.1,
    fontWeight: 700
  },
  subtitle: {
    margin: 0,
    maxWidth: "840px",
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#4e4a42"
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.1fr",
    gap: "24px",
    alignItems: "start"
  },
  leftPanel: {},
  rightPanel: {},
  card: {
    backgroundColor: "#fbf8f2",
    border: "1px solid #ddd4c5",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 8px 30px rgba(60, 52, 38, 0.06)"
  },
  designQueryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px"
  },
  helpButton: {
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    border: "1px solid #cfc5b5",
    backgroundColor: "#fffdf9",
    color: "#6b5a45",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: 1
  },
  cardTitle: {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: 650
  },
  cardIntro: {
    margin: "0 0 20px 0",
    fontSize: "14px",
    color: "#5f5a50",
    lineHeight: 1.5
  },
  label: {
    display: "block",
    marginBottom: "8px",
    marginTop: "16px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#514b40"
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cfc5b5",
    backgroundColor: "#fffdf9",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none"
  },
  textarea: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #cfc5b5",
    backgroundColor: "#fffdf9",
    fontSize: "14px",
    lineHeight: 1.5,
    boxSizing: "border-box",
    resize: "vertical",
    outline: "none"
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "4px"
  },
  button: {
    marginTop: "22px",
    width: "100%",
    padding: "14px 18px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#6f5c46",
    color: "#fffaf2",
    fontSize: "15px",
    fontWeight: 600
  },
  resultsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px"
  },
  resultsTag: {
    fontSize: "12px",
    padding: "6px 10px",
    borderRadius: "999px",
    backgroundColor: "#ebe2d2",
    color: "#6a5a46",
    fontWeight: 600
  },
  placeholderBox: {
    minHeight: "220px",
    borderRadius: "14px",
    border: "1px dashed #cfc5b5",
    backgroundColor: "#fffdf9",
    padding: "20px",
    color: "#7a746a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center"
  },
  responseBox: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
    color: "#2d2a25"
  },
  sectionsWrapper: {
    display: "grid",
    gap: "14px"
  },
  sectionCard: {
    border: "1px solid #ded5c8",
    borderRadius: "14px",
    padding: "18px",
    backgroundColor: "#fffdf9"
  },
  sectionTitle: {
    margin: "0 0 10px 0",
    fontSize: "14px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#6b5a45"
  },
  sectionContent: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.65,
    fontSize: "15px",
    color: "#2c2924"
  },
  nccPracticalBox: {
    marginTop: "16px",
    backgroundColor: "#f8f3ea",
    border: "1px solid #e1d6c6",
    borderRadius: "12px",
    padding: "14px"
  },
  nccPracticalTitle: {
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#6b5a45",
    marginBottom: "8px"
  },
  nccPracticalContent: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.65,
    fontSize: "14px",
    color: "#3a352f"
  },
  nccDetails: {
    marginTop: "16px",
    borderTop: "1px solid #e6ddcf",
    paddingTop: "14px"
  },
  nccSummary: {
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    color: "#6b5a45",
    listStyle: "none"
  },
  nccExpandedContent: {
    marginTop: "12px",
    whiteSpace: "pre-wrap",
    lineHeight: 1.65,
    fontSize: "14px",
    color: "#3a352f",
    backgroundColor: "#f8f3ea",
    border: "1px solid #e1d6c6",
    borderRadius: "12px",
    padding: "14px"
  },
  precedentGallery: {
    marginTop: "24px"
  },
  galleryTitle: {
    margin: "0 0 14px 0",
    fontSize: "16px",
    color: "#6b5a45",
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  },
  precedentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "14px"
  },
  precedentCard: {
    border: "1px solid #ded5c8",
    borderRadius: "14px",
    overflow: "hidden",
    backgroundColor: "#fffdf9"
  },
  precedentImage: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    display: "block"
  },
  precedentMeta: {
    padding: "12px"
  },
  precedentName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#2c2924",
    marginBottom: "4px"
  },
  precedentArchitect: {
    fontSize: "13px",
    color: "#6f685c"
  },
  queryGuideBox: {
    marginBottom: "18px",
    padding: "16px",
    borderRadius: "12px",
    backgroundColor: "#f8f3ea",
    border: "1px solid #e1d6c6"
  },
  queryGuideTitle: {
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#6b5a45",
    marginBottom: "10px"
  },
  queryGuideContent: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.65,
    fontSize: "14px",
    color: "#3a352f"
  },
  queryTipsDetails: {
    marginTop: "16px",
    borderTop: "1px solid #e6ddcf",
    paddingTop: "14px"
  },
  queryTipsSummary: {
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    color: "#6b5a45",
    listStyle: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px"
  },
  queryTipsBadge: {
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "999px",
    backgroundColor: "#ebe2d2",
    color: "#6a5a46",
    fontWeight: 600
  },
  queryTipsContent: {
    marginTop: "12px",
    whiteSpace: "pre-wrap",
    lineHeight: 1.65,
    fontSize: "14px",
    color: "#3a352f",
    backgroundColor: "#f8f3ea",
    border: "1px solid #e1d6c6",
    borderRadius: "12px",
    padding: "14px"
  },
  queryTipsSectionTitle: {
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#6b5a45",
    marginTop: "4px",
    marginBottom: "8px"
  },
  queryTipsText: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.65,
    fontSize: "14px",
    color: "#3a352f"
  },
  queryTipItem: {
    marginBottom: "8px"
  }
};

export default App;