import { StyleSheet } from "@react-pdf/renderer";

/* Brand tokens for PDFs — mirrors the platform's navy/green identity. */
export const PDF = {
  navy: "#0a1628",
  blue: "#0057b8",
  green: "#1a7a4a",
  text: "#111827",
  muted: "#6b7280",
  faint: "#9ca3af",
  border: "#e5e7eb",
  raised: "#f3f4f6",
  white: "#ffffff",
  amber: "#92400e",
  amberBg: "#fef3c7",
  greenBg: "#dcfce7",
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: PDF.text,
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 64,
  },

  /* Header */
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: PDF.navy, letterSpacing: 0.5 },
  brandAccent: { color: PDF.green },
  brandLegal: { fontSize: 8, color: PDF.muted, marginTop: 2 },
  brandContact: { fontSize: 7.5, color: PDF.faint, marginTop: 6, lineHeight: 1.5 },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: PDF.navy, textAlign: "right", textTransform: "uppercase", letterSpacing: 1 },
  docNumber: { fontSize: 10, fontFamily: "Helvetica-Bold", color: PDF.blue, textAlign: "right", marginTop: 4 },
  docMeta: { fontSize: 8, color: PDF.muted, textAlign: "right", marginTop: 2, lineHeight: 1.5 },

  hr: { borderBottomWidth: 2, borderBottomColor: PDF.navy, marginTop: 14, marginBottom: 14 },

  /* Status chip */
  chip: {
    alignSelf: "flex-end",
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* Parties */
  partiesRow: { flexDirection: "row", gap: 24, marginBottom: 16 },
  partyCol: { flex: 1 },
  partyLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: PDF.faint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  partyName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: PDF.text, marginBottom: 2 },
  partyLine: { fontSize: 8.5, color: PDF.muted, lineHeight: 1.5 },

  /* Items table */
  th: {
    flexDirection: "row",
    backgroundColor: PDF.navy,
    color: PDF.white,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: PDF.border,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  trAlt: { backgroundColor: "#fafafa" },
  cellName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: PDF.text },
  cellSub: { fontSize: 7.5, color: PDF.faint, marginTop: 1.5 },
  cellNote: { fontSize: 7.5, color: PDF.muted, marginTop: 2, fontFamily: "Helvetica-Oblique" },
  cellNum: { fontSize: 9, textAlign: "right" },

  /* Totals */
  totalsBlock: { alignSelf: "flex-end", width: 220, marginTop: 12 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsLabel: { fontSize: 8.5, color: PDF.muted },
  totalsValue: { fontSize: 8.5, color: PDF.text },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 8,
    backgroundColor: PDF.navy,
    borderRadius: 3,
  },
  grandLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: PDF.white },
  grandValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: PDF.white },

  /* Info boxes */
  box: { borderWidth: 1, borderColor: PDF.border, borderRadius: 4, padding: 10, marginTop: 14 },
  boxTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: PDF.faint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  boxText: { fontSize: 8.5, color: PDF.muted, lineHeight: 1.5 },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: PDF.border,
    paddingTop: 8,
  },
  footerTerms: { fontSize: 6.5, color: PDF.faint, lineHeight: 1.5 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  footerBrand: { fontSize: 7, color: PDF.muted, fontFamily: "Helvetica-Bold" },
  footerPage: { fontSize: 7, color: PDF.faint },
});
