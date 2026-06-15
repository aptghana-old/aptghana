import * as React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { BusinessDocumentData, ExportData } from "../types";
import { BusinessDocument } from "./business-document";
import { TableReport } from "./table-report";

// Wrapper components ultimately render a <Document>, which is what
// renderToBuffer requires — the cast bridges react-pdf's element typing.
type DocElement = React.ReactElement<DocumentProps>;

/** Render a single business document (quote/order/invoice/receipt) to PDF bytes. */
export async function renderBusinessDocument(data: BusinessDocumentData): Promise<Buffer> {
  return renderToBuffer(React.createElement(BusinessDocument, { data }) as unknown as DocElement);
}

/** Render a bulk tabular report to PDF bytes. */
export async function renderTableReport(data: ExportData): Promise<Buffer> {
  return renderToBuffer(React.createElement(TableReport, { data }) as unknown as DocElement);
}
