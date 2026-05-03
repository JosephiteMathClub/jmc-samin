"use client";
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  X,
  FileDown,
  Info
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface BatchMemberUploadProps {
  onComplete: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  addMember: (memberData: any) => Promise<any>;
}

export const BatchMemberUpload: React.FC<BatchMemberUploadProps> = ({
  onComplete,
  showToast,
  addMember
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
    logs: string[];
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const templateData = [
        {
          "Full Name": "John Doe",
          "Email": "john@example.com",
          "Phone": "01712345678",
          "Class": "10",
          "Section": "A",
          "Roll": "01"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Members");
      XLSX.writeFile(wb, "JMC_Batch_Upload_Template.xlsx");
    } catch (err: any) {
      showToast("Could not load spreadsheet library", "error");
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setResults(null);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          throw new Error("The file appears to be empty.");
        }

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];
        const logs: string[] = [];

        for (let index = 0; index < jsonData.length; index++) {
          const row = jsonData[index];
          const rowNum = index + 1;
          const email = row.Email || row.email;
          const fullName = row["Full Name"] || row.full_name || row.Name || row.name;
          const phone = String(row.Phone || row.phone || "");
          const classVal = String(row.Class || row.class || "");
          const sectionVal = String(row.Section || row.section || "");
          const rollVal = String(row.Roll || row.roll || "");

          if (!email || !fullName || !phone) {
            failCount++;
            errors.push(`Row ${rowNum}: Missing required fields (Name, Email, or Phone)`);
            continue;
          }

          try {
            // 1. Check if user already exists in profiles
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', email.toLowerCase().trim())
              .single();

            if (profile) {
              logs.push(`Row ${rowNum}: Existing account found for ${email}. Updating member info.`);
              await addMember({
                full_name: fullName,
                email: email.toLowerCase().trim(),
                class: classVal,
                section: sectionVal,
                roll: rollVal,
                hasAccount: true
              });
            } else {
              logs.push(`Row ${rowNum}: No account found for ${email}. Creating new account...`);
              await addMember({
                full_name: fullName,
                email: email.toLowerCase().trim(),
                phone: phone,
                class: classVal,
                section: sectionVal,
                roll: rollVal,
                hasAccount: false
              });
            }
            successCount++;
          } catch (err: any) {
            failCount++;
            errors.push(`Row ${rowNum} (${email}): ${err.message || "Failed to process"}`);
          }
        }

        setResults({
          success: successCount,
          failed: failCount,
          errors,
          logs
        });
        
        if (failCount === 0) {
          showToast(`Successfully processed ${successCount} members`, "success");
        } else {
          showToast(`Processed ${successCount} members, but ${failCount} failed.`, "error");
        }
        
        onComplete();
      } catch (err: any) {
        showToast(`Error processing file: ${err.message}`, "error");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {!results ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-amber-500" />
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-relaxed">
                Download the template and fill it with member details.<br />
                Account creation uses phone number as default password.
              </p>
            </div>
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shrink-0"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative group cursor-pointer ${isProcessing ? 'pointer-events-none' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            
            <div className={`
              border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
              ${dragActive ? 'border-amber-500 bg-amber-500/10 scale-[0.99]' : 'border-white/10 bg-white/[0.02] hover:border-amber-500/30'}
            `}>
              <div className="flex flex-col items-center gap-4">
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500
                  ${isProcessing ? 'bg-amber-500' : 'bg-white/5 text-zinc-500 group-hover:text-amber-500 group-hover:bg-amber-500/10'}
                `}>
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 text-black animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                    {isProcessing ? 'Processing Spreadsheet...' : 'Upload Excel Spreadsheet'}
                  </h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Drag and drop or click to browse files (.xlsx, .csv)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Upload Results</h4>
            <button 
              onClick={() => setResults(null)}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Successful</span>
              </div>
              <span className="text-2xl font-display font-bold text-white">{results.success}</span>
            </div>
            <div className={`p-4 rounded-xl bg-red-500/5 border border-red-500/10 ${results.failed === 0 ? 'opacity-40' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Failed</span>
              </div>
              <span className="text-2xl font-display font-bold text-white">{results.failed}</span>
            </div>
          </div>

          {(results.errors.length > 0 || results.logs.length > 0) && (
            <div className="space-y-4">
              <div className="max-h-[200px] overflow-y-auto rounded-xl bg-black/40 border border-white/5 p-4 space-y-2 custom-scrollbar">
                {results.logs.map((log, i) => (
                  <p key={i} className="text-[9px] font-mono text-zinc-400 leading-relaxed border-l border-white/10 pl-3">
                    {log}
                  </p>
                ))}
                {results.errors.map((error, i) => (
                  <p key={i} className="text-[9px] font-mono text-red-400 leading-relaxed border-l border-red-500/30 pl-3">
                    ERROR: {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button 
              onClick={() => setResults(null)}
              className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Finish & Clear
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
