import { useState, useRef, useCallback } from "react";
import { memberService } from "../../../api/jumuiyaMemberService";
import { Upload, Plus, Trash2, FileSpreadsheet, CheckCircle, AlertTriangle, X } from "lucide-react";
import * as XLSX from "xlsx";

interface Props {
  jumuiyaId: string;
  seasonId?: number;
}

const JUMUIYA_NAME_MAP: Record<string, string> = {
  "st-anthony": "St. Anthony",
  "st-augustine": "St. Augustine",
  "st-catherine": "St. Catherine",
  "st-dominic": "St. Dominic",
  "st-elizabeth": "St. Elizabeth",
  "st-maria-goretti": "St. Maria Goretti",
  "st-monica": "St. Monica",
};

const TEMPLATE_HEADERS = ["Name", "RegistrationNumber", "Gender", "Phone", "Email"];

const emptyRow = { name: "", regNumber: "", gender: "", jumuiya: "", phone: "", email: "" };

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
};

const normalizeHeader = (h: string): string =>
  h.replace(/[\s_-]+/g, "").toLowerCase();

const KNOWN_HEADERS: Record<string, string> = {
  name: "name", fullname: "name", names: "name",
  registrationnumber: "regNumber", regnumber: "regNumber", regno: "regNumber", registration: "regNumber",
  gender: "gender", sex: "gender",
  phone: "phone", telephone: "phone", mobile: "phone", phonenumber: "phone", contact: "phone",
  email: "email", emailaddress: "email", mail: "email", "e-mail": "email",
};

const mapRow = (obj: Record<string, string>) => {
  const row: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const norm = normalizeHeader(key);
    const mapped = KNOWN_HEADERS[norm];
    if (mapped && !row[mapped]) row[mapped] = obj[key] || "";
  }
  return {
    name: row.name || "",
    regNumber: row.regNumber || "",
    gender: row.gender || "",
    phone: row.phone || "",
    email: row.email || "",
    jumuiya: "",
  };
};

const currentYear = new Date().getFullYear();
const ACADEMIC_YEARS = Array.from({ length: 10 }, (_, i) => {
  const start = currentYear - 7 + i;
  return `${start}-${start + 1}`;
}).filter(y => {
  const s = parseInt(y.split("-")[0]);
  return s >= 2018 && s <= currentYear + 1;
});

const MemberImportForm: React.FC<Props> = ({ jumuiyaId, seasonId }) => {
  const jumuiyaName = JUMUIYA_NAME_MAP[jumuiyaId] || jumuiyaId;

  const [mode, setMode] = useState<"manual" | "upload">("manual");
  const [members, setMembers] = useState<any[]>([{ ...emptyRow, jumuiya: jumuiyaName }]);
  const [importing, setImporting] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [importYear, setImportYear] = useState(ACADEMIC_YEARS[ACADEMIC_YEARS.length - 1] || "");
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const fillJumuiya = (data: any[]) => data.map((m) => ({ ...m, jumuiya: m.jumuiya || jumuiyaName }));

  const hasValidationErrors = validationResults?.summary?.error > 0;

  const handleMemberChange = (index: number, field: string, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
    if (validationResults) setValidationResults(null);
  };

  const addRow = () => {
    setMembers([...members, { ...emptyRow, jumuiya: jumuiyaName }]);
  };

  const removeRow = (index: number) => {
    if (members.length > 1) setMembers(members.filter((_, i) => i !== index));
  };

  const filterEmptyRows = (rows: any[]) =>
    rows.filter(r => r.regNumber?.trim() || r.name?.trim() || r.gender?.trim());

  const parseCSV = useCallback((text: string): any[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");
    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ""; });
      return mapRow(obj);
    });
    return filterEmptyRows(rows);
  }, []);

  const parseExcel = useCallback((data: ArrayBuffer): any[] => {
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
    return filterEmptyRows(rows.map(mapRow));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const isExcel = /\.xlsx?$/i.test(file.name);
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = parseExcel(evt.target?.result as ArrayBuffer);
          if (parsed.length === 0) { setError("Excel file has no data rows"); return; }
          setMembers(fillJumuiya(parsed));
        } catch (err: any) { setError(err?.message || "Failed to parse Excel file"); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = parseCSV(evt.target?.result as string);
          if (parsed.length === 0) { setError("CSV has no data rows"); return; }
          setMembers(fillJumuiya(parsed));
        } catch (err: any) { setError(err?.message || "Failed to parse CSV file"); }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUploadWithClear = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationResults(null);
    handleFileUpload(e);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_HEADERS.map(() => "")]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${jumuiyaId}-member-import-template.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleValidate = async () => {
    setError(null);
    setValidationResults(null);
    try {
      const res = await memberService.validateImportData(jumuiyaId, fillJumuiya(members));
      setValidationResults(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Validation failed");
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const res = await memberService.importMembers(jumuiyaId, {
        members: fillJumuiya(members),
        season_id: seasonId,
        file_name: mode === "upload" ? "csv-upload" : "manual-entry",
        academic_year: importYear || undefined,
      });
      setImportResult(res.data);
      setValidationResults(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setMembers([{ ...emptyRow, jumuiya: jumuiyaName }]);
    setValidationResults(null);
    setImportResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Import Members</h3>
          <p className="text-xs text-slate-500">
            Adding members to <span className="font-semibold text-indigo-600">{jumuiyaName}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setMode("manual"); setError(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            mode === "manual" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          <Plus size={14} /> Manual Entry
        </button>
        <button
          onClick={() => { setMode("upload"); setError(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            mode === "upload" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          <Upload size={14} /> CSV Upload
        </button>
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors">
          <FileSpreadsheet size={14} /> Download Template
        </button>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Academic Year:</label>
          <select value={importYear} onChange={(e) => setImportYear(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
            <option value="">Select</option>
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Upload area */}
      {mode === "upload" && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
          <Upload size={28} className="text-slate-300 mx-auto mb-3" />
          <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileUploadWithClear} className="mb-2 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100" />
          <p className="text-xs text-slate-400">Supports CSV (.csv) and Excel (.xlsx / .xls). All rows assigned to {jumuiyaName}. Columns: Name, RegistrationNumber, Gender, Phone, Email</p>
        </div>
      )}

      {/* Members table (scrollable) */}
      <div className="rounded-xl border border-slate-200">
        <div ref={tableScrollRef} className="max-h-64 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">#</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Reg #</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Gender</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Phone</th>
                <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Email</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="py-2 px-3">
                    <input value={m.name} onChange={(e) => handleMemberChange(i, "name", e.target.value)} placeholder="Full name"
                      className="w-36 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                  </td>
                  <td className="py-2 px-3">
                    <input value={m.regNumber} onChange={(e) => handleMemberChange(i, "regNumber", e.target.value)} placeholder="CS01/A/2024/01"
                      className="w-32 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                  </td>
                  <td className="py-2 px-3">
                    <select value={m.gender} onChange={(e) => handleMemberChange(i, "gender", e.target.value)}
                      className="w-24 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Ladies</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input value={m.phone} onChange={(e) => handleMemberChange(i, "phone", e.target.value)} placeholder="+254..."
                      className="w-28 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                  </td>
                  <td className="py-2 px-3">
                    <input value={m.email} onChange={(e) => handleMemberChange(i, "email", e.target.value)} placeholder="email"
                      className="w-32 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                  </td>
                  <td className="py-2 px-3">
                    <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Badge showing assigned Jumuiya */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
        <CheckCircle size={14} className="text-emerald-500" />
        All members will be assigned to <span className="font-semibold text-slate-700">{jumuiyaName}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {mode === "manual" && (
          <button onClick={addRow} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors">
            <Plus size={14} /> Add Row
          </button>
        )}
        <button onClick={handleValidate} disabled={importing} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors disabled:opacity-50">
          <CheckCircle size={14} /> Validate
        </button>
        <button onClick={handleImport} disabled={importing || !validationResults || hasValidationErrors}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg transition-colors"
          title={!validationResults ? "Run validation first" : hasValidationErrors ? "Fix validation errors before importing" : ""}>
          {importing ? "Importing..." : "Import Members"}
        </button>
        <button onClick={resetForm} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors">
          Reset
        </button>
      </div>

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <CheckCircle size={16} className="text-indigo-500" /> Validation Results
          </h4>
          <div className="flex gap-3 text-sm">
            <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium">Valid: {validationResults.summary.valid}</span>
            {(validationResults.summary.warning || 0) > 0 && (
              <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-medium">Warnings: {validationResults.summary.warning}</span>
            )}
            {(validationResults.summary.error || 0) > 0 && (
              <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full font-medium">Errors: {validationResults.summary.error}</span>
            )}
          </div>
          {validationResults.results?.filter((r: any) => r.status !== "valid").length > 0 && (
            <div className="space-y-1.5">
              {validationResults.results.filter((r: any) => r.status !== "valid").map((r: any, i: number) => (
                <div key={i} className={`px-3 py-2 rounded-lg text-xs ${
                  r.status === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                }`}>
                  <strong>Row {r.row}:</strong> {r.errors?.join("; ") || r.warnings?.join("; ")}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
            <CheckCircle size={18} /> Import Complete
          </div>
          <div className="text-sm text-emerald-700 space-y-1">
            <p>Total: <strong>{importResult.summary.total}</strong> | Valid: <strong>{importResult.summary.valid}</strong> | Errors: <strong>{importResult.summary.errors}</strong></p>
            {importResult.import?.id && <p className="text-xs opacity-75">Import ID: #{importResult.import.id}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberImportForm;
