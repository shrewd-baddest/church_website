import PDFDocument from "pdfkit";

export function generateStampCardPdf({ memberName, memberId, jumuiyaName, amount, semesterLabel }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const pageWidth = doc.page.width - 80;

      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke("#16a34a");

      // Header
      doc.fontSize(20).font("Helvetica-Bold").fillColor("#16a34a").text("SEMESTER STAMP CARD", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("Campus Catholic Community", { align: "center" });
      doc.moveDown(0.8);

      // Separator
      doc.moveTo(40, doc.y).lineTo(pageWidth + 40, doc.y).stroke("#e2e8f0");
      doc.moveDown(0.8);

      // Member Details
      const leftX = 60;
      let yPos = doc.y;

      doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e293b");
      doc.text("Member Details", leftX, yPos);
      doc.moveDown(0.5);

      const details = [
        ["Member Name:", memberName],
        ["Registration No:", memberId],
        ["Community:", jumuiyaName],
        ["Semester:", semesterLabel || "Current Semester"],
        ["Amount Paid:", `KES ${amount || 0}`],
        ["Date:", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
      ];

      doc.font("Helvetica").fillColor("#475569").fontSize(10);
      for (const [label, value] of details) {
        doc.text(`${label}  ${value}`, leftX, doc.y, { continued: false });
        doc.moveDown(0.3);
      }

      // Stamp box
      doc.moveDown(1);
      doc.moveTo(40, doc.y).lineTo(pageWidth + 40, doc.y).stroke("#e2e8f0");
      doc.moveDown(0.8);

      doc.fontSize(12).font("Helvetica-Bold").fillColor("#1e293b").text("STAMP", { align: "center" });
      doc.moveDown(0.3);

      // Stamp placeholder
      const stampSize = 80;
      const stampX = (doc.page.width - stampSize) / 2;
      doc.roundedRect(stampX, doc.y, stampSize, stampSize, 8).stroke("#16a34a");
      doc.fontSize(9).font("Helvetica").fillColor("#16a34a").text("REGISTERED", stampX, doc.y + 30, {
        width: stampSize,
        align: "center",
      });

      doc.moveDown(5);

      // Footer
      doc.fontSize(8).fillColor("#94a3b8").text("This is an automated stamp card from the Campus Catholic Community registration system.", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
